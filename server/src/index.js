import express from "express";
import "dotenv/config";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import jwt from "jsonwebtoken";
import path from "path";
import setupRoutes from "./routes/setup.js";
import authRoutes from "./routes/auth.js";
import oauthRoutes from "./routes/oauth.js"; // Import the new OAuth routes
import mobileAuthRoutes from "./routes/mobileAuth.js";
import profileRoutes from "./routes/profile.js";
import eventsRoutes from "./routes/events.js";
import bookingsRoutes from "./routes/bookings.js";
import adminRoutes from "./routes/admin.js";
import favoritesRoutes from "./routes/favorites.js";
import paymentsRoutes from "./routes/payments.js";
import webhooksRoutes from "./routes/webhooks.js";
import organizerRoutes from "./routes/organizer.js";
import addressesRoutes from "./routes/addresses.js";
import emailsRoutes from "./routes/emails.js";
import filesRoutes from "./routes/files.js";
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

        // Check for allowed origins or production domains
        if (allowedOrigins.includes(origin) || (origin && origin.includes("dedibox2.philippezenone.net"))) {
            return callback(null, true);
        }

        // Allow Tauri mobile app origins (they typically start with tauri://)
        if (
            origin &&
            (origin.startsWith("tauri://") ||
                origin.startsWith("http://tauri.localhost") ||
                origin.startsWith("https://tauri.localhost"))
        ) {
            return callback(null, true);
        }

        // Allow file:// protocol for mobile apps
        if (origin && origin.startsWith("file://")) {
            return callback(null, true);
        }

        // Allow capacitor origins for mobile apps
        if (origin && (origin.startsWith("capacitor://") || origin.startsWith("ionic://"))) {
            return callback(null, true);
        }

        // For debugging
        console.log("CORS rejected origin:", origin);
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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

// Serve static files from uploads directory with optimized headers
const uploadsPath = process.env.UPLOAD_PATH || path.join(process.cwd(), "uploads");
app.use(
    "/uploads",
    express.static(uploadsPath, {
        setHeaders: (res, path) => {
            // Add CORS headers for file access
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET");

            // Cache images for 1 year
            if (path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            }

            // Security headers
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("X-Frame-Options", "DENY");
        },
    })
);

const port = process.env.PORT || 3000;

app.use("/api/setup", setupRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes); // Use the new OAuth routes
app.use("/api/auth/mobile", mobileAuthRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/organizer", organizerRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/webhooks", webhooksRoutes);
app.use("/api/emails", emailsRoutes);
app.use("/api/files", filesRoutes);
app.use("/api", addressesRoutes);

// Public translation endpoints for client apps
app.get("/api/translations/:language/:namespace", async (req, res) => {
    try {
        const { language, namespace } = req.params;

        // Validate parameters
        if (!language || !namespace) {
            return res.status(400).json({ error: "Language and namespace are required" });
        }

        // Validate language (allow only specific languages)
        const allowedLanguages = ["en", "fr", "es"];
        if (!allowedLanguages.includes(language)) {
            return res.status(400).json({ error: "Invalid language" });
        }

        // Validate namespace (allow only specific namespaces)
        const allowedNamespaces = [
            "common",
            "auth",
            "home",
            "navigation",
            "onboarding",
            "map",
            "profile",
            "events",
            "bookings",
            "payments",
            "landing",
        ];
        if (!allowedNamespaces.includes(namespace)) {
            return res.status(400).json({ error: "Invalid namespace" });
        }

        // Construct file path
        const filePath = path.join(process.cwd(), "translations", language, `${namespace}.json`);

        // Read and return translation file
        const fs = await import("fs/promises");
        const fileContent = await fs.readFile(filePath, "utf8");
        const translations = JSON.parse(fileContent);

        // Set appropriate headers for caching
        res.setHeader("Cache-Control", "public, max-age=300"); // Cache for 5 minutes
        res.json(translations);
    } catch (error) {
        if (error.code === "ENOENT") {
            return res.status(404).json({ error: "Translation file not found" });
        }
        console.error("Error loading translation:", error);
        res.status(500).json({ error: "Failed to load translation" });
    }
});

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
                    role: user.role,
                },
                process.env.JWT_SECRET,
                { expiresIn: "24h" }
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
                    role: user.role,
                },
                process.env.JWT_SECRET,
                { expiresIn: "24h" }
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
