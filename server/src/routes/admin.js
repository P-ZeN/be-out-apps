import { Router } from "express";
import pool from "../db.js";
import authenticateToken from "../middleware/authenticateToken.js";
import { CategoryService } from "../services/categoryService.js";

const router = Router();

// Middleware to check admin permissions
const requireAdmin = async (req, res, next) => {
    try {
        console.log(`[Auth] Admin middleware called for: ${req.method} ${req.path}`);

        // Use a promise-based approach instead of callback nesting
        return new Promise((resolve, reject) => {
            authenticateToken(req, res, async () => {
                try {
                    // Then check if user has admin role
                    if (!req.user || !req.user.userId) {
                        console.log("Admin middleware: No user or userId found");
                        return res.status(401).json({ error: "Admin authentication required" });
                    }

                    console.log("Admin middleware: Checking role for user:", req.user.userId);

                    // Get user role from database
                    const client = await pool.connect();
                    try {
                        const result = await client.query(
                            "SELECT id, email, role FROM users WHERE id = $1 AND role IN ('admin', 'moderator')",
                            [req.user.userId]
                        );

                        console.log("Admin middleware: User role check result:", result.rows);

                        if (result.rows.length === 0) {
                            console.log("Admin middleware: User not found or not admin/moderator");
                            return res.status(403).json({ error: "Admin access denied" });
                        }

                        req.adminUser = result.rows[0];
                        console.log("Admin middleware: Access granted for user:", req.adminUser.email);
                        next();
                        resolve();
                    } catch (dbError) {
                        console.error("Admin middleware database error:", dbError);
                        res.status(500).json({ error: "Admin authentication failed" });
                        reject(dbError);
                    } finally {
                        client.release();
                    }
                } catch (innerError) {
                    console.error("Admin middleware inner error:", innerError);
                    res.status(500).json({ error: "Admin authentication failed" });
                    reject(innerError);
                }
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
                va.locality as venue_city,
                va.address_line_1 as venue_address,
                uc.email as creator_email,
                ua.email as approved_by_email,
                COUNT(DISTINCT b.id) as bookings_count,
                COALESCE(SUM(b.total_price), 0) as total_revenue,
                COALESCE(AVG(r.rating), 0) as average_rating,
                COUNT(DISTINCT r.id) as reviews_count
            FROM events e
            LEFT JOIN venues v ON e.venue_id = v.id
            LEFT JOIN address_relationships var ON var.entity_type = 'venue' AND var.entity_id = v.id
            LEFT JOIN addresses va ON var.address_id = va.id
            LEFT JOIN users uc ON e.organizer_id = uc.id
            LEFT JOIN users ua ON e.approved_by = ua.id
            LEFT JOIN bookings b ON e.id = b.event_id
            LEFT JOIN reviews r ON e.id = r.event_id
            ${whereClause}
            GROUP BY e.id, v.id, va.id, uc.id, ua.id
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

// Get single event for admin management
router.get("/events/:id", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        const query = `
            SELECT
                e.*,
                v.name as venue_name,
                va.locality as venue_city,
                va.address_line_1 as venue_address,
                va.postal_code as venue_postal_code,
                va.latitude as venue_latitude,
                va.longitude as venue_longitude,
                v.capacity as venue_capacity,
                uc.email as creator_email,
                uc.id as creator_id,
                up.first_name as creator_first_name,
                up.last_name as creator_last_name,
                up.phone as creator_phone,
                ua.email as approved_by_email,
                ARRAY_AGG(DISTINCT cat.name) FILTER (WHERE cat.name IS NOT NULL) as categories,
                COUNT(DISTINCT b.id) as bookings_count,
                COALESCE(SUM(b.total_price) FILTER (WHERE b.booking_status = 'confirmed'), 0) as total_revenue,
                COALESCE(AVG(r.rating), 0) as average_rating,
                COUNT(DISTINCT r.id) as reviews_count
            FROM events e
            LEFT JOIN venues v ON e.venue_id = v.id
            LEFT JOIN address_relationships var ON var.entity_type = 'venue' AND var.entity_id = v.id
            LEFT JOIN addresses va ON var.address_id = va.id
            LEFT JOIN users uc ON e.organizer_id = uc.id
            LEFT JOIN user_profiles up ON uc.id = up.user_id
            LEFT JOIN users ua ON e.approved_by = ua.id
            LEFT JOIN bookings b ON e.id = b.event_id
            LEFT JOIN reviews r ON e.id = r.event_id
            LEFT JOIN event_categories ec ON e.id = ec.event_id
            LEFT JOIN categories cat ON ec.category_id = cat.id
            WHERE e.id = $1
            GROUP BY e.id, v.id, va.id, uc.id, up.id, ua.id
        `;

        const result = await client.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Log admin action
        await client.query("SELECT log_admin_action($1, $2, $3, $4, $5)", [
            req.adminUser.id,
            "view_event",
            "event",
            id,
            `Viewed event details: ${result.rows[0].title}`,
        ]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching admin event:", err);
        res.status(500).json({ error: "Failed to fetch event" });
    } finally {
        client.release();
    }
});

// Update event status and moderation
router.patch("/events/:id/status", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { id } = req.params;
        const { status, moderation_status, admin_notes } = req.body;

        // Validate status values
        const validStatuses = ["draft", "candidate", "active", "sold_out", "cancelled", "completed", "suspended"];
        const validModerationStatuses = [
            "pending",
            "under_review",
            "approved",
            "rejected",
            "flagged",
            "revision_requested",
        ];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        if (moderation_status && !validModerationStatuses.includes(moderation_status)) {
            return res.status(400).json({ error: "Invalid moderation status" });
        }

        // Build dynamic query based on provided fields
        let updateFields = [];
        let updateValues = [];
        let paramIndex = 1;

        if (status) {
            updateFields.push(`status = $${paramIndex}`);
            updateValues.push(status);
            paramIndex++;
        }

        if (moderation_status) {
            updateFields.push(`moderation_status = $${paramIndex}`);
            updateValues.push(moderation_status);
            paramIndex++;
        }

        if (admin_notes !== undefined) {
            updateFields.push(`admin_notes = $${paramIndex}`);
            updateValues.push(admin_notes);
            paramIndex++;
        }

        // Always update status_changed_by and updated_at
        updateFields.push(`status_changed_by = $${paramIndex}`);
        updateValues.push(req.adminUser.id);
        paramIndex++;

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

        // If approving, set approved_by, approved_at, and make event active
        if (moderation_status === "approved") {
            updateFields.push(`approved_by = $${paramIndex}`);
            updateValues.push(req.adminUser.id);
            paramIndex++;

            updateFields.push(`approved_at = CURRENT_TIMESTAMP`);

            // CRITICAL FIX: When approving an event, automatically set status to 'active'
            // so it becomes visible in the frontend
            if (!status) { // Only set if status wasn't explicitly provided
                updateFields.push(`status = 'active'`);
            }
        }

        updateValues.push(id); // WHERE condition

        const query = `
            UPDATE events
            SET ${updateFields.join(", ")}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await client.query(query, updateValues);

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Event not found" });
        }

        // Log admin action
        await client.query("SELECT log_admin_action($1, $2, $3, $4, $5, $6)", [
            req.adminUser.id,
            "update_event_moderation",
            "event",
            id,
            `Updated event moderation: ${moderation_status || status}`,
            JSON.stringify({
                status: status,
                moderation_status: moderation_status,
                admin_notes: admin_notes,
            }),
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

// Delete event
router.delete("/events/:id", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { id } = req.params;

        // First check if event exists
        const eventCheck = await client.query("SELECT * FROM events WHERE id = $1", [id]);

        if (eventCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Event not found" });
        }

        const event = eventCheck.rows[0];

        // Delete related records in order to maintain referential integrity
        await client.query("DELETE FROM user_favorites WHERE event_id = $1", [id]);
        await client.query("DELETE FROM event_categories WHERE event_id = $1", [id]);
        await client.query("DELETE FROM address_relationships WHERE entity_type = 'event' AND entity_id = $1", [id]);

        // Delete the event itself
        await client.query("DELETE FROM events WHERE id = $1", [id]);

        // Log admin action
        await client.query("SELECT log_admin_action($1, $2, $3, $4, $5, $6)", [
            req.adminUser.id,
            "delete_event",
            "event",
            id,
            `Deleted event: ${event.title}`,
            JSON.stringify({ event_data: event }),
        ]);

        await client.query("COMMIT");
        res.json({ message: "Event deleted successfully", eventId: id });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error deleting event:", err);
        res.status(500).json({ error: "Failed to delete event" });
    } finally {
        client.release();
    }
});

// Update event featured status
router.patch("/events/:id/featured", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { id } = req.params;
        const { is_featured } = req.body;

        if (typeof is_featured !== 'boolean') {
            return res.status(400).json({ error: "is_featured must be a boolean" });
        }

        // Check if event exists
        const eventCheck = await client.query("SELECT * FROM events WHERE id = $1", [id]);
        if (eventCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Event not found" });
        }

        const event = eventCheck.rows[0];

        // Update featured status
        await client.query(
            "UPDATE events SET is_featured = $1, updated_at = NOW() WHERE id = $2",
            [is_featured, id]
        );

        // Log admin action
        await client.query("SELECT log_admin_action($1, $2, $3, $4, $5, $6)", [
            req.adminUser.id,
            is_featured ? "feature_event" : "unfeature_event",
            "event",
            id,
            `${is_featured ? 'Featured' : 'Unfeatured'} event: ${event.title}`,
            JSON.stringify({ is_featured }),
        ]);

        await client.query("COMMIT");
        res.json({
            message: `Event ${is_featured ? 'featured' : 'unfeatured'} successfully`,
            eventId: id,
            is_featured
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error updating event featured status:", err);
        res.status(500).json({ error: "Failed to update event featured status" });
    } finally {
        client.release();
    }
});

// Update event last minute status
router.patch("/events/:id/last-minute", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { id } = req.params;
        const { is_last_minute } = req.body;

        if (typeof is_last_minute !== 'boolean') {
            return res.status(400).json({ error: "is_last_minute must be a boolean" });
        }

        // Check if event exists
        const eventCheck = await client.query("SELECT * FROM events WHERE id = $1", [id]);
        if (eventCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Event not found" });
        }

        const event = eventCheck.rows[0];

        // Update last minute status
        await client.query(
            "UPDATE events SET is_last_minute = $1, updated_at = NOW() WHERE id = $2",
            [is_last_minute, id]
        );

        // Log admin action
        await client.query("SELECT log_admin_action($1, $2, $3, $4, $5, $6)", [
            req.adminUser.id,
            is_last_minute ? "mark_last_minute" : "unmark_last_minute",
            "event",
            id,
            `${is_last_minute ? 'Marked as last minute' : 'Unmarked as last minute'} event: ${event.title}`,
            JSON.stringify({ is_last_minute }),
        ]);

        await client.query("COMMIT");
        res.json({
            message: `Event ${is_last_minute ? 'marked as last minute' : 'unmarked as last minute'} successfully`,
            eventId: id,
            is_last_minute
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error updating event last minute status:", err);
        res.status(500).json({ error: "Failed to update event last minute status" });
    } finally {
        client.release();
    }
});

// Create event (admin)
router.post("/events", requireAdmin, async (req, res) => {
    try {
        const {
            title,
            description,
            event_date,
            venue_id,
            category_id,
            original_price,
            discounted_price,
            discount_percentage,
            max_participants,
            requirements,
            cancellation_policy,
            is_last_minute,
            is_featured,
            status,
            is_published,
            organizer_id,
        } = req.body;

        // Validation
        if (!title || !description || !event_date || !venue_id || !category_id || original_price === undefined) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // If organizer_id is provided, verify it exists and is an organizer
            let eventOrganizerId = req.adminUser.id; // Default to admin user
            if (organizer_id) {
                const organizerCheck = await client.query(
                    "SELECT id FROM users WHERE id = $1 AND role = 'organizer'",
                    [organizer_id]
                );
                if (organizerCheck.rows.length === 0) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({ message: "Invalid organizer_id" });
                }
                eventOrganizerId = organizer_id;
            }

            // Handle price calculations like the organizer endpoint
            const finalOriginalPrice = original_price || 0;
            const finalDiscountedPrice = discounted_price || finalOriginalPrice;
            const finalDiscountPercentage = discount_percentage || 0;
            const finalMaxParticipants = max_participants || 100;

            // Create the event
            const eventResult = await client.query(
                `INSERT INTO events (
                    title, description, event_date, venue_id, organizer_id,
                    original_price, discounted_price, discount_percentage, total_tickets, available_tickets,
                    is_featured, is_last_minute, requirements, cancellation_policy, status, is_published,
                    moderation_status, status_changed_by, status_changed_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                RETURNING *`,
                [
                    title,
                    description,
                    event_date,
                    venue_id,
                    eventOrganizerId,
                    finalOriginalPrice,
                    finalDiscountedPrice,
                    finalDiscountPercentage,
                    finalMaxParticipants,
                    finalMaxParticipants,
                    is_featured || false,
                    is_last_minute || false,
                    requirements,
                    cancellation_policy,
                    "active", // Status should always be "active" for normal events
                    is_published || false, // This controls public visibility
                    "approved", // Admin-created events are auto-approved
                    req.adminUser.id,
                    new Date(),
                ]
            );

            const eventId = eventResult.rows[0].id;

            // Add category association
            await client.query("INSERT INTO event_categories (event_id, category_id) VALUES ($1, $2)", [
                eventId,
                category_id,
            ]);

            // Log admin action
            await client.query("SELECT log_admin_action($1, $2, $3, $4, $5, $6)", [
                req.adminUser.id,
                "create_event",
                "event",
                eventId,
                `Created event: ${title}`,
                JSON.stringify({ title, venue_id, category_id }),
            ]);

            await client.query("COMMIT");

            // Return the created event data
            res.status(201).json(eventResult.rows[0]);
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error creating event:", err);
        res.status(500).json({ error: "Failed to create event" });
    }
});

// Update event (admin)
router.put("/events/:id", requireAdmin, async (req, res) => {
    try {
        const {
            title,
            description,
            event_date,
            venue_id,
            category_id,
            original_price,
            discounted_price,
            discount_percentage,
            max_participants,
            requirements,
            cancellation_policy,
            is_last_minute,
            is_featured,
            status,
            is_published,
        } = req.body;

        // Validation
        if (!title || !description || !event_date || !venue_id || !category_id) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Check if event exists
            const eventCheck = await client.query("SELECT * FROM events WHERE id = $1", [req.params.id]);
            if (eventCheck.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ message: "Event not found" });
            }

            const originalEvent = eventCheck.rows[0];

            // Update the event
            const finalOriginalPrice = original_price || originalEvent.original_price;
            const finalDiscountedPrice = discounted_price || finalOriginalPrice;
            const finalDiscountPercentage = discount_percentage || 0;
            const finalMaxParticipants = max_participants || originalEvent.total_tickets;

            const eventResult = await client.query(
                `UPDATE events SET
                    title = $1, description = $2, event_date = $3, venue_id = $4,
                    original_price = $5, discounted_price = $6, discount_percentage = $7, total_tickets = $8,
                    available_tickets = $9, is_last_minute = $10, requirements = $11, cancellation_policy = $12,
                    is_featured = $13, status = $14, is_published = $15, updated_at = NOW()
                WHERE id = $16
                RETURNING *`,
                [
                    title,
                    description,
                    event_date,
                    venue_id,
                    finalOriginalPrice,
                    finalDiscountedPrice,
                    finalDiscountPercentage,
                    finalMaxParticipants,
                    finalMaxParticipants, // Keep same as total_tickets to avoid issues
                    is_last_minute !== undefined ? is_last_minute : originalEvent.is_last_minute,
                    requirements,
                    cancellation_policy,
                    is_featured !== undefined ? is_featured : originalEvent.is_featured,
                    "active", // Always keep status as "active" for normal operations
                    is_published !== undefined ? is_published : originalEvent.is_published,
                    req.params.id,
                ]
            );

            // Update category association
            await client.query("DELETE FROM event_categories WHERE event_id = $1", [req.params.id]);
            await client.query("INSERT INTO event_categories (event_id, category_id) VALUES ($1, $2)", [
                req.params.id,
                category_id,
            ]);

            // Log admin action
            await client.query("SELECT log_admin_action($1, $2, $3, $4, $5, $6)", [
                req.adminUser.id,
                "update_event",
                "event",
                req.params.id,
                `Updated event: ${title}`,
                JSON.stringify({ title, venue_id, category_id, changes: req.body }),
            ]);

            await client.query("COMMIT");

            // Return the updated event data
            res.json(eventResult.rows[0]);
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error updating event:", err);
        res.status(500).json({ error: "Failed to update event" });
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
                u.id,
                u.email,
                u.role,
                u.is_active,
                u.created_at,
                up.first_name,
                up.last_name,
                up.phone,
                up.date_of_birth,
                up.profile_picture,
                up.street_number,
                up.street_name,
                up.postal_code,
                up.city,
                up.country,
                COALESCE(event_stats.events_count, 0) as events_count,
                COALESCE(booking_stats.bookings_count, 0) as bookings_count,
                COALESCE(booking_stats.total_spent, 0) as total_spent,
                COALESCE(review_stats.reviews_count, 0) as reviews_written
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN (
                SELECT organizer_id, COUNT(*) as events_count
                FROM events
                GROUP BY organizer_id
            ) event_stats ON u.id = event_stats.organizer_id
            LEFT JOIN (
                SELECT user_id,
                       COUNT(*) as bookings_count,
                       SUM(total_price) FILTER (WHERE booking_status = 'confirmed') as total_spent
                FROM bookings
                GROUP BY user_id
            ) booking_stats ON u.id = booking_stats.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) as reviews_count
                FROM reviews
                GROUP BY user_id
            ) review_stats ON u.id = review_stats.user_id
            ${whereClause}
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

// Update user (full update)
router.patch("/users/:id", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { id } = req.params;
        const {
            role,
            is_active,
            first_name,
            last_name,
            phone,
            date_of_birth,
            street_number,
            street_name,
            postal_code,
            city,
            country,
            email,
        } = req.body;

        // Validate role if provided
        if (role && !["user", "admin", "moderator", "organizer"].includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }

        // Don't allow non-admins to create admins
        if (role === "admin" && req.adminUser.role !== "admin") {
            return res.status(403).json({ error: "Only admins can grant admin role" });
        }

        // Don't allow users to modify themselves
        if (parseInt(id) === req.adminUser.id) {
            return res.status(403).json({ error: "Cannot modify your own account" });
        }

        // Update users table
        let userUpdateFields = [];
        let userQueryParams = [];
        let userParamIndex = 1;

        if (role !== undefined) {
            userUpdateFields.push(`role = $${userParamIndex}`);
            userQueryParams.push(role);
            userParamIndex++;
        }

        if (is_active !== undefined) {
            userUpdateFields.push(`is_active = $${userParamIndex}`);
            userQueryParams.push(is_active);
            userParamIndex++;
        }

        if (email !== undefined) {
            userUpdateFields.push(`email = $${userParamIndex}`);
            userQueryParams.push(email);
            userParamIndex++;
        }

        let userResult = null;
        if (userUpdateFields.length > 0) {
            userQueryParams.push(id);
            const userQuery = `
                UPDATE users
                SET ${userUpdateFields.join(", ")}
                WHERE id = $${userParamIndex}
                RETURNING *
            `;
            userResult = await client.query(userQuery, userQueryParams);

            if (userResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ error: "User not found" });
            }
        }

        // Update user_profiles table
        // Convert empty strings to null for date fields and handle other empty strings
        const profileFields = {};

        if (first_name !== undefined) profileFields.first_name = first_name === "" ? null : first_name;
        if (last_name !== undefined) profileFields.last_name = last_name === "" ? null : last_name;
        if (phone !== undefined) profileFields.phone = phone === "" ? null : phone;
        if (date_of_birth !== undefined) profileFields.date_of_birth = date_of_birth === "" ? null : date_of_birth;
        if (street_number !== undefined) profileFields.street_number = street_number === "" ? null : street_number;
        if (street_name !== undefined) profileFields.street_name = street_name === "" ? null : street_name;
        if (postal_code !== undefined) profileFields.postal_code = postal_code === "" ? null : postal_code;
        if (city !== undefined) profileFields.city = city === "" ? null : city;
        if (country !== undefined) profileFields.country = country === "" ? null : country;

        const profileUpdateFields = Object.entries(profileFields)
            .map(([key, value], index) => `${key} = $${index + 1}`)
            .join(", ");

        const profileValues = Object.entries(profileFields).map(([key, value]) => value);

        let profileResult = null;
        if (profileUpdateFields.length > 0) {
            // Check if profile exists
            const profileCheck = await client.query("SELECT id FROM user_profiles WHERE user_id = $1", [id]);

            profileValues.push(id);

            if (profileCheck.rows.length > 0) {
                // Update existing profile
                const profileQuery = `
                    UPDATE user_profiles
                    SET ${profileUpdateFields}
                    WHERE user_id = $${profileValues.length}
                    RETURNING *
                `;
                profileResult = await client.query(profileQuery, profileValues);
            } else {
                // Create new profile
                const insertFields = Object.keys(profileFields).concat(["user_id"]);
                const insertValues = Object.values(profileFields).concat([id]);

                const placeholders = insertValues.map((_, index) => `$${index + 1}`).join(", ");

                const profileQuery = `
                    INSERT INTO user_profiles (${insertFields.join(", ")})
                    VALUES (${placeholders})
                    RETURNING *
                `;
                profileResult = await client.query(profileQuery, insertValues);
            }
        }

        // Log admin action
        await client.query("SELECT log_admin_action($1, $2, $3, $4, $5, $6)", [
            req.adminUser.id,
            "update_user_full",
            "user",
            id,
            `Updated user account and profile`,
            JSON.stringify({
                updated_user_fields: Object.keys(req.body).filter(
                    (key) => ["role", "is_active", "email"].includes(key) && req.body[key] !== undefined
                ),
                updated_profile_fields: Object.keys(profileFields).filter((key) => profileFields[key] !== undefined),
                target_user_email: userResult?.rows[0]?.email || "unknown",
            }),
        ]);

        await client.query("COMMIT");

        // Return updated user data
        const finalQuery = `
            SELECT u.*, up.first_name, up.last_name, up.phone, up.date_of_birth,
                   up.street_number, up.street_name, up.postal_code, up.city, up.country
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = $1
        `;
        const finalResult = await client.query(finalQuery, [id]);

        res.json(finalResult.rows[0]);
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error updating user:", err);
        res.status(500).json({ error: "Failed to update user" });
    } finally {
        client.release();
    }
});

// Delete user
router.delete("/users/:id", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { id } = req.params;

        // Don't allow users to delete themselves
        if (parseInt(id) === req.adminUser.id) {
            return res.status(403).json({ error: "Cannot delete your own account" });
        }

        // Check if user exists and get their info for logging
        const userCheck = await client.query("SELECT * FROM users WHERE id = $1", [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const userToDelete = userCheck.rows[0];

        // Don't allow deleting the last admin
        if (userToDelete.role === "admin") {
            const adminCount = await client.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
            if (parseInt(adminCount.rows[0].count) <= 1) {
                return res.status(403).json({ error: "Cannot delete the last admin user" });
            }
        }

        // Delete related data first (due to foreign key constraints)
        // Delete user bookings
        await client.query("DELETE FROM bookings WHERE user_id = $1", [id]);

        // Delete user reviews
        await client.query("DELETE FROM reviews WHERE user_id = $1", [id]);

        // Delete user events (set organizer_id to null or delete if needed)
        await client.query("UPDATE events SET organizer_id = NULL WHERE organizer_id = $1", [id]);

        // Delete user profile
        await client.query("DELETE FROM user_profiles WHERE user_id = $1", [id]);

        // Delete user favorites
        await client.query("DELETE FROM user_favorites WHERE user_id = $1", [id]);

        // Finally delete the user
        const deleteResult = await client.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);

        // Log admin action
        await client.query("SELECT log_admin_action($1, $2, $3, $4, $5, $6)", [
            req.adminUser.id,
            "delete_user",
            "user",
            id,
            `Deleted user account`,
            JSON.stringify({
                deleted_user_email: userToDelete.email,
                deleted_user_role: userToDelete.role,
            }),
        ]);

        await client.query("COMMIT");
        res.json({
            message: "User deleted successfully",
            deleted_user: deleteResult.rows[0],
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error deleting user:", err);
        res.status(500).json({ error: "Failed to delete user" });
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

// === CATEGORY MANAGEMENT ROUTES ===

// Get all categories with translations (for admin management)
router.get("/categories", requireAdmin, async (req, res) => {
    try {
        const categories = await CategoryService.getAllCategoriesWithTranslations();
        res.json(categories);
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});

// Get single category by ID
router.get("/categories/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const category = await CategoryService.getCategoryById(id);

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        res.json(category);
    } catch (err) {
        console.error("Error fetching category:", err);
        res.status(500).json({ error: "Failed to fetch category" });
    }
});

// Create new category with translations
router.post("/categories", requireAdmin, async (req, res) => {
    try {
        const categoryData = req.body;

        // Validate required fields
        if (!categoryData.name_fr && !categoryData.name_en && !categoryData.name_es) {
            return res.status(400).json({
                error: "At least one name translation is required",
            });
        }

        const newCategory = await CategoryService.createCategory(categoryData);
        res.status(201).json(newCategory);
    } catch (err) {
        console.error("Error creating category:", err);
        res.status(500).json({ error: "Failed to create category" });
    }
});

// Update category translations
router.put("/categories/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const categoryData = req.body;

        const updatedCategory = await CategoryService.updateCategory(id, categoryData);

        if (!updatedCategory) {
            return res.status(404).json({ error: "Category not found" });
        }

        res.json(updatedCategory);
    } catch (err) {
        console.error("Error updating category:", err);
        res.status(500).json({ error: "Failed to update category" });
    }
});

// Delete category
router.delete("/categories/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCategory = await CategoryService.deleteCategory(id);

        if (!deletedCategory) {
            return res.status(404).json({ error: "Category not found" });
        }

        res.json({ message: "Category deleted successfully", category: deletedCategory });
    } catch (err) {
        console.error("Error deleting category:", err);
        if (err.message.includes("in use")) {
            res.status(400).json({ error: err.message });
        } else {
            res.status(500).json({ error: "Failed to delete category" });
        }
    }
});

// === END CATEGORY MANAGEMENT ROUTES ===

// === TRANSLATION MANAGEMENT ROUTES ===
import fs from "fs/promises";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/json") {
            cb(null, true);
        } else {
            cb(new Error("Only JSON files are allowed"), false);
        }
    },
});

// Helper function to get translation file path
const getTranslationFilePath = (language, namespace) => {
    const translationsPath = process.env.TRANSLATIONS_PATH || path.join(process.cwd(), "translations");
    return path.join(translationsPath, `${language}/${namespace}.json`);
};

// Helper function to ensure directory exists
const ensureDirectoryExists = async (filePath) => {
    const dir = path.dirname(filePath);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
};

// Get translation file
router.get("/translations/:language/:namespace", requireAdmin, async (req, res) => {
    try {
        const { language, namespace } = req.params;
        console.log(`[Admin] GET translations request: ${language}/${namespace}`);

        // Add a simple delay to help with timing issues
        await new Promise(resolve => setTimeout(resolve, 100));

        const filePath = getTranslationFilePath(language, namespace);
        console.log(`[Admin] Reading from: ${filePath}`);

        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            console.log(`[Admin] File read successfully, length: ${fileContent.length}`);
            const translations = JSON.parse(fileContent);
            console.log(`[Admin] JSON parsed successfully, keys: ${Object.keys(translations).length}`);

            // Ensure response is sent
            res.status(200).json(translations);
        } catch (error) {
            console.log(`[Admin] File read error:`, error.code, error.message);
            if (error.code === "ENOENT") {
                // File doesn't exist, return empty object
                res.status(200).json({});
            } else {
                console.error("JSON parse or other error:", error);
                res.status(500).json({ error: "Failed to parse translation file" });
            }
        }
    } catch (error) {
        console.error("Error reading translation file:", error);
        res.status(500).json({ error: "Failed to read translation file" });
    }
});

// Save translation file
router.put("/translations/:language/:namespace", requireAdmin, async (req, res) => {
    try {
        const { language, namespace } = req.params;
        const { translations } = req.body;

        if (!translations || typeof translations !== "object") {
            return res.status(400).json({ error: "Invalid translations data" });
        }

        const filePath = getTranslationFilePath(language, namespace);

        await ensureDirectoryExists(filePath);

        const formattedContent = JSON.stringify(translations, null, 2);

        await fs.writeFile(filePath, formattedContent, "utf-8");

        // Verify the file was written by reading it back
        const verifyContent = await fs.readFile(filePath, "utf-8");

        res.json({
            message: "Translations saved successfully",
            keysCount: Object.keys(translations).length,
        });
    } catch (error) {
        console.error("Error saving translation file:", error);
        res.status(500).json({ error: "Failed to save translation file" });
    }
});

// Get available languages
router.get("/translations/languages", requireAdmin, async (req, res) => {
    try {
        const localesPath = path.join(__dirname, "../../../client/src/i18n/locales");
        const languages = await fs.readdir(localesPath);

        // Filter out any non-directory items
        const validLanguages = [];
        for (const lang of languages) {
            const langPath = path.join(localesPath, lang);
            const stat = await fs.stat(langPath);
            if (stat.isDirectory()) {
                validLanguages.push(lang);
            }
        }

        res.json(validLanguages);
    } catch (error) {
        console.error("Error reading languages:", error);
        res.status(500).json({ error: "Failed to read available languages" });
    }
});

// Get available namespaces for a language
router.get("/translations/:language/namespaces", requireAdmin, async (req, res) => {
    try {
        const { language } = req.params;
        const languagePath = path.join(__dirname, `../../../client/src/i18n/locales/${language}`);

        try {
            const files = await fs.readdir(languagePath);
            const namespaces = files.filter((file) => file.endsWith(".json")).map((file) => file.replace(".json", ""));

            res.json(namespaces);
        } catch (error) {
            if (error.code === "ENOENT") {
                res.json([]);
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error("Error reading namespaces:", error);
        res.status(500).json({ error: "Failed to read available namespaces" });
    }
});

// Create new namespace
router.post("/translations/:language/:namespace", requireAdmin, async (req, res) => {
    try {
        const { language, namespace } = req.params;
        const { translations = {} } = req.body;

        const filePath = getTranslationFilePath(language, namespace);

        // Check if file already exists
        try {
            await fs.access(filePath);
            return res.status(400).json({ error: "Namespace already exists" });
        } catch {
            // File doesn't exist, proceed with creation
        }

        await ensureDirectoryExists(filePath);
        const formattedContent = JSON.stringify(translations, null, 2);
        await fs.writeFile(filePath, formattedContent, "utf-8");

        res.json({
            message: "Namespace created successfully",
            language,
            namespace,
        });
    } catch (error) {
        console.error("Error creating namespace:", error);
        res.status(500).json({ error: "Failed to create namespace" });
    }
});

// Delete namespace
router.delete("/translations/:language/:namespace", requireAdmin, async (req, res) => {
    try {
        const { language, namespace } = req.params;
        const filePath = getTranslationFilePath(language, namespace);

        await fs.unlink(filePath);
        res.json({ message: "Namespace deleted successfully" });
    } catch (error) {
        if (error.code === "ENOENT") {
            return res.status(404).json({ error: "Namespace not found" });
        }
        console.error("Error deleting namespace:", error);
        res.status(500).json({ error: "Failed to delete namespace" });
    }
});

// Upload translation file
router.post("/translations/upload", requireAdmin, upload.single("file"), async (req, res) => {
    try {
        const { language, namespace } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        if (!language || !namespace) {
            return res.status(400).json({ error: "Language and namespace are required" });
        }

        const fileContent = file.buffer.toString("utf-8");
        const translations = JSON.parse(fileContent);

        const filePath = getTranslationFilePath(language, namespace);
        await ensureDirectoryExists(filePath);

        const formattedContent = JSON.stringify(translations, null, 2);
        await fs.writeFile(filePath, formattedContent, "utf-8");

        res.json({
            message: "Translation file uploaded successfully",
            keysTotal: Object.keys(translations).length,
            language,
            namespace,
        });
    } catch (error) {
        console.error("Error uploading translation file:", error);
        if (error instanceof SyntaxError) {
            res.status(400).json({ error: "Invalid JSON file format" });
        } else {
            res.status(500).json({ error: "Failed to upload translation file" });
        }
    }
});

// Export translation file
router.get("/translations/:language/:namespace/export", requireAdmin, async (req, res) => {
    try {
        const { language, namespace } = req.params;
        const filePath = getTranslationFilePath(language, namespace);

        const fileContent = await fs.readFile(filePath, "utf-8");
        const translations = JSON.parse(fileContent);

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="${language}-${namespace}.json"`);
        res.send(JSON.stringify(translations, null, 2));
    } catch (error) {
        if (error.code === "ENOENT") {
            return res.status(404).json({ error: "Translation file not found" });
        }
        console.error("Error exporting translation file:", error);
        res.status(500).json({ error: "Failed to export translation file" });
    }
});

// Get translation statistics
router.get("/translations/stats", requireAdmin, async (req, res) => {
    try {
        const localesPath = path.join(__dirname, "../../../client/src/i18n/locales");
        const languages = await fs.readdir(localesPath);

        const stats = {};

        for (const lang of languages) {
            const langPath = path.join(localesPath, lang);
            const stat = await fs.stat(langPath);

            if (stat.isDirectory()) {
                const files = await fs.readdir(langPath);
                const namespaces = files.filter((file) => file.endsWith(".json"));

                stats[lang] = {
                    namespaces: namespaces.length,
                    totalKeys: 0,
                    lastModified: null,
                };

                for (const file of namespaces) {
                    const filePath = path.join(langPath, file);
                    const fileContent = await fs.readFile(filePath, "utf-8");
                    const translations = JSON.parse(fileContent);

                    // Flatten nested objects to count all keys
                    const flattenObject = (obj, prefix = "") => {
                        let keys = 0;
                        for (const [key, value] of Object.entries(obj)) {
                            if (typeof value === "object" && value !== null) {
                                keys += flattenObject(value, `${prefix}${key}.`);
                            } else {
                                keys += 1;
                            }
                        }
                        return keys;
                    };

                    stats[lang].totalKeys += flattenObject(translations);

                    const fileStats = await fs.stat(filePath);
                    if (!stats[lang].lastModified || fileStats.mtime > stats[lang].lastModified) {
                        stats[lang].lastModified = fileStats.mtime;
                    }
                }
            }
        }

        res.json(stats);
    } catch (error) {
        console.error("Error getting translation stats:", error);
        res.status(500).json({ error: "Failed to get translation statistics" });
    }
});

// === END TRANSLATION MANAGEMENT ROUTES ===

// Get detailed user information
router.get("/users/:id", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        const query = `
            SELECT
                u.id,
                u.email,
                u.role,
                u.is_active,
                u.created_at,
                u.provider,
                u.provider_id,
                u.onboarding_complete,
                up.id as profile_id,
                up.first_name,
                up.last_name,
                up.phone,
                up.date_of_birth,
                up.profile_picture,
                up.street_number,
                up.street_name,
                up.postal_code,
                up.city,
                up.country,
                up.created_at as profile_created_at,
                up.updated_at as profile_updated_at,
                COALESCE(event_stats.events_count, 0) as events_count,
                COALESCE(booking_stats.bookings_count, 0) as bookings_count,
                COALESCE(booking_stats.total_spent, 0) as total_spent,
                COALESCE(review_stats.reviews_count, 0) as reviews_count,
                COALESCE(favorite_stats.favorites_count, 0) as favorites_count
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN (
                SELECT organizer_id, COUNT(*) as events_count
                FROM events
                GROUP BY organizer_id
            ) event_stats ON u.id = event_stats.organizer_id
            LEFT JOIN (
                SELECT user_id,
                       COUNT(*) as bookings_count,
                       SUM(total_price) FILTER (WHERE booking_status = 'confirmed') as total_spent
                FROM bookings
                GROUP BY user_id
            ) booking_stats ON u.id = booking_stats.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) as reviews_count
                FROM reviews
                GROUP BY user_id
            ) review_stats ON u.id = review_stats.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) as favorites_count
                FROM user_favorites
                GROUP BY user_id
            ) favorite_stats ON u.id = favorite_stats.user_id
            WHERE u.id = $1
        `;

        const result = await client.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get recent bookings
        const bookingsQuery = `
            SELECT b.*, e.title as event_title, e.event_date
            FROM bookings b
            LEFT JOIN events e ON b.event_id = e.id
            WHERE b.user_id = $1
            ORDER BY b.booking_date DESC
            LIMIT 10
        `;
        const bookings = await client.query(bookingsQuery, [id]);

        // Get recent reviews
        const reviewsQuery = `
            SELECT r.*, e.title as event_title
            FROM reviews r
            LEFT JOIN events e ON r.event_id = e.id
            WHERE r.user_id = $1
            ORDER BY r.created_at DESC
            LIMIT 10
        `;
        const reviews = await client.query(reviewsQuery, [id]);

        // Get created events if organizer
        const eventsQuery = `
            SELECT id, title, event_date, status, total_tickets, available_tickets
            FROM events
            WHERE organizer_id = $1
            ORDER BY event_date DESC
            LIMIT 10
        `;
        const events = await client.query(eventsQuery, [id]);

        res.json({
            user: result.rows[0],
            recent_bookings: bookings.rows,
            recent_reviews: reviews.rows,
            created_events: events.rows,
        });
    } catch (err) {
        console.error("Error fetching user details:", err);
        res.status(500).json({ error: "Failed to fetch user details" });
    } finally {
        client.release();
    }
});

// Get all bookings for admin management
router.get("/bookings", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const { page = 1, limit = 20, status, event_id, user_id, search, sortBy = "booking_date" } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        if (status) {
            whereConditions.push(`b.booking_status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }
        if (event_id) {
            whereConditions.push(`b.event_id = $${paramIndex}`);
            queryParams.push(event_id);
            paramIndex++;
        }
        if (user_id) {
            whereConditions.push(`b.user_id = $${paramIndex}`);
            queryParams.push(user_id);
            paramIndex++;
        }
        if (search) {
            whereConditions.push(`(
                b.customer_name ILIKE $${paramIndex} OR
                b.customer_email ILIKE $${paramIndex} OR
                e.title ILIKE $${paramIndex}
            )`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

        const query = `
            SELECT
                b.*, e.title as event_title, e.event_date,
                u.email as user_email, u.id as user_id
            FROM bookings b
            LEFT JOIN events e ON b.event_id = e.id
            LEFT JOIN users u ON b.user_id = u.id
            ${whereClause}
            ORDER BY b.${sortBy === "booking_date" ? "booking_date" : "id"} DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        queryParams.push(parseInt(limit), offset);
        const result = await client.query(query, queryParams);

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM bookings b
            LEFT JOIN events e ON b.event_id = e.id
            LEFT JOIN users u ON b.user_id = u.id
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

// Create venue endpoint for admin
router.post("/venues", requireAdmin, async (req, res) => {
    try {
        const {
            name,
            capacity,
            address_line_1,
            address_line_2,
            locality,
            administrative_area,
            postal_code,
            country_code,
            latitude,
            longitude,
        } = req.body;

        // Validation
        if (!name || !address_line_1 || !locality || !country_code) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Create the address
            const addressResult = await client.query(
                `INSERT INTO addresses (
                    address_line_1, address_line_2, locality, administrative_area,
                    postal_code, country_code, latitude, longitude,
                    address_type, label, is_verified
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id`,
                [
                    address_line_1,
                    address_line_2 || null,
                    locality,
                    administrative_area || null,
                    postal_code || null,
                    country_code,
                    latitude || null,
                    longitude || null,
                    "venue",
                    name,
                    false,
                ]
            );

            const addressId = addressResult.rows[0].id;

            // Create the venue (admin creates venues, use admin's user ID as organizer)
            const venueResult = await client.query(
                `INSERT INTO venues (name, capacity, organizer_id)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [name, capacity || null, req.adminUser.id] // Use admin's user ID
            );

            const venueId = venueResult.rows[0].id;

            // Link venue to address
            await client.query(
                `INSERT INTO address_relationships (address_id, entity_type, entity_id, relationship_type, is_active)
                 VALUES ($1, $2, $3, $4, $5)`,
                [addressId, "venue", venueId, "venue_location", true]
            );

            // Log admin action
            await client.query("SELECT log_admin_action($1, $2, $3, $4, $5, $6)", [
                req.adminUser.id,
                "create_venue",
                "venue", 
                venueId,
                `Created venue: ${name}`,
                JSON.stringify({ name, capacity, locality })
            ]);

            await client.query("COMMIT");

            // Return the venue with address information
            const fullResult = await client.query(
                `SELECT v.*, a.address_line_1, a.address_line_2, a.locality,
                        a.administrative_area, a.postal_code, a.country_code,
                        a.latitude, a.longitude
                 FROM venues v
                 LEFT JOIN address_relationships ar ON (ar.entity_type = 'venue' AND ar.entity_id = v.id)
                 LEFT JOIN addresses a ON a.id = ar.address_id
                 WHERE v.id = $1`,
                [venueId]
            );

            res.status(201).json(fullResult.rows[0]);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error creating venue:", error);
        res.status(500).json({ message: "Error creating venue" });
    }
});

export default router;
