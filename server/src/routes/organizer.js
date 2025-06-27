import { Router } from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";

const router = Router();

// Middleware to verify organizer token
const verifyOrganizerToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access token required" });
    }

    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify user is an organizer
        const client = await pool.connect();
        try {
            const result = await client.query("SELECT * FROM users WHERE id = $1 AND role = 'organizer'", [
                decoded.userId,
            ]);
            if (result.rows.length === 0) {
                return res.status(403).json({ message: "Organizer access required" });
            }
            req.user = result.rows[0];
            next();
        } finally {
            client.release();
        }
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// Get organizer profile
router.get("/profile", verifyOrganizerToken, async (req, res) => {
    try {
        res.json({
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            created_at: req.user.created_at,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Error fetching profile" });
    }
});

// Get organizer profile details
router.get("/profile/details", verifyOrganizerToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT op.*, oa.onboarding_completed, oa.payouts_enabled
                 FROM organizer_profiles op
                 LEFT JOIN organizer_accounts oa ON op.user_id = oa.user_id
                 WHERE op.user_id = $1`,
                [req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: "Organizer profile not found" });
            }

            res.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching organizer profile:", error);
        res.status(500).json({ message: "Error fetching organizer profile" });
    }
});

// Update organizer profile details
router.put("/profile/details", verifyOrganizerToken, async (req, res) => {
    const {
        company_name,
        contact_person,
        phone,
        website_url,
        description,
        business_address,
        business_city,
        business_postal_code,
        business_country,
    } = req.body;

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `UPDATE organizer_profiles
                 SET company_name = $1, contact_person = $2, phone = $3, website_url = $4,
                     description = $5, business_address = $6, business_city = $7,
                     business_postal_code = $8, business_country = $9, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $10
                 RETURNING *`,
                [
                    company_name,
                    contact_person,
                    phone,
                    website_url,
                    description,
                    business_address,
                    business_city,
                    business_postal_code,
                    business_country,
                    req.user.id,
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: "Organizer profile not found" });
            }

            res.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error updating organizer profile:", error);
        res.status(500).json({ message: "Error updating organizer profile" });
    }
});

// Get dashboard statistics
router.get("/dashboard/stats", verifyOrganizerToken, async (req, res) => {
    const period = parseInt(req.query.period) || 30;

    try {
        const client = await pool.connect();
        try {
            const result = await client.query("SELECT * FROM get_organizer_stats($1, $2)", [req.user.id, period]);

            res.json(
                result.rows[0] || {
                    total_events: 0,
                    total_bookings: 0,
                    total_revenue: 0,
                    total_tickets_sold: 0,
                    pending_payouts: 0,
                    avg_rating: 0,
                }
            );
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Error fetching dashboard stats" });
    }
});

// Get upcoming events
router.get("/events/upcoming", verifyOrganizerToken, async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    try {
        const client = await pool.connect();
        try {
            const result = await client.query("SELECT * FROM get_organizer_upcoming_events($1, $2)", [
                req.user.id,
                limit,
            ]);

            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching upcoming events:", error);
        res.status(500).json({ message: "Error fetching upcoming events" });
    }
});

// Get recent bookings
router.get("/bookings/recent", verifyOrganizerToken, async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    try {
        const client = await pool.connect();
        try {
            const result = await client.query("SELECT * FROM get_organizer_recent_bookings($1, 30, $2)", [
                req.user.id,
                limit,
            ]);

            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching recent bookings:", error);
        res.status(500).json({ message: "Error fetching recent bookings" });
    }
});

// Get organizer events
router.get("/events", verifyOrganizerToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT e.*, v.name as venue_name,
                        COUNT(DISTINCT b.id) as total_bookings,
                        COALESCE(SUM(b.total_price), 0) as revenue
                 FROM events e
                 LEFT JOIN venues v ON e.venue_id = v.id
                 LEFT JOIN bookings b ON e.id = b.event_id AND b.booking_status = 'confirmed'
                 WHERE e.organizer_id = $1
                 GROUP BY e.id, v.name
                 ORDER BY e.created_at DESC`,
                [req.user.id]
            );

            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Error fetching events" });
    }
});

// Get all bookings for organizer's events
router.get("/bookings", verifyOrganizerToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT b.*, e.title as event_title, e.event_date
                 FROM bookings b
                 JOIN events e ON b.event_id = e.id
                 WHERE e.organizer_id = $1
                 ORDER BY b.booking_date DESC`,
                [req.user.id]
            );

            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Error fetching bookings" });
    }
});

export default router;
