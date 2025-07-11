import { Router } from "express";
import pool from "../db.js";

const router = Router();

// Get all events with filtering, pagination and search
router.get("/", async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            page = 1,
            limit = 12,
            category,
            search,
            city,
            minPrice,
            maxPrice,
            lastMinute,
            featured,
            sortBy = "event_date",
            lang = "fr", // Language parameter for translations
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = ["e.status = 'active'", "e.event_date > NOW()"];
        let queryParams = [];
        let paramIndex = 1;

        // Build WHERE conditions dynamically
        if (category) {
            whereConditions.push(`c.name = $${paramIndex}`);
            queryParams.push(category);
            paramIndex++;
        }

        if (search) {
            whereConditions.push(`(e.title ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (city) {
            whereConditions.push(`v.city ILIKE $${paramIndex}`);
            queryParams.push(`%${city}%`);
            paramIndex++;
        }

        if (minPrice) {
            whereConditions.push(`e.discounted_price >= $${paramIndex}`);
            queryParams.push(parseFloat(minPrice));
            paramIndex++;
        }

        if (maxPrice) {
            whereConditions.push(`e.discounted_price <= $${paramIndex}`);
            queryParams.push(parseFloat(maxPrice));
            paramIndex++;
        }

        if (lastMinute === "true") {
            whereConditions.push("e.is_last_minute = true");
        }

        if (featured === "true") {
            whereConditions.push("e.is_featured = true");
        }

        // Build ORDER BY clause
        let orderBy = "e.event_date ASC";
        switch (sortBy) {
            case "price_asc":
                orderBy = "e.discounted_price ASC";
                break;
            case "price_desc":
                orderBy = "e.discounted_price DESC";
                break;
            case "discount":
                orderBy = "e.discount_percentage DESC";
                break;
            case "date":
            default:
                orderBy = "e.event_date ASC";
                break;
        }

        // Build category name selection based on language
        let categoryNameSelect;
        switch (lang) {
            case "en":
                categoryNameSelect = "COALESCE(cat.name_en, cat.name_fr, cat.name)";
                break;
            case "es":
                categoryNameSelect = "COALESCE(cat.name_es, cat.name_fr, cat.name)";
                break;
            default: // 'fr' or any other language defaults to French
                categoryNameSelect = "COALESCE(cat.name_fr, cat.name)";
                break;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

        const query = `
            SELECT DISTINCT
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
                v.name as venue_name,
                v.city as venue_city,
                v.address as venue_address,
                v.latitude as venue_latitude,
                v.longitude as venue_longitude,
                ARRAY_AGG(DISTINCT ${categoryNameSelect}) as categories
            FROM events e
            LEFT JOIN venues v ON e.venue_id = v.id
            LEFT JOIN event_categories ec ON e.id = ec.event_id
            LEFT JOIN categories cat ON ec.category_id = cat.id
            LEFT JOIN categories c ON ec.category_id = c.id
            ${whereClause}
            GROUP BY e.id, v.id
            ORDER BY ${orderBy}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(parseInt(limit), offset);

        const result = await client.query(query, queryParams);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(DISTINCT e.id) as total
            FROM events e
            LEFT JOIN venues v ON e.venue_id = v.id
            LEFT JOIN event_categories ec ON e.id = ec.event_id
            LEFT JOIN categories c ON ec.category_id = c.id
            ${whereClause}
        `;

        const countResult = await client.query(countQuery, queryParams.slice(0, -2));
        const total = parseInt(countResult.rows[0].total);

        res.json({
            events: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error("Error fetching events:", err);
        res.status(500).json({ error: "Failed to fetch events" });
    } finally {
        client.release();
    }
});

// Get single event by ID
router.get("/:id", async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        const query = `
            SELECT
                e.*,
                v.name as venue_name,
                v.address as venue_address,
                v.city as venue_city,
                v.postal_code as venue_postal_code,
                v.latitude as venue_latitude,
                v.longitude as venue_longitude,
                v.capacity as venue_capacity,
                ARRAY_AGG(DISTINCT cat.name) as categories,
                COALESCE(AVG(r.rating), 0) as average_rating,
                COUNT(DISTINCT r.id) as review_count
            FROM events e
            LEFT JOIN venues v ON e.venue_id = v.id
            LEFT JOIN event_categories ec ON e.id = ec.event_id
            LEFT JOIN categories cat ON ec.category_id = cat.id
            LEFT JOIN reviews r ON e.id = r.event_id
            WHERE e.id = $1
            GROUP BY e.id, v.id
        `;

        const result = await client.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching event:", err);
        res.status(500).json({ error: "Failed to fetch event" });
    } finally {
        client.release();
    }
});

// Get all categories
router.get("/meta/categories", async (req, res) => {
    const client = await pool.connect();
    try {
        const { lang = "fr" } = req.query; // Default to French

        // Determine which name column to use based on language
        const nameColumn =
            lang === "en"
                ? "COALESCE(c.name_en, c.name_fr, c.name)"
                : lang === "es"
                ? "COALESCE(c.name_es, c.name_fr, c.name)"
                : "COALESCE(c.name_fr, c.name)";

        const descriptionColumn =
            lang === "en"
                ? "COALESCE(c.description_en, c.description_fr, c.description)"
                : lang === "es"
                ? "COALESCE(c.description_es, c.description_fr, c.description)"
                : "COALESCE(c.description_fr, c.description)";

        const query = `
            SELECT
                c.id,
                ${nameColumn} as name,
                ${descriptionColumn} as description,
                c.icon,
                c.color,
                c.created_at,
                COUNT(DISTINCT e.id) as event_count
            FROM categories c
            LEFT JOIN event_categories ec ON c.id = ec.category_id
            LEFT JOIN events e ON ec.event_id = e.id AND e.status = 'active' AND e.event_date > NOW()
            GROUP BY c.id, c.name, c.description, c.name_fr, c.name_en, c.name_es,
                     c.description_fr, c.description_en, c.description_es, c.icon, c.color, c.created_at
            ORDER BY ${nameColumn}
        `;

        const result = await client.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ error: "Failed to fetch categories" });
    } finally {
        client.release();
    }
});

// Get events statistics
router.get("/meta/stats", async (req, res) => {
    const client = await pool.connect();
    try {
        const query = `
            SELECT
                COUNT(*) as total_events,
                COUNT(*) FILTER (WHERE is_last_minute = true) as last_minute_count,
                COUNT(*) FILTER (WHERE is_featured = true) as featured_count,
                AVG(discount_percentage) as avg_discount,
                MIN(discounted_price) as min_price,
                MAX(discounted_price) as max_price
            FROM events
            WHERE status = 'active' AND event_date > NOW()
        `;

        const result = await client.query(query);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching stats:", err);
        res.status(500).json({ error: "Failed to fetch statistics" });
    } finally {
        client.release();
    }
});

export default router;
