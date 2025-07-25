import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../db.js";

const router = Router();

// Mobile OAuth start endpoint - initiates OAuth flow with proper redirect
router.get("/mobile/start", async (req, res) => {
    const { session, challenge } = req.query;
    
    if (!session || !challenge) {
        return res.status(400).json({ message: "Missing session or challenge parameter" });
    }
    
    try {
        // Store the session for polling
        if (!global.oauthSessions) {
            global.oauthSessions = new Map();
        }
        
        global.oauthSessions.set(challenge, {
            status: 'pending',
            timestamp: Date.now(),
            session: session
        });
        
        // Build Google OAuth URL with web client (same as frontend)
        const clientId = process.env.GOOGLE_CLIENT_ID || "1064619689471-mrna5dje1h4ojt62d9ckmqi3e8q07sjc.apps.googleusercontent.com";
        const redirectUri = `https://server.be-out-app.dedibox2.philippezenone.net/auth/desktop/google/callback`;
        const scope = "openid email profile";
        
        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", scope);
        authUrl.searchParams.set("state", challenge); // Use challenge as state
        authUrl.searchParams.set("access_type", "offline");
        
        // Add mobile-friendly parameters
        authUrl.searchParams.set("prompt", "select_account");
        authUrl.searchParams.set("include_granted_scopes", "true");
        
        // Redirect user to Google OAuth
        res.redirect(authUrl.toString());
        
    } catch (error) {
        console.error("Error starting mobile OAuth:", error);
        res.status(500).json({ message: "Failed to start OAuth flow" });
    }
});

// Desktop/Mobile OAuth token exchange for Google
router.post("/desktop/google/token", async (req, res) => {
    // Use the extracted function for consistency
    await exchangeGoogleToken(req, res);
});

// Desktop OAuth token exchange for Facebook (if needed)
router.post("/desktop/facebook/token", async (req, res) => {
    // Similar implementation for Facebook
    res.status(501).json({ message: "Facebook desktop OAuth not implemented yet" });
});

// Apple Sign In token verification
router.post("/desktop/apple/token", async (req, res) => {
    const { identityToken, authorizationCode } = req.body;

    if (!identityToken) {
        return res.status(400).json({ message: "Missing identity token" });
    }

    try {
        // Verify the Apple identity token
        // Note: In a production app, you should verify the token signature using Apple's public keys
        // For now, we'll decode the JWT without verification (not recommended for production)
        const decodedToken = jwt.decode(identityToken);

        if (!decodedToken || !decodedToken.email) {
            return res.status(400).json({ message: "Invalid Apple identity token" });
        }

        console.log("Apple Sign In user:", {
            email: decodedToken.email,
            sub: decodedToken.sub,
            email_verified: decodedToken.email_verified,
        });

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Check if user exists with Apple provider
            let userResult = await client.query("SELECT * FROM users WHERE provider = $1 AND provider_id = $2", [
                "apple",
                decodedToken.sub,
            ]);

            let user;
            if (userResult.rows.length > 0) {
                // User exists with Apple provider
                user = userResult.rows[0];
                await client.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);
            } else {
                // Check if user exists with this email from another provider
                userResult = await client.query("SELECT * FROM users WHERE email = $1", [decodedToken.email]);

                if (userResult.rows.length > 0) {
                    // User exists with different provider, link Apple account
                    const existingUser = userResult.rows[0];
                    const updatedUserResult = await client.query(
                        "UPDATE users SET provider = $1, provider_id = $2, last_login = NOW() WHERE id = $3 RETURNING *",
                        ["apple", decodedToken.sub, existingUser.id]
                    );
                    user = updatedUserResult.rows[0];
                } else {
                    // Create new user with Apple provider
                    const result = await client.query(
                        "INSERT INTO users (email, password_hash, role, is_verified, provider, provider_id, last_login) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *",
                        [decodedToken.email, null, "user", true, "apple", decodedToken.sub]
                    );
                    user = result.rows[0];

                    // Create user profile with name from Apple (if provided)
                    const firstName = decodedToken.given_name || "";
                    const lastName = decodedToken.family_name || "";

                    await client.query(
                        "INSERT INTO user_profiles (user_id, first_name, last_name) VALUES ($1, $2, $3)",
                        [user.id, firstName, lastName]
                    );
                }
            }

            await client.query("COMMIT");

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                },
                process.env.JWT_SECRET,
                { expiresIn: "24h" }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (dbError) {
            await client.query("ROLLBACK");
            console.error("Database error:", dbError);
            res.status(500).json({ message: "Database error" });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Apple OAuth error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// In-memory store for OAuth sessions (in production, use Redis or database)
const oauthSessions = new Map();

// Mobile OAuth callback endpoint
router.get("/mobile/callback", async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        console.error("OAuth error:", error);
        return res.status(400).send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h2>OAuth Error</h2>
                    <p>Authentication failed: ${error}</p>
                    <p>You can close this window and try again in the app.</p>
                </body>
            </html>
        `);
    }

    if (!code) {
        return res.status(400).send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h2>OAuth Error</h2>
                    <p>No authorization code received.</p>
                    <p>You can close this window and try again in the app.</p>
                </body>
            </html>
        `);
    }

    try {
        // Find the session by state parameter (if provided) or latest session
        let sessionData = null;
        if (state) {
            sessionData = oauthSessions.get(state);
        } else {
            // Fallback: find the most recent session
            const sessions = Array.from(oauthSessions.values());
            sessionData = sessions.sort((a, b) => b.timestamp - a.timestamp)[0];
        }

        if (!sessionData) {
            return res.status(400).send(`
                <html>
                    <body style="font-family: Arial; text-align: center; padding: 50px;">
                        <h2>Session Error</h2>
                        <p>OAuth session not found or expired.</p>
                        <p>You can close this window and try again in the app.</p>
                    </body>
                </html>
            `);
        }

        // Process the OAuth callback using existing token exchange logic
        const tokenRequest = {
            body: {
                code,
                codeVerifier: sessionData.codeVerifier,
                redirectUri: `${req.protocol}://${req.get('host')}/auth/mobile/callback`,
                clientId: sessionData.clientId
            }
        };

        // Create a mock response object to capture the result
        let authResult = null;
        let authError = null;

        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    if (code >= 400) {
                        authError = data;
                    } else {
                        authResult = data;
                    }
                    return mockRes;
                }
            }),
            json: (data) => {
                authResult = data;
                return mockRes;
            }
        };

        // Call the existing token exchange logic
        await exchangeGoogleToken(tokenRequest, mockRes);

        if (authError) {
            // Store error in session for polling
            sessionData.status = 'error';
            sessionData.error = authError.message || 'Authentication failed';
            oauthSessions.set(sessionData.challenge, sessionData);

            return res.status(400).send(`
                <html>
                    <body style="font-family: Arial; text-align: center; padding: 50px;">
                        <h2>Authentication Failed</h2>
                        <p>${authError.message || 'Unknown error occurred'}</p>
                        <p>You can close this window and try again in the app.</p>
                    </body>
                </html>
            `);
        }

        if (authResult) {
            // Store success result in session for polling
            sessionData.status = 'completed';
            sessionData.result = authResult;
            oauthSessions.set(sessionData.challenge, sessionData);

            return res.send(`
                <html>
                    <body style="font-family: Arial; text-align: center; padding: 50px;">
                        <h2>✅ Success!</h2>
                        <p>You have been successfully signed in.</p>
                        <p>You can now close this window and return to the app.</p>
                        <script>
                            // Auto-close after 3 seconds
                            setTimeout(() => {
                                window.close();
                            }, 3000);
                        </script>
                    </body>
                </html>
            `);
        }

    } catch (error) {
        console.error("Mobile OAuth callback error:", error);
        return res.status(500).send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h2>Server Error</h2>
                    <p>An unexpected error occurred.</p>
                    <p>You can close this window and try again in the app.</p>
                </body>
            </html>
        `);
    }
});

// Desktop Google OAuth callback
router.get("/desktop/google/callback", async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        console.error("Desktop OAuth error:", error);
        return res.status(400).send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h2>OAuth Error</h2>
                    <p>Authentication failed: ${error}</p>
                    <p>You can close this window and return to the app.</p>
                </body>
            </html>
        `);
    }

    if (!code) {
        return res.status(400).send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h2>OAuth Error</h2>
                    <p>No authorization code received.</p>
                    <p>You can close this window and return to the app.</p>
                </body>
            </html>
        `);
    }

    try {
        // Find the session by state parameter
        if (!global.oauthSessions) {
            global.oauthSessions = new Map();
        }
        
        const sessionData = global.oauthSessions.get(state);

        if (!sessionData) {
            return res.status(400).send(`
                <html>
                    <body style="font-family: Arial; text-align: center; padding: 50px;">
                        <h2>Session Error</h2>
                        <p>OAuth session not found or expired.</p>
                        <p>You can close this window and return to the app.</p>
                    </body>
                </html>
            `);
        }

        // Exchange the authorization code for tokens
        const clientId = process.env.GOOGLE_CLIENT_ID || "1064619689471-mrna5dje1h4ojt62d9ckmqi3e8q07sjc.apps.googleusercontent.com";
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = `https://server.be-out-app.dedibox2.philippezenone.net/auth/desktop/google/callback`;

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: "authorization_code",
                redirect_uri: redirectUri,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            throw new Error(tokenData.error_description || "Token exchange failed");
        }

        // Get user info from Google
        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
            throw new Error("Failed to fetch user data");
        }

        // Create/update user in database
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            let userResult = await client.query("SELECT * FROM users WHERE provider = $1 AND provider_id = $2", [
                "google",
                userData.id,
            ]);

            let user;
            if (userResult.rows.length > 0) {
                user = userResult.rows[0];
                await client.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);
            } else {
                userResult = await client.query("SELECT * FROM users WHERE email = $1", [userData.email]);

                if (userResult.rows.length > 0) {
                    const existingUser = userResult.rows[0];
                    const updatedUserResult = await client.query(
                        "UPDATE users SET provider = $1, provider_id = $2, last_login = NOW() WHERE id = $3 RETURNING *",
                        ["google", userData.id, existingUser.id]
                    );
                    user = updatedUserResult.rows[0];
                } else {
                    const result = await client.query(
                        "INSERT INTO users (email, password_hash, role, is_verified, provider, provider_id, last_login) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *",
                        [userData.email, null, "user", true, "google", userData.id]
                    );
                    user = result.rows[0];
                }
            }

            await client.query("COMMIT");

            // Generate JWT token
            const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });

            // Store success result in session for polling
            sessionData.status = 'completed';
            sessionData.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                isVerified: user.is_verified,
                provider: user.provider,
                createdAt: user.created_at,
                lastLogin: user.last_login,
            };
            sessionData.token = token;
            global.oauthSessions.set(state, sessionData);

            return res.send(`
                <html>
                    <body style="font-family: Arial; text-align: center; padding: 50px;">
                        <h2>✅ Success!</h2>
                        <p>Welcome, ${userData.name}!</p>
                        <p>You have been successfully signed in with Google.</p>
                        <p>You can now close this window and return to the app.</p>
                        <script>
                            // Auto-close after 3 seconds
                            setTimeout(() => {
                                window.close();
                            }, 3000);
                        </script>
                    </body>
                </html>
            `);

        } catch (dbError) {
            await client.query("ROLLBACK");
            throw dbError;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error("Desktop OAuth callback error:", error);
        
        // Store error in session for polling
        if (state && global.oauthSessions.has(state)) {
            const sessionData = global.oauthSessions.get(state);
            sessionData.status = 'error';
            sessionData.error = error.message || 'Authentication failed';
            global.oauthSessions.set(state, sessionData);
        }
        
        return res.status(500).send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h2>Authentication Error</h2>
                    <p>An error occurred during authentication.</p>
                    <p>You can close this window and try again in the app.</p>
                </body>
            </html>
        `);
    }
});

// Mobile OAuth polling endpoint
router.get("/mobile/poll/:challenge", async (req, res) => {
    const { challenge } = req.params;

    if (!global.oauthSessions) {
        global.oauthSessions = new Map();
    }

    const sessionData = global.oauthSessions.get(challenge);

    if (!sessionData) {
        return res.json({ status: 'expired' });
    }

    // Clean up expired sessions (older than 10 minutes)
    const now = Date.now();
    if (now - sessionData.timestamp > 10 * 60 * 1000) {
        global.oauthSessions.delete(challenge);
        return res.json({ status: 'expired' });
    }

    if (sessionData.status === 'completed') {
        // Clean up successful session
        global.oauthSessions.delete(challenge);
        return res.json({
            status: 'completed',
            user: sessionData.user,
            token: sessionData.token
        });
    }

    if (sessionData.status === 'error') {
        // Clean up error session
        global.oauthSessions.delete(challenge);
        return res.json({
            status: 'error',
            error: sessionData.error
        });
    }

    // Still pending
    return res.json({ status: 'pending' });
});

// Endpoint to register OAuth session for mobile polling
router.post("/mobile/session", async (req, res) => {
    const { challenge, codeVerifier, clientId } = req.body;

    if (!challenge || !codeVerifier) {
        return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Store session data for polling
    oauthSessions.set(challenge, {
        challenge,
        codeVerifier,
        clientId,
        status: 'pending',
        timestamp: Date.now()
    });

    res.json({ success: true });
});

// Extract the token exchange logic to a reusable function
async function exchangeGoogleToken(req, res) {
    const { code, codeVerifier, redirectUri, clientId } = req.body;

    if (!code || !codeVerifier) {
        return res.status(400).json({ message: "Missing required parameters" });
    }

    try {
        // Use the provided client ID or fall back to environment variables
        const googleClientId = clientId || process.env.GOOGLE_CLIENT_ID_DESKTOP || process.env.GOOGLE_CLIENT_ID;

        // Exchange authorization code for tokens with Google
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: googleClientId,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code,
                grant_type: "authorization_code",
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
            }),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error("Google token exchange failed:", error);
            return res.status(400).json({ message: "Token exchange failed", details: error });
        }

        const tokens = await tokenResponse.json();

        // Get user info from Google
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        if (!userInfoResponse.ok) {
            return res.status(400).json({ message: "Failed to get user info" });
        }

        const googleUser = await userInfoResponse.json();
        const { id, email, name } = googleUser;
        const provider = "google";

        // Find or create user in database
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Check if user exists with this provider and provider_id
            let userResult = await client.query("SELECT * FROM users WHERE provider = $1 AND provider_id = $2", [
                provider,
                id,
            ]);

            let user;
            if (userResult.rows.length > 0) {
                user = userResult.rows[0];
                await client.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);
            } else {
                // Check if user exists with this email
                userResult = await client.query("SELECT * FROM users WHERE email = $1", [email]);
                if (userResult.rows.length > 0) {
                    // User exists, link social account
                    const existingUser = userResult.rows[0];
                    const updatedUserResult = await client.query(
                        "UPDATE users SET provider = $1, provider_id = $2, last_login = NOW() WHERE id = $3 RETURNING *",
                        [provider, id, existingUser.id]
                    );
                    user = updatedUserResult.rows[0];
                } else {
                    // Create new user
                    const newUserResult = await client.query(
                        "INSERT INTO users (email, provider, provider_id, role, last_login) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
                        [email, provider, id, "user"]
                    );
                    user = newUserResult.rows[0];

                    // Create user profile
                    const nameParts = (name || email).split(" ");
                    await client.query(
                        "INSERT INTO user_profiles (user_id, first_name, last_name) VALUES ($1, $2, $3)",
                        [user.id, nameParts[0] || "", nameParts[1] || ""]
                    );
                }
            }

            await client.query("COMMIT");

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                },
                process.env.JWT_SECRET,
                { expiresIn: "24h" }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (dbError) {
            await client.query("ROLLBACK");
            console.error("Database error:", dbError);
            res.status(500).json({ message: "Database error" });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("OAuth error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default router;
