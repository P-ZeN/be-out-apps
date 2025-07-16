import { Router } from "express";
import pool from "../db.js";
import authenticateToken from "../middleware/authenticateToken.js";
import { CategoryService } from "../services/categoryService.js";

const router = Router();

// Middleware to check admin permissions
const requireAdmin = async (req, res, next) => {
    try {
        // First authenticate the JWT token
        authenticateToken(req, res, () => {
            // Then check if user has admin role
            if (!req.user || !req.user.userId) {
                console.log("Admin middleware: No user or userId found");
                return res.status(401).json({ error: "Admin authentication required" });
            }

            console.log("Admin middleware: Checking role for user:", req.user.userId);

            // Get user role from database
            const checkAdminRole = async () => {
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
                va.locality as venue_city,
                va.formatted_address as venue_address,
                uc.email as creator_email,
                ua.email as approved_by_email,
                COUNT(DISTINCT b.id) as total_bookings,
                SUM(b.quantity) FILTER (WHERE b.booking_status = 'confirmed') as confirmed_tickets,
                COUNT(DISTINCT r.id) as review_count,
                AVG(r.rating) as average_rating
            FROM events e
            LEFT JOIN venues v ON e.venue_id = v.id
            LEFT JOIN address_relationships var ON v.id = var.entity_id AND var.entity_type = 'venue' AND var.relationship_type = 'venue_location' AND var.is_active = true
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

        // If approving, set approved_by and approved_at
        if (moderation_status === "approved") {
            updateFields.push(`approved_by = $${paramIndex}`);
            updateValues.push(req.adminUser.id);
            paramIndex++;

            updateFields.push(`approved_at = CURRENT_TIMESTAMP`);
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
        await client.query("DELETE FROM favorites WHERE event_id = $1", [id]);
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
    return path.join(__dirname, `../../translations/${language}/${namespace}.json`);
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
        const filePath = getTranslationFilePath(language, namespace);

        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            const translations = JSON.parse(fileContent);
            res.json(translations);
        } catch (error) {
            if (error.code === "ENOENT") {
                // File doesn't exist, return empty object
                res.json({});
            } else {
                throw error;
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

export default router;
