import express from "express";
import "dotenv/config";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import setupRoutes from "./routes/setup.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import eventsRoutes from "./routes/events.js";
import bookingsRoutes from "./routes/bookings.js";
import adminRoutes from "./routes/admin.js";
import favoritesRoutes from "./routes/favorites.js";
import paymentsRoutes from "./routes/payments.js";
import webhooksRoutes from "./routes/webhooks.js";
import organizerRoutes from "./routes/organizer.js";
import pool from "./db.js";
import "./passport-setup.js"; // Import passport setup

const app = express();

// CORS configuration - More permissive for testing
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow all subdomains of your domain
        if (origin.includes("be-out-app.dedibox2.philippezenone.net") || origin.includes("localhost")) {
            return callback(null, true);
        }

        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json()); // Middleware to parse JSON bodies

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.get("Origin")}`);
    next();
});

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
app.use("/api/auth", authRoutes);
app.use("/user", profileRoutes);
app.use("/api/user", profileRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/organizer", organizerRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/webhooks", webhooksRoutes);

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

app.get("/test", (req, res) => {
    res.json({
        message: "Test endpoint working",
        timestamp: new Date().toISOString(),
        origin: req.get("Origin"),
        userAgent: req.get("User-Agent"),
    });
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
