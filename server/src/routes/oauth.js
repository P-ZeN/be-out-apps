import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import "dotenv/config";

const router = express.Router();

// Step 1: The client initiates the login process by redirecting to this endpoint.
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
