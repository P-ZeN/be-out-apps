import express from "express";
import "dotenv/config";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import setupRoutes from "./routes/setup.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import pool from "./db.js";
import "./passport-setup.js"; // Import passport setup

const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// Session middleware
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

const port = process.env.PORT || 3000;

app.use("/", setupRoutes);
app.use("/auth", authRoutes);
app.use("/user", profileRoutes);

// Google Auth Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
    // Successful authentication, redirect home.
    res.redirect("/");
});

// Facebook Auth Routes
app.get("/auth/facebook", passport.authenticate("facebook"));
app.get("/auth/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }), (req, res) => {
    // Successful authentication, redirect home.
    res.redirect("/");
});

app.get("/", (req, res) => {
    res.send("Hello from the server! huhuhu");
});

app.get("/db", async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query("SELECT NOW()");
        res.send(result.rows[0]);
        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).send("Error connecting to database");
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
