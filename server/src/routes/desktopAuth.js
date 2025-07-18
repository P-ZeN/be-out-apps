import { Router } from "express";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = Router();

// Desktop OAuth token exchange for Google
router.post("/desktop/google/token", async (req, res) => {
    const { code, codeVerifier, redirectUri } = req.body;

    if (!code || !codeVerifier) {
        return res.status(400).json({ message: "Missing required parameters" });
    }

    try {
        // Exchange authorization code for tokens with Google
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID_DESKTOP || process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code,
                grant_type: "authorization_code",
                redirect_uri: redirectUri || "urn:ietf:wg:oauth:2.0:oob",
                code_verifier: codeVerifier,
            }),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error("Google token exchange failed:", error);
            return res.status(400).json({ message: "Token exchange failed" });
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
            } else {
                // 2. Check if user exists with this email
                userResult = await client.query("SELECT * FROM users WHERE email = $1", [email]);
                if (userResult.rows.length > 0) {
                    // User exists, link social account
                    const existingUser = userResult.rows[0];
                    const updatedUserResult = await client.query(
                        "UPDATE users SET provider = $1, provider_id = $2 WHERE id = $3 RETURNING *",
                        [provider, id, existingUser.id]
                    );
                    user = updatedUserResult.rows[0];
                } else {
                    // 3. Create new user
                    const newUserResult = await client.query(
                        "INSERT INTO users (email, provider, provider_id, role) VALUES ($1, $2, $3, $4) RETURNING *",
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

export default router;
