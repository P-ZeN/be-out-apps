import { Router } from "express";
import pool from "../db.js";
import authenticateToken from "../middleware/authenticateToken.js";

const router = Router();

// Middleware to check admin permissions
const requireAdmin = async (req, res, next) => {
    try {
        // First authenticate the JWT token
        authenticateToken(req, res, () => {
            // Then check if user has admin role
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ error: "Admin authentication required" });
            }

            // Get user role from database
            const checkAdminRole = async () => {
                const client = await pool.connect();
                try {
                    const result = await client.query(
                        "SELECT id, email, role FROM users WHERE id = $1 AND role IN ('admin', 'moderator')",
                        [req.user.userId]
                    );

                    if (result.rows.length === 0) {
                        return res.status(403).json({ error: "Admin access denied" });
                    }

                    req.adminUser = result.rows[0];
                    next();
                } finally {
                    client.release();
                }
            };

            checkAdminRole().catch((err) => {
                console.error("Admin role check error:", err);
                res.status(500).json({ error: "Admin authentication failed" });
            });
        });
    } catch (error) {
        console.error("Admin middleware error:", error);
        res.status(500).json({ error: "Admin authentication failed" });
    }
};

// Get admin profile
router.get("/profile", requireAdmin, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT u.id, u.email, u.role, up.first_name, up.last_name
                 FROM users u
                 LEFT JOIN user_profiles up ON u.id = up.user_id
                 WHERE u.id = $1`,
                [req.user.userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Admin profile not found" });
            }

            res.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching admin profile:", error);
        res.status(500).json({ error: "Failed to fetch admin profile" });
    }
});

// Get admin dashboard statistics
router.get("/dashboard/stats", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        // Get various statistics for the dashboard
        const statsQuery = `
            SELECT
                -- Events stats
                (SELECT COUNT(*) FROM events) as total_events,
                (SELECT COUNT(*) FROM events WHERE status = 'active') as active_events,
                (SELECT COUNT(*) FROM events WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_events_month,

                -- Users stats
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_month,
                (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,

                -- Bookings stats
                (SELECT COUNT(*) FROM bookings) as total_bookings,
                (SELECT COUNT(*) FROM bookings WHERE booking_status = 'confirmed') as confirmed_bookings,
                (SELECT SUM(total_price) FROM bookings WHERE booking_status = 'confirmed') as total_revenue,
                (SELECT COUNT(*) FROM bookings WHERE booking_date >= CURRENT_DATE - INTERVAL '30 days') as new_bookings_month,

                -- Reviews stats
                (SELECT COUNT(*) FROM reviews) as total_reviews,
                (SELECT AVG(rating) FROM reviews) as average_rating
        `;

        const result = await client.query(statsQuery);

        // Log admin action
        await client.query("SELECT log_admin_action($1, $2, $3, NULL, $4)", [
            req.adminUser.id,
            "view_dashboard",
            "dashboard",
            "Viewed admin dashboard statistics",
        ]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    } finally {
        client.release();
    }
});

// Get all events for admin management
router.get("/events", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const { page = 1, limit = 20, status, search, sortBy = "created_at" } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        if (status) {
            whereConditions.push(`e.status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }

        if (search) {
            whereConditions.push(`(e.title ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

        const query = `
            SELECT
                e.*,
                v.name as venue_name,
                v.city as venue_city,
                uc.email as creator_email,
                ua.email as approved_by_email,
                COUNT(DISTINCT b.id) as total_bookings,
                SUM(b.quantity) FILTER (WHERE b.booking_status = 'confirmed') as confirmed_tickets,
                COUNT(DISTINCT r.id) as review_count,
                AVG(r.rating) as average_rating
            FROM events e
            LEFT JOIN venues v ON e.venue_id = v.id
            LEFT JOIN users uc ON e.organizer_id = uc.id
            LEFT JOIN users ua ON e.approved_by = ua.id
            LEFT JOIN bookings b ON e.id = b.event_id
            LEFT JOIN reviews r ON e.id = r.event_id
            ${whereClause}
            GROUP BY e.id, v.id, uc.id, ua.id
            ORDER BY e.${sortBy === "created_at" ? "created_at" : "title"} DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(parseInt(limit), offset);
        const result = await client.query(query, queryParams);

        // Get total count
        const countQuery = `
            SELECT COUNT(DISTINCT e.id) as total
            FROM events e
            LEFT JOIN venues v ON e.venue_id = v.id
            ${whereClause}
        `;
        const countResult = await client.query(countQuery, queryParams.slice(0, -2));

        res.json({
            events: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].total),
                pages: Math.ceil(countResult.rows[0].total / limit),
            },
        });
    } catch (err) {
        console.error("Error fetching admin events:", err);
        res.status(500).json({ error: "Failed to fetch events" });
    } finally {
        client.release();
    }
});

// Update event status
router.patch("/events/:id/status", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { id } = req.params;
        const { status, admin_notes } = req.body;

        if (!["active", "inactive", "cancelled", "pending"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const query = `
            UPDATE events
            SET status = $1,
                admin_notes = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;

        const result = await client.query(query, [status, admin_notes, id]);

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Event not found" });
        }

        // Log admin action
        await client.query("SELECT log_admin_action($1, $2, $3, $4, $5, $6)", [
            req.adminUser.id,
            "update_event_status",
            "event",
            id,
            `Changed event status to ${status}`,
            JSON.stringify({ old_status: result.rows[0].status, new_status: status, admin_notes }),
        ]);

        await client.query("COMMIT");
        res.json(result.rows[0]);
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error updating event status:", err);
        res.status(500).json({ error: "Failed to update event status" });
    } finally {
        client.release();
    }
});

// Get all users for admin management
router.get("/users", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const { page = 1, limit = 20, role, search, sortBy = "created_at" } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        if (role) {
            whereConditions.push(`u.role = $${paramIndex}`);
            queryParams.push(role);
            paramIndex++;
        }

        if (search) {
            whereConditions.push(
                `(u.email ILIKE $${paramIndex} OR up.first_name ILIKE $${paramIndex} OR up.last_name ILIKE $${paramIndex})`
            );
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

        const query = `
            SELECT
                u.*,
                up.first_name,
                up.last_name,
                up.phone,
                COUNT(DISTINCT b.id) as total_bookings,
                SUM(b.total_price) FILTER (WHERE b.booking_status = 'confirmed') as total_spent,
                COUNT(DISTINCT e.id) as events_created,
                COUNT(DISTINCT r.id) as reviews_written
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN bookings b ON u.id = b.user_id
            LEFT JOIN events e ON u.id = e.organizer_id
            LEFT JOIN reviews r ON u.id = r.user_id
            ${whereClause}
            GROUP BY u.id, up.user_id, up.first_name, up.last_name, up.phone
            ORDER BY u.${sortBy === "created_at" ? "created_at" : "email"} DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(parseInt(limit), offset);
        const result = await client.query(query, queryParams);

        // Get total count
        const countQuery = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            ${whereClause}
        `;
        const countResult = await client.query(countQuery, queryParams.slice(0, -2));

        res.json({
            users: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].total),
                pages: Math.ceil(countResult.rows[0].total / limit),
            },
        });
    } catch (err) {
        console.error("Error fetching admin users:", err);
        res.status(500).json({ error: "Failed to fetch users" });
    } finally {
        client.release();
    }
});

// Update user role
router.patch("/users/:id/role", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { id } = req.params;
        const { role } = req.body;

        if (!["user", "admin", "moderator", "organizer"].includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }

        // Don't allow non-admins to create admins
        if (role === "admin" && req.adminUser.role !== "admin") {
            return res.status(403).json({ error: "Only admins can grant admin role" });
        }

        const query = `
            UPDATE users
            SET role = $1
            WHERE id = $2
            RETURNING *
        `;

        const result = await client.query(query, [role, id]);

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "User not found" });
        }

        // Log admin action
        await client.query("SELECT log_admin_action($1, $2, $3, $4, $5, $6)", [
            req.adminUser.id,
            "update_user_role",
            "user",
            id,
            `Changed user role to ${role}`,
            JSON.stringify({ new_role: role, target_user_email: result.rows[0].email }),
        ]);

        await client.query("COMMIT");
        res.json(result.rows[0]);
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error updating user role:", err);
        res.status(500).json({ error: "Failed to update user role" });
    } finally {
        client.release();
    }
});

// Get all bookings for admin management
router.get("/bookings", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const { page = 1, limit = 20, status, search, sortBy = "booking_date" } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        if (status) {
            whereConditions.push(`b.booking_status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }

        if (search) {
            whereConditions.push(
                `(b.booking_reference ILIKE $${paramIndex} OR b.customer_email ILIKE $${paramIndex} OR e.title ILIKE $${paramIndex})`
            );
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

        const query = `
            SELECT
                b.*,
                e.title as event_title,
                e.event_date,
                v.name as venue_name,
                u.email as user_email,
                COUNT(bt.id) as ticket_count
            FROM bookings b
            LEFT JOIN events e ON b.event_id = e.id
            LEFT JOIN venues v ON e.venue_id = v.id
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN booking_tickets bt ON b.id = bt.booking_id
            ${whereClause}
            GROUP BY b.id, e.id, v.id, u.id
            ORDER BY b.${sortBy === "booking_date" ? "booking_date" : "total_price"} DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(parseInt(limit), offset);
        const result = await client.query(query, queryParams);

        // Get total count
        const countQuery = `
            SELECT COUNT(DISTINCT b.id) as total
            FROM bookings b
            LEFT JOIN events e ON b.event_id = e.id
            ${whereClause}
        `;
        const countResult = await client.query(countQuery, queryParams.slice(0, -2));

        res.json({
            bookings: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].total),
                pages: Math.ceil(countResult.rows[0].total / limit),
            },
        });
    } catch (err) {
        console.error("Error fetching admin bookings:", err);
        res.status(500).json({ error: "Failed to fetch bookings" });
    } finally {
        client.release();
    }
});

// Get admin action logs
router.get("/logs", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const { page = 1, limit = 50, action_type, admin_user_id } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        if (action_type) {
            whereConditions.push(`aa.action_type = $${paramIndex}`);
            queryParams.push(action_type);
            paramIndex++;
        }

        if (admin_user_id) {
            whereConditions.push(`aa.admin_user_id = $${paramIndex}`);
            queryParams.push(admin_user_id);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

        const query = `
            SELECT
                aa.id,
                aa.admin_user_id,
                aa.action_type as action,
                aa.target_type,
                aa.target_id,
                aa.description as details,
                aa.metadata,
                aa.ip_address,
                aa.user_agent,
                aa.created_at,
                u.email as admin_email,
                up.first_name as admin_first_name,
                up.last_name as admin_last_name
            FROM admin_actions aa
            LEFT JOIN users u ON aa.admin_user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.role = 'admin'  -- Only show actions by actual admin users
            ${whereConditions.length > 0 ? ` AND ${whereConditions.join(" AND ")}` : ""}
            ORDER BY aa.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(parseInt(limit), offset);
        const result = await client.query(query, queryParams);

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM admin_actions aa
            LEFT JOIN users u ON aa.admin_user_id = u.id
            WHERE u.role = 'admin'  -- Only count actions by actual admin users
            ${whereConditions.length > 0 ? ` AND ${whereConditions.join(" AND ")}` : ""}
        `;
        const countResult = await client.query(countQuery, queryParams.slice(0, -2));

        res.json({
            logs: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].total),
                pages: Math.ceil(countResult.rows[0].total / limit),
            },
        });
    } catch (err) {
        console.error("Error fetching admin logs:", err);
        res.status(500).json({ error: "Failed to fetch admin logs" });
    } finally {
        client.release();
    }
});

export default router;
