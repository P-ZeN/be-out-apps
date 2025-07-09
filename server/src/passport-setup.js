import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import pool from "./db.js";

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        const user = result.rows[0];
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:
                process.env.NODE_ENV === "production"
                    ? "https://server.be-out-app.dedibox2.philippezenone.net/auth/google/callback"
                    : "http://localhost:3000/auth/google/callback",
            scope: ["profile", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
            const { id, displayName, emails } = profile;
            const email = emails[0].value;
            const provider = "google";

            try {
                // 1. Check if user exists with this provider and provider_id
                let userResult = await pool.query("SELECT * FROM users WHERE provider = $1 AND provider_id = $2", [
                    provider,
                    id,
                ]);
                if (userResult.rows.length > 0) {
                    return done(null, userResult.rows[0]);
                }

                // 2. Check if user exists with this email
                userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
                if (userResult.rows.length > 0) {
                    // User exists, link social account
                    const user = userResult.rows[0];
                    const updatedUserResult = await pool.query(
                        "UPDATE users SET provider = $1, provider_id = $2 WHERE id = $3 RETURNING *",
                        [provider, id, user.id]
                    );
                    return done(null, updatedUserResult.rows[0]);
                }

                // 3. Create new user
                const newUserResult = await pool.query(
                    "INSERT INTO users (email, provider, provider_id, role) VALUES ($1, $2, $3, $4) RETURNING *",
                    [email, provider, id, "user"]
                );
                const newUser = newUserResult.rows[0];
                await pool.query("INSERT INTO user_profiles (user_id, first_name, last_name) VALUES ($1, $2, $3)", [
                    newUser.id,
                    displayName.split(" ")[0],
                    displayName.split(" ")[1] || "",
                ]);
                return done(null, newUser);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

// Facebook Strategy
passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: "/auth/facebook/callback",
            profileFields: ["id", "displayName", "emails"],
        },
        async (accessToken, refreshToken, profile, done) => {
            const { id, displayName, emails } = profile;
            const email = emails ? emails[0].value : `${id}@facebook.com`;
            const provider = "facebook";

            try {
                // 1. Check if user exists with this provider and provider_id
                let userResult = await pool.query("SELECT * FROM users WHERE provider = $1 AND provider_id = $2", [
                    provider,
                    id,
                ]);
                if (userResult.rows.length > 0) {
                    return done(null, userResult.rows[0]);
                }

                // 2. Check if user exists with this email
                userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
                if (userResult.rows.length > 0) {
                    // User exists, link social account
                    const user = userResult.rows[0];
                    const updatedUserResult = await pool.query(
                        "UPDATE users SET provider = $1, provider_id = $2 WHERE id = $3 RETURNING *",
                        [provider, id, user.id]
                    );
                    return done(null, updatedUserResult.rows[0]);
                }

                // 3. Create new user
                const newUserResult = await pool.query(
                    "INSERT INTO users (email, provider, provider_id, role) VALUES ($1, $2, $3, $4) RETURNING *",
                    [email, provider, id, "user"]
                );
                const newUser = newUserResult.rows[0];
                await pool.query("INSERT INTO user_profiles (user_id, first_name, last_name) VALUES ($1, $2, $3)", [
                    newUser.id,
                    displayName.split(" ")[0],
                    displayName.split(" ")[1] || "",
                ]);
                return done(null, newUser);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);
