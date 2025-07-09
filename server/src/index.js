import express from "express";
import "dotenv/config";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import jwt from "jsonwebtoken";
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

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow localhost variations and production domains
        const allowedOrigins = [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175",
        ];

        if (allowedOrigins.includes(origin) || (origin && origin.includes("dedibox2.philippezenone.net"))) {
            return callback(null, true);
        }

        // For debugging
        console.log("CORS rejected origin:", origin);
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Origin", "Accept"],
};

app.use(cors(corsOptions));
app.use(express.json()); // Middleware to parse JSON bodies

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Referer: ${req.get("referer")}`);
    next();
});

// Session middleware with better configuration for OAuth
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false, // Changed to false for better security
        cookie: {
            secure: false, // Set to true in production with HTTPS
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: "lax", // Important for OAuth redirects
        },
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

// Helper function to determine redirect URL based on environment and user role
const getRedirectUrl = (user, req) => {
    const isProduction = process.env.NODE_ENV === "production";

    // Use environment variables for URLs
    const urls = {
        development: {
            client: process.env.CLIENT_URL_DEV || "http://localhost:5173",
            admin: process.env.ADMIN_URL_DEV || "http://localhost:5174",
            organizer: process.env.ORGANIZER_URL_DEV || "http://localhost:5175",
        },
        production: {
            client: process.env.CLIENT_URL_PROD || "https://app.dedibox2.philippezenone.net",
            admin: process.env.ADMIN_URL_PROD || "https://admin.dedibox2.philippezenone.net",
            organizer: process.env.ORGANIZER_URL_PROD || "https://organizer.dedibox2.philippezenone.net",
        },
    };

    const environment = isProduction ? "production" : "development";
    const currentUrls = urls[environment];

    // Determine redirect based on user role
    switch (user.role) {
        case "admin":
            return currentUrls.admin;
        case "organizer":
            return currentUrls.organizer;
        case "user":
        default:
            return currentUrls.client;
    }
};

// Google Auth Routes - These should be direct navigations, not AJAX requests
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: process.env.CLIENT_URL_DEV || "http://localhost:5173",
    }),
    (req, res) => {
        try {
            // Successful authentication, redirect based on user role and environment
            const user = req.user;
            console.log(`User authenticated: ${user.email} (${user.role})`);
            
            // Generate JWT token for the user
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email, 
                    role: user.role 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            const redirectUrl = getRedirectUrl(user, req);
            console.log(`Redirecting user ${user.email} (${user.role}) to: ${redirectUrl}`);
            
            // Redirect to frontend with token in URL parameters
            res.redirect(`${redirectUrl}?token=${token}`);
        } catch (error) {
            console.error("Error in Google callback:", error);
            res.redirect(process.env.CLIENT_URL_DEV || "http://localhost:5173");
        }
    }
);

// Facebook Auth Routes
app.get("/auth/facebook", passport.authenticate("facebook"));
app.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", {
        failureRedirect: process.env.CLIENT_URL_DEV || "http://localhost:5173",
    }),
    (req, res) => {
        try {
            // Successful authentication, redirect based on user role and environment
            const user = req.user;
            console.log(`User authenticated: ${user.email} (${user.role})`);
            
            // Generate JWT token for the user
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email, 
                    role: user.role 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            const redirectUrl = getRedirectUrl(user, req);
            console.log(`Redirecting user ${user.email} (${user.role}) to: ${redirectUrl}`);
            
            // Redirect to frontend with token in URL parameters
            res.redirect(`${redirectUrl}?token=${token}`);
        } catch (error) {
            console.error("Error in Facebook callback:", error);
            res.redirect(process.env.CLIENT_URL_DEV || "http://localhost:5173");
        }
    }
);

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
