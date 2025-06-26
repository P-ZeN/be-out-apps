import { Router } from "express";
import pool from "../db.js";
import authenticateToken from "../middleware/authenticateToken.js";

const router = Router();

// Get user's favorites
router.get("/user/:userId", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { userId } = req.params;
        const { page = 1, limit = 12, sortBy = "created_at" } = req.query;
        const offset = (page - 1) * limit;

        // Verify user can access their own favorites or is admin
        if ((req.user.userId || req.user.id) !== userId && req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        let orderBy = "uf.created_at DESC";
        switch (sortBy) {
            case "event_date":
                orderBy = "e.event_date ASC";
                break;
            case "price_asc":
                orderBy = "e.discounted_price ASC";
                break;
            case "price_desc":
                orderBy = "e.discounted_price DESC";
                break;
            case "popularity":
                orderBy = "e.favorites_count DESC";
                break;
            default:
                orderBy = "uf.created_at DESC";
                break;
        }

        const query = `
            SELECT
                uf.id as favorite_id,
                uf.created_at as favorited_at,
                e.id,
                e.title,
                e.description,
                e.short_description,
                e.image_url,
                e.original_price,
                e.discounted_price,
                e.discount_percentage,
                e.available_tickets,
                e.total_tickets,
                e.event_date,
                e.booking_deadline,
                e.is_last_minute,
                e.is_featured,
                e.favorites_count,
                e.status,
                v.name as venue_name,
                v.city as venue_city,
                v.address as venue_address,
                ARRAY_AGG(DISTINCT cat.name) FILTER (WHERE cat.name IS NOT NULL) as categories,
                COUNT(DISTINCT r.id) as review_count,
                COALESCE(AVG(r.rating), 0) as average_rating
            FROM user_favorites uf
            JOIN events e ON uf.event_id = e.id
            LEFT JOIN venues v ON e.venue_id = v.id
            LEFT JOIN event_categories ec ON e.id = ec.event_id
            LEFT JOIN categories cat ON ec.category_id = cat.id
            LEFT JOIN reviews r ON e.id = r.event_id
            WHERE uf.user_id = $1
            AND e.status = 'active'
            GROUP BY uf.id, uf.created_at, e.id, v.id
            ORDER BY ${orderBy}
            LIMIT $2 OFFSET $3
        `;

        const result = await client.query(query, [userId, parseInt(limit), offset]);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*)
            FROM user_favorites uf
            JOIN events e ON uf.event_id = e.id
            WHERE uf.user_id = $1 AND e.status = 'active'
        `;
        const countResult = await client.query(countQuery, [userId]);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            favorites: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error("Error fetching user favorites:", err);
        res.status(500).json({ error: "Failed to fetch favorites" });
    } finally {
        client.release();
    }
});

// Add event to favorites
router.post("/", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { event_id } = req.body;
        const user_id = req.user.userId || req.user.id; // Handle both userId and id

        if (!event_id) {
            return res.status(400).json({ error: "Event ID is required" });
        }

        // Check if event exists and is active
        const eventCheck = await client.query("SELECT id, title, status FROM events WHERE id = $1", [event_id]);

        if (eventCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Event not found" });
        }

        if (eventCheck.rows[0].status !== "active") {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Cannot favorite inactive event" });
        }

        // Check if already favorited
        const existingFavorite = await client.query(
            "SELECT id FROM user_favorites WHERE user_id = $1 AND event_id = $2",
            [user_id, event_id]
        );

        if (existingFavorite.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ error: "Event already in favorites" });
        }

        // Add to favorites
        const insertQuery = `
            INSERT INTO user_favorites (user_id, event_id)
            VALUES ($1, $2)
            RETURNING *
        `;

        const result = await client.query(insertQuery, [user_id, event_id]);

        await client.query("COMMIT");

        res.status(201).json({
            favorite: result.rows[0],
            message: "Event added to favorites successfully",
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error adding favorite:", err);
        res.status(500).json({ error: "Failed to add favorite" });
    } finally {
        client.release();
    }
});

// Remove event from favorites
router.delete("/:eventId", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { eventId } = req.params;
        const user_id = req.user.userId || req.user.id; // Handle both userId and id

        const deleteQuery = `
            DELETE FROM user_favorites
            WHERE user_id = $1 AND event_id = $2
            RETURNING *
        `;

        const result = await client.query(deleteQuery, [user_id, eventId]);

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Favorite not found" });
        }

        await client.query("COMMIT");

        res.json({
            favorite: result.rows[0],
            message: "Event removed from favorites successfully",
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error removing favorite:", err);
        res.status(500).json({ error: "Failed to remove favorite" });
    } finally {
        client.release();
    }
});

// Check if event is favorited by user
router.get("/check/:eventId", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { eventId } = req.params;
        const user_id = req.user.userId || req.user.id; // Handle both userId and id

        const query = `
            SELECT uf.id, uf.created_at
            FROM user_favorites uf
            WHERE uf.user_id = $1 AND uf.event_id = $2
        `;

        const result = await client.query(query, [user_id, eventId]);

        res.json({
            is_favorited: result.rows.length > 0,
            favorite: result.rows[0] || null,
        });
    } catch (err) {
        console.error("Error checking favorite status:", err);
        res.status(500).json({ error: "Failed to check favorite status" });
    } finally {
        client.release();
    }
});

// Get favorites statistics for user
router.get("/stats/:userId", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { userId } = req.params;

        // Verify user can access their own stats or is admin
        if ((req.user.userId || req.user.id) !== userId && req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        const query = `
            SELECT
                COUNT(DISTINCT uf.id) as total_favorites,
                COUNT(DISTINCT uf.id) FILTER (WHERE e.event_date > NOW()) as upcoming_favorites,
                COUNT(DISTINCT uf.id) FILTER (WHERE e.event_date <= NOW()) as past_favorites,
                COUNT(DISTINCT cat.name) as favorite_categories_count,
                ARRAY_AGG(DISTINCT cat.name) FILTER (WHERE cat.name IS NOT NULL) as favorite_categories,
                AVG(DISTINCT e.discounted_price) as avg_favorite_price,
                MIN(DISTINCT e.discounted_price) as min_favorite_price,
                MAX(DISTINCT e.discounted_price) as max_favorite_price
            FROM user_favorites uf
            JOIN events e ON uf.event_id = e.id
            LEFT JOIN event_categories ec ON e.id = ec.event_id
            LEFT JOIN categories cat ON ec.category_id = cat.id
            WHERE uf.user_id = $1 AND e.status = 'active'
        `;

        const result = await client.query(query, [userId]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching favorites stats:", err);
        res.status(500).json({ error: "Failed to fetch favorites statistics" });
    } finally {
        client.release();
    }
});

// Toggle favorite status (add if not exists, remove if exists)
router.post("/toggle", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { event_id } = req.body;
        const user_id = req.user.userId || req.user.id; // Handle both userId and id

        if (!event_id) {
            return res.status(400).json({ error: "Event ID is required" });
        }

        // Check if event exists and is active
        const eventCheck = await client.query("SELECT id, title, status FROM events WHERE id = $1", [event_id]);

        if (eventCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Event not found" });
        }

        if (eventCheck.rows[0].status !== "active") {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Cannot favorite inactive event" });
        }

        // Check if already favorited
        const existingFavorite = await client.query(
            "SELECT id FROM user_favorites WHERE user_id = $1 AND event_id = $2",
            [user_id, event_id]
        );

        let result;
        let action;

        if (existingFavorite.rows.length > 0) {
            // Remove from favorites
            const deleteQuery = `
                DELETE FROM user_favorites
                WHERE user_id = $1 AND event_id = $2
                RETURNING *
            `;
            result = await client.query(deleteQuery, [user_id, event_id]);
            action = "removed";
        } else {
            // Add to favorites
            const insertQuery = `
                INSERT INTO user_favorites (user_id, event_id)
                VALUES ($1, $2)
                RETURNING *
            `;
            result = await client.query(insertQuery, [user_id, event_id]);
            action = "added";
        }

        await client.query("COMMIT");

        res.json({
            favorite: result.rows[0],
            action,
            is_favorited: action === "added",
            message: `Event ${action} ${action === "added" ? "to" : "from"} favorites successfully`,
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error toggling favorite:", err);
        res.status(500).json({ error: "Failed to toggle favorite" });
    } finally {
        client.release();
    }
});

export default router;
