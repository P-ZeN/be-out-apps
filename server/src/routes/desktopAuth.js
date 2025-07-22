import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../db.js";

const router = Router();

// Desktop/Mobile OAuth token exchange for Google
router.post("/desktop/google/token", async (req, res) => {
    const { code, codeVerifier, redirectUri, clientId } = req.body;

    if (!code || !codeVerifier) {
        return res.status(400).json({ message: "Missing required parameters" });
    }

    try {
        // Determine the appropriate redirect URI
        let finalRedirectUri = redirectUri;

        if (redirectUri === "com.beout.app://oauth") {
            // Mobile app deep link
            finalRedirectUri = "com.beout.app://oauth";
        } else if (redirectUri && redirectUri.startsWith("http://127.0.0.1:")) {
            // Desktop app local server
            finalRedirectUri = redirectUri;
        } else {
            // Default fallback
            finalRedirectUri = "urn:ietf:wg:oauth:2.0:oob";
        }

        console.log("OAuth token exchange:", {
            redirectUri: finalRedirectUri,
            clientId: clientId || "default",
            hasCode: !!code,
            hasCodeVerifier: !!codeVerifier,
        });

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
                redirect_uri: finalRedirectUri,
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

        // Find or create user in database (same logic as passport strategy)
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // 1. Check if user exists with this provider and provider_id
            let userResult = await client.query("SELECT * FROM users WHERE provider = $1 AND provider_id = $2", [
                provider,
                id,
            ]);

            let user;
            if (userResult.rows.length > 0) {
                user = userResult.rows[0];
                // Update last login
                await client.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);
            } else {
                // 2. Check if user exists with this email
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
                    // 3. Create new user
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
        console.error("Desktop OAuth error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
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

export default router;
