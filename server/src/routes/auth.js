import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import emailNotificationService from "../services/emailNotificationService.js";

const router = Router();

// Register route
router.post("/register", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const userResult = await client.query(
                "INSERT INTO users (email, password, provider) VALUES ($1, $2, 'email') RETURNING id, email",
                [email, hashedPassword]
            );
            const user = userResult.rows[0];

            // Create minimal user profile - onboarding will complete it
            await client.query("INSERT INTO user_profiles (user_id) VALUES ($1)", [user.id]);

            await client.query("COMMIT");

            // Send welcome email
            try {
                await emailNotificationService.sendWelcomeEmail(user.id, user.email, user.email);
            } catch (error) {
                console.error("Failed to send welcome email:", error);
                // Don't fail registration if email fails
            }

            const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
            res.status(201).json({ token, email: user.email, onboarding_complete: false });
        } catch (err) {
            await client.query("ROLLBACK");
            console.error(err);
            if (err.code === "23505") {
                // Unique violation
                return res.status(409).json({ message: "User with this email already exists" });
            }
            res.status(500).json({ message: "Error registering user" });
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error registering user" });
    }
});

// Login route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send("Email and password are required");
    }

    try {
        const client = await pool.connect();
        try {
            const result = await client.query("SELECT * FROM users WHERE email = $1 AND provider = 'email'", [email]);
            const user = result.rows[0];

            if (!user) {
                return res.status(401).send("Invalid credentials");
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).send("Invalid credentials");
            }

            const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
            res.send({ token, onboarding_complete: user.onboarding_complete });
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error logging in");
    }
});

// Organizer registration route
router.post("/organizer/register", async (req, res) => {
    const { email, password, company_name, contact_person, phone } = req.body;

    if (!email || !password || !company_name || !contact_person) {
        return res.status(400).json({
            message: "Email, password, company name, and contact person are required",
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Create user with organizer role
            const userResult = await client.query(
                "INSERT INTO users (email, password, role, provider) VALUES ($1, $2, 'organizer', 'email') RETURNING id, email",
                [email, hashedPassword]
            );
            const user = userResult.rows[0];

            // Create organizer profile
            await client.query(
                "INSERT INTO organizer_profiles (user_id, company_name, contact_person, phone, status) VALUES ($1, $2, $3, $4, 'pending')",
                [user.id, company_name, contact_person, phone]
            );

            await client.query("COMMIT");

            res.status(201).json({
                message: "Organizer registration successful. Your account is pending approval.",
                email: user.email,
            });
        } catch (err) {
            await client.query("ROLLBACK");
            console.error(err);
            if (err.code === "23505") {
                // Unique violation
                return res.status(409).json({ message: "User with this email already exists" });
            }
            res.status(500).json({ message: "Error registering organizer" });
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error registering organizer" });
    }
});

// Organizer login route
router.post("/organizer/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                "SELECT * FROM users WHERE email = $1 AND role = 'organizer' AND provider = 'email'",
                [email]
            );
            const user = result.rows[0];

            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
                expiresIn: "24h",
            });

            res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error logging in" });
    }
});

// Google ID Token validation endpoint for native mobile auth
router.post("/google/validate", async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ message: "ID token is required" });
    }

    try {
        const { OAuth2Client } = await import('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        // Verify the ID token
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: [
                process.env.GOOGLE_CLIENT_ID, // Web client ID
                process.env.GOOGLE_CLIENT_ID_ANDROID, // Android client ID
                process.env.GOOGLE_CLIENT_ID_DESKTOP // Desktop client ID (if different)
            ].filter(Boolean), // Remove any undefined values
        });

        const payload = ticket.getPayload();
        const { email, name, picture, given_name, family_name, sub: googleId } = payload;

        if (!email) {
            return res.status(400).json({ message: "Email not found in token" });
        }

        // Check if user exists or create new user
        const poolClient = await pool.connect();
        try {
            await poolClient.query("BEGIN");

            let userResult = await poolClient.query(
                "SELECT id, email FROM users WHERE email = $1",
                [email]
            );

            let user;
            if (userResult.rows.length === 0) {
                // Create new user
                userResult = await poolClient.query(
                    "INSERT INTO users (email, provider, google_id) VALUES ($1, 'google', $2) RETURNING id, email",
                    [email, googleId]
                );
                user = userResult.rows[0];

                // Create user profile
                await poolClient.query(
                    "INSERT INTO user_profiles (user_id, first_name, last_name, display_name, profile_picture_url) VALUES ($1, $2, $3, $4, $5)",
                    [user.id, given_name || '', family_name || '', name || '', picture || '']
                );

                // Send welcome email
                try {
                    await emailNotificationService.sendWelcomeEmail(user.id, user.email, name || user.email);
                } catch (error) {
                    console.error("Failed to send welcome email:", error);
                }
            } else {
                user = userResult.rows[0];

                // Update Google ID if not set
                await poolClient.query(
                    "UPDATE users SET google_id = $1 WHERE id = $2 AND google_id IS NULL",
                    [googleId, user.id]
                );

                // Update profile picture if provided
                if (picture) {
                    await poolClient.query(
                        "UPDATE user_profiles SET profile_picture_url = $1 WHERE user_id = $2",
                        [picture, user.id]
                    );
                }
            }

            await poolClient.query("COMMIT");

            // Check if onboarding is complete
            const profileResult = await poolClient.query(
                "SELECT address IS NOT NULL as onboarding_complete FROM user_profiles WHERE user_id = $1",
                [user.id]
            );
            const onboardingComplete = profileResult.rows[0]?.onboarding_complete || false;

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.json({
                token,
                email: user.email,
                onboarding_complete: onboardingComplete,
                user_id: user.id
            });

        } catch (dbError) {
            await poolClient.query("ROLLBACK");
            throw dbError;
        } finally {
            poolClient.release();
        }

    } catch (error) {
        console.error("Google token validation error:", error);

        if (error.message && error.message.includes('Token used too late')) {
            return res.status(401).json({ message: "Token expired" });
        }

        if (error.message && error.message.includes('Wrong recipient')) {
            return res.status(401).json({ message: "Invalid token audience" });
        }

        res.status(500).json({ message: "Token validation failed", error: error.message });
    }
});

export default router;
