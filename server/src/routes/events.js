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
            categoryId, // Add support for category ID (single)
            categoryIds, // Add support for multiple category IDs
            search,
            city,
            minPrice,
            maxPrice,
            lastMinute,
            featured,
            startDate, // Add support for start date filtering
            endDate, // Add support for end date filtering
            latitude, // Add support for location-based filtering
            longitude, // Add support for location-based filtering
            maxDistance, // Maximum distance in km for location filtering
            sortBy = "event_date",
            lang = "fr", // Language parameter for translations
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [
            "e.status = 'active'",
            "e.event_date > NOW()",
            "e.moderation_status = 'approved'",
            "e.is_published = true",
        ];
        let queryParams = [];
        let paramIndex = 1;

        // Build WHERE conditions dynamically
        if (category) {
            whereConditions.push(`c.name = $${paramIndex}`);
            queryParams.push(category);
            paramIndex++;
        } else if (categoryId) {
            whereConditions.push(`c.id = $${paramIndex}`);
            queryParams.push(categoryId);
            paramIndex++;
        } else if (categoryIds) {
            // Handle multiple category IDs - they are UUIDs, not integers
            let idsArray = [];
            if (typeof categoryIds === 'string') {
                idsArray = categoryIds.split(',').map(id => id.trim()).filter(id => id.length > 0);
            } else if (Array.isArray(categoryIds)) {
                idsArray = categoryIds.filter(id => id && typeof id === 'string' && id.length > 0);
            }

            if (idsArray.length > 0) {
                // Create IN clause with proper parameter numbering
                const placeholders = [];
                idsArray.forEach(() => {
                    placeholders.push(`$${paramIndex}`);
                    paramIndex++;
                });
                whereConditions.push(`c.id IN (${placeholders.join(',')})`);
                queryParams.push(...idsArray);
            }
        }

        if (search) {
            whereConditions.push(`(e.title ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (city) {
            whereConditions.push(`a.locality ILIKE $${paramIndex}`);
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

        // Date range filtering
        if (startDate) {
            whereConditions.push(`e.event_date >= $${paramIndex}`);
            queryParams.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            whereConditions.push(`e.event_date <= $${paramIndex}`);
            queryParams.push(endDate);
            paramIndex++;
        }

        // Location-based filtering (if coordinates and distance provided)
        let distanceSelect = "";
        if (latitude && longitude && maxDistance) {
            // Calculate distance using Haversine formula
            distanceSelect = `, (
                6371 * acos(
                    cos(radians($${paramIndex})) *
                    cos(radians(a.latitude)) *
                    cos(radians(a.longitude) - radians($${paramIndex + 1})) +
                    sin(radians($${paramIndex})) *
                    sin(radians(a.latitude))
                )
            ) AS distance`;

            whereConditions.push(`(
                6371 * acos(
                    cos(radians($${paramIndex})) *
                    cos(radians(a.latitude)) *
                    cos(radians(a.longitude) - radians($${paramIndex + 1})) +
                    sin(radians($${paramIndex})) *
                    sin(radians(a.latitude))
                )
            ) <= $${paramIndex + 2}`);

            queryParams.push(parseFloat(latitude), parseFloat(longitude), parseFloat(maxDistance));
            paramIndex += 3;
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
            case "distance":
                orderBy = latitude && longitude ? "distance ASC" : "e.event_date ASC";
                break;
            case "popularity":
                orderBy = "tickets_sold DESC, e.event_date ASC";
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
                a.locality as venue_city,
                a.address_line_1 as venue_address,
                a.latitude as venue_latitude,
                a.longitude as venue_longitude,
                ARRAY_AGG(DISTINCT ${categoryNameSelect}) as categories,
                COALESCE(e.total_tickets - e.available_tickets, 0) as tickets_sold
                ${distanceSelect}
            FROM events e
            LEFT JOIN venues v ON e.venue_id = v.id
            LEFT JOIN address_relationships ar ON ar.entity_type = 'venue' AND ar.entity_id = v.id
            LEFT JOIN addresses a ON ar.address_id = a.id
            LEFT JOIN event_categories ec ON e.id = ec.event_id
            LEFT JOIN categories cat ON ec.category_id = cat.id
            LEFT JOIN categories c ON ec.category_id = c.id
            ${whereClause}
            GROUP BY e.id, v.id, a.id
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
            LEFT JOIN address_relationships ar ON ar.entity_type = 'venue' AND ar.entity_id = v.id
            LEFT JOIN addresses a ON ar.address_id = a.id
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
                a.address_line_1 as venue_address,
                a.locality as venue_city,
                a.postal_code as venue_postal_code,
                a.latitude as venue_latitude,
                a.longitude as venue_longitude,
                v.capacity as venue_capacity,
                ARRAY_AGG(DISTINCT cat.name) as categories,
                COALESCE(AVG(r.rating), 0) as average_rating,
                COUNT(DISTINCT r.id) as review_count
            FROM events e
            LEFT JOIN venues v ON e.venue_id = v.id
            LEFT JOIN address_relationships ar ON ar.entity_type = 'venue' AND ar.entity_id = v.id
            LEFT JOIN addresses a ON ar.address_id = a.id
            LEFT JOIN event_categories ec ON e.id = ec.event_id
            LEFT JOIN categories cat ON ec.category_id = cat.id
            LEFT JOIN reviews r ON e.id = r.event_id
            WHERE e.id = $1
                AND e.status = 'active'
                AND e.moderation_status = 'approved'
                AND e.is_published = true
            GROUP BY e.id, v.id, a.id
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
            LEFT JOIN events e ON ec.event_id = e.id
                AND e.status = 'active'
                AND e.event_date > NOW()
                AND e.moderation_status = 'approved'
                AND e.is_published = true
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
            WHERE status = 'active'
                AND event_date > NOW()
                AND moderation_status = 'approved'
                AND is_published = true
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

// Get all venues
router.get("/meta/venues", async (req, res) => {
    const client = await pool.connect();
    try {
        const query = `
            SELECT
                v.id,
                v.name,
                a.address_line_1 as address,
                a.locality as city,
                a.country_code as country,
                v.capacity,
                v.created_at
            FROM venues v
            LEFT JOIN address_relationships ar ON ar.entity_type = 'venue' AND ar.entity_id = v.id
            LEFT JOIN addresses a ON ar.address_id = a.id
            ORDER BY v.name ASC
        `;

        const result = await client.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching venues:", err);
        res.status(500).json({ error: "Failed to fetch venues" });
    } finally {
        client.release();
    }
});

export default router;
