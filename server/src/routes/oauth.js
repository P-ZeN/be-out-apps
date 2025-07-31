import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { OAuth2Client } from "google-auth-library";
import pool from "../db.js";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID_SERVER);

// New endpoint for mobile authentication
router.post("/google/mobile-callback", async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ message: "ID token is missing." });
    }

    try {
        // Verify the ID token and get user profile
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID_SERVER,
        });
        const payload = ticket.getPayload();

        if (!payload) {
            return res.status(400).json({ message: "Invalid Google token." });
        }

        const { sub: googleId, email, name, picture } = payload;

        // Check if user exists in the database
        let userResult = await pool.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
        let user = userResult.rows[0];

        // If user doesn't exist, create a new one
        if (!user) {
            const newUserResult = await pool.query(
                "INSERT INTO users (google_id, email, full_name, profile_picture_url, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *",
                [googleId, email, name, picture]
            );
            user = newUserResult.rows[0];
        }

        // Generate JWT for our application
        const appTokenPayload = {
            id: user.id,
            email: user.email,
            roles: user.roles, // Make sure your user object has roles
        };

        const appToken = jwt.sign(appTokenPayload, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        // Send the token and user info back to the client
        res.json({
            message: "Authentication successful.",
            token: appToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                profilePictureUrl: user.profile_picture_url,
                roles: user.roles,
            },
        });

    } catch (error) {
        console.error("Error during Google mobile authentication:", error);
        res.status(500).json({ message: "Internal server error during authentication." });
    }
});

// New endpoint for mobile authentication using profile data (for native Android sign-in)
router.post("/google/mobile-profile-callback", async (req, res) => {
    const { email, displayName, givenName, familyName, profilePictureUri } = req.body;

    if (!email || !displayName) {
        return res.status(400).json({ message: "Email and display name are required." });
    }

    try {
        // For mobile profile authentication, we use the email as the unique identifier
        // since we don't have a Google ID from native Android sign-in
        
        // Check if user exists in the database by email and provider
        let userResult = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND provider = $2", 
            [email, 'google']
        );
        let user = userResult.rows[0];

        // If user doesn't exist, create a new one
        if (!user) {
            const newUserResult = await pool.query(
                "INSERT INTO users (email, provider, provider_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *",
                [email, 'google', email] // Use email as provider_id since we don't have Google ID
            );
            user = newUserResult.rows[0];
            
            // Create user profile with the provided data
            await pool.query(
                "INSERT INTO user_profiles (user_id, first_name, last_name, profile_picture, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())",
                [user.id, givenName, familyName, profilePictureUri]
            );
        } else {
            // Update existing user's profile information
            await pool.query(
                "UPDATE user_profiles SET first_name = $1, last_name = $2, profile_picture = $3, updated_at = NOW() WHERE user_id = $4",
                [givenName, familyName, profilePictureUri, user.id]
            );
        }

        // Get updated user with profile data
        const userWithProfileResult = await pool.query(`
            SELECT u.*, up.first_name, up.last_name, up.profile_picture 
            FROM users u 
            LEFT JOIN user_profiles up ON u.id = up.user_id 
            WHERE u.id = $1
        `, [user.id]);
        
        const userWithProfile = userWithProfileResult.rows[0];

        // Generate JWT for our application
        const appTokenPayload = {
            id: userWithProfile.id,
            email: userWithProfile.email,
            role: userWithProfile.role,
        };

        const appToken = jwt.sign(appTokenPayload, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        // Send the token and user info back to the client
        res.json({
            message: "Mobile profile authentication successful.",
            token: appToken,
            user: {
                id: userWithProfile.id,
                email: userWithProfile.email,
                fullName: displayName,
                firstName: userWithProfile.first_name,
                lastName: userWithProfile.last_name,
                profilePictureUrl: userWithProfile.profile_picture,
                role: userWithProfile.role,
            },
        });

    } catch (error) {
        console.error("Error during Google mobile profile authentication:", error);
        res.status(500).json({ message: "Internal server error during authentication." });
    }
});// Step 1: The client initiates the login process by redirecting to this endpoint.
// This will redirect the user to the Google OAuth2 consent screen.
router.get(
    "/google/login",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false, // We are using JWTs, not sessions
    })
);

// Step 2: Google redirects the user to this endpoint after they grant consent.
router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/login/failed", // A route to handle failed authentication
        session: false,
    }),
    (req, res) => {
        // At this point, passport has authenticated the user and the user's
        // profile is available on req.user.

        // Step 3: Generate a JWT for your application
        const payload = {
            id: req.user.id,
            email: req.user.email,
            roles: req.user.roles, // Assuming your user object has roles
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "7d", // Token expires in 7 days
        });

        // Step 4: Redirect back to the Tauri app with the token.
        // The deep link `beout://` must be configured in your Tauri app.
        const deepLink = `beout://oauth/success?token=${token}`;

        res.redirect(deepLink);
    }
);

// A simple route to notify the user if the login failed.
// The client can be redirected here from the passport callback on failure.
router.get("/login/failed", (req, res) => {
    // You can redirect to a specific failure page in your app
    const deepLink = `beout://oauth/failure`;
    res.redirect(deepLink);
});

export default router;
