import { Router } from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

const router = Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"), false);
        }
    },
});

// File service utilities
class FileService {
    constructor() {
        this.uploadPath = process.env.UPLOAD_PATH || path.join(process.cwd(), "uploads");
        this.publicUrl = process.env.PUBLIC_FILES_URL || "http://localhost:3000/uploads";
    }

    async ensureDirectoryExists(dir) {
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async saveFile(file, folder = "uploads", isPublic = false) {
        try {
            const dir = isPublic ? "public" : "private";
            const relativePath = path.join(dir, folder);
            const fullPath = path.join(this.uploadPath, relativePath);

            await this.ensureDirectoryExists(fullPath);

            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const extension = path.extname(file.originalname);
            const filename = `${timestamp}_${randomString}${extension}`;
            const filePath = path.join(fullPath, filename);

            await fs.writeFile(filePath, file.buffer);

            const url = isPublic ? `${this.publicUrl}/${relativePath}/${filename}`.replace(/\\/g, "/") : null;

            return {
                filename,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                path: relativePath,
                url,
            };
        } catch (error) {
            console.error("Error saving file:", error);
            throw new Error("Failed to save file");
        }
    }
}

const fileService = new FileService();

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

// Get single event
router.get("/events/:id", verifyOrganizerToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            // Get event with venue information
            const eventResult = await client.query(
                `SELECT e.*, v.name as venue_name,
                        a.address_line_1 as venue_address,
                        a.locality as venue_city,
                        a.postal_code as venue_postal_code,
                        a.country_code as venue_country
                 FROM events e
                 LEFT JOIN venues v ON e.venue_id = v.id
                 LEFT JOIN address_relationships ar ON ar.entity_type = 'venue' AND ar.entity_id = v.id
                 LEFT JOIN addresses a ON ar.address_id = a.id
                 WHERE e.id = $1 AND e.organizer_id = $2`,
                [req.params.id, req.user.id]
            );

            if (eventResult.rows.length === 0) {
                return res.status(404).json({ message: "Event not found" });
            }

            const event = eventResult.rows[0];

            // Get the first category for this event (assuming one category per event for now)
            const categoryResult = await client.query(
                `SELECT c.id, c.name
                 FROM categories c
                 JOIN event_categories ec ON c.id = ec.category_id
                 WHERE ec.event_id = $1
                 LIMIT 1`,
                [req.params.id]
            );

            // Add category information to the event
            if (categoryResult.rows.length > 0) {
                event.category_id = categoryResult.rows[0].id;
                event.category_name = categoryResult.rows[0].name;
            }

            res.json(event);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ message: "Error fetching event" });
    }
});

// Create new event
router.post("/events", verifyOrganizerToken, async (req, res) => {
    try {
        const {
            title,
            description,
            event_date,
            venue_id,
            category_id,
            price,
            max_participants,
            requirements,
            cancellation_policy,
        } = req.body;

        // Validation
        if (!title || !description || !event_date || !venue_id || !category_id || price === undefined) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Create the event with draft status by default
            const eventResult = await client.query(
                `INSERT INTO events (
                    title, description, event_date, venue_id, organizer_id,
                    original_price, discounted_price, total_tickets, available_tickets,
                    is_featured, requirements, cancellation_policy, status, is_published,
                    moderation_status, status_changed_by, status_changed_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING *`,
                [
                    title,
                    description,
                    event_date,
                    venue_id,
                    req.user.id,
                    price, // original_price
                    price, // discounted_price (same as original for now)
                    max_participants || 100, // total_tickets
                    max_participants || 100, // available_tickets
                    false, // is_featured
                    requirements || null, // requirements
                    cancellation_policy || null, // cancellation_policy
                    "draft", // status - all new events start as draft
                    false, // is_published - not published by default
                    "pending", // moderation_status - new events need review
                    req.user.id, // status_changed_by
                    new Date(), // status_changed_at
                ]
            );

            const eventId = eventResult.rows[0].id;

            // Link the event to the category
            await client.query("INSERT INTO event_categories (event_id, category_id) VALUES ($1, $2)", [
                eventId,
                category_id,
            ]);

            await client.query("COMMIT");
            res.status(201).json(eventResult.rows[0]);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ message: "Error creating event" });
    }
});

// Update event
router.put("/events/:id", verifyOrganizerToken, async (req, res) => {
    try {
        const {
            title,
            description,
            event_date,
            venue_id,
            category_id,
            price,
            max_participants,
            requirements,
            cancellation_policy,
        } = req.body;

        // Validation
        if (!title || !description || !event_date || !venue_id || !category_id) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Check if event exists and belongs to organizer
            const checkResult = await client.query("SELECT id FROM events WHERE id = $1 AND organizer_id = $2", [
                req.params.id,
                req.user.id,
            ]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ message: "Event not found" });
            }

            // Update the event
            const eventResult = await client.query(
                `UPDATE events SET
                    title = $1, description = $2, event_date = $3, venue_id = $4,
                    original_price = $5, discounted_price = $6, total_tickets = $7,
                    available_tickets = $8, requirements = $9, cancellation_policy = $10,
                    updated_at = NOW()
                WHERE id = $11 AND organizer_id = $12
                RETURNING *`,
                [
                    title,
                    description,
                    event_date,
                    venue_id,
                    price, // original_price
                    price, // discounted_price
                    max_participants || 100, // total_tickets
                    max_participants || 100, // available_tickets
                    requirements || null, // requirements
                    cancellation_policy || null, // cancellation_policy
                    req.params.id,
                    req.user.id,
                ]
            );

            // Update category relationship
            // First, remove existing category relationships
            await client.query("DELETE FROM event_categories WHERE event_id = $1", [req.params.id]);

            // Then add the new category relationship
            await client.query("INSERT INTO event_categories (event_id, category_id) VALUES ($1, $2)", [
                req.params.id,
                category_id,
            ]);

            await client.query("COMMIT");
            res.json(eventResult.rows[0]);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: "Error updating event" });
    }
});

// Delete event
router.delete("/events/:id", verifyOrganizerToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            // Check if event has bookings
            const bookingsCheck = await client.query(
                "SELECT COUNT(*) as booking_count FROM bookings WHERE event_id = $1",
                [req.params.id]
            );

            if (parseInt(bookingsCheck.rows[0].booking_count) > 0) {
                return res.status(400).json({
                    message: "Cannot delete event with existing bookings. Please cancel all bookings first.",
                });
            }

            // Delete the event
            const result = await client.query("DELETE FROM events WHERE id = $1 AND organizer_id = $2 RETURNING *", [
                req.params.id,
                req.user.id,
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: "Event not found" });
            }

            res.json({ message: "Event deleted successfully" });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Error deleting event" });
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

// VENUE MANAGEMENT

// Get organizer's venues
router.get("/venues", verifyOrganizerToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query("SELECT * FROM get_organizer_venues($1)", [req.user.id]);

            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching venues:", error);
        res.status(500).json({ message: "Error fetching venues" });
    }
});

// Get single venue
router.get("/venues/:id", verifyOrganizerToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT v.*, a.address_line_1, a.address_line_2, a.locality,
                        a.administrative_area, a.postal_code, a.country_code,
                        a.latitude, a.longitude
                 FROM venues v
                 LEFT JOIN address_relationships ar ON (ar.entity_type = 'venue' AND ar.entity_id = v.id)
                 LEFT JOIN addresses a ON a.id = ar.address_id
                 WHERE v.id = $1 AND v.organizer_id = $2`,
                [req.params.id, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: "Venue not found" });
            }

            res.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching venue:", error);
        res.status(500).json({ message: "Error fetching venue" });
    }
});

// Create new venue
router.post("/venues", verifyOrganizerToken, async (req, res) => {
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

            // Create the venue
            const venueResult = await client.query(
                `INSERT INTO venues (name, capacity, organizer_id)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [name, capacity || null, req.user.id]
            );

            const venueId = venueResult.rows[0].id;

            // Link venue to address
            await client.query(
                `INSERT INTO address_relationships (address_id, entity_type, entity_id, relationship_type, is_active)
                 VALUES ($1, $2, $3, $4, $5)`,
                [addressId, "venue", venueId, "venue_location", true]
            );

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

// Update venue
router.put("/venues/:id", verifyOrganizerToken, async (req, res) => {
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

            // Check if venue exists and belongs to organizer
            const checkResult = await client.query("SELECT id FROM venues WHERE id = $1 AND organizer_id = $2", [
                req.params.id,
                req.user.id,
            ]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ message: "Venue not found" });
            }

            // Update venue
            await client.query(
                `UPDATE venues SET name = $1, capacity = $2
                 WHERE id = $3 AND organizer_id = $4`,
                [name, capacity || null, req.params.id, req.user.id]
            );

            // Update address
            await client.query(
                `UPDATE addresses SET
                    address_line_1 = $1, address_line_2 = $2, locality = $3,
                    administrative_area = $4, postal_code = $5, country_code = $6,
                    latitude = $7, longitude = $8, updated_at = NOW()
                 WHERE id IN (
                     SELECT ar.address_id FROM address_relationships ar
                     WHERE ar.entity_type = 'venue' AND ar.entity_id = $9
                 )`,
                [
                    address_line_1,
                    address_line_2 || null,
                    locality,
                    administrative_area || null,
                    postal_code || null,
                    country_code,
                    latitude || null,
                    longitude || null,
                    req.params.id,
                ]
            );

            await client.query("COMMIT");

            // Return updated venue with address
            const result = await client.query(
                `SELECT v.*, a.address_line_1, a.address_line_2, a.locality,
                        a.administrative_area, a.postal_code, a.country_code,
                        a.latitude, a.longitude
                 FROM venues v
                 LEFT JOIN address_relationships ar ON (ar.entity_type = 'venue' AND ar.entity_id = v.id)
                 LEFT JOIN addresses a ON a.id = ar.address_id
                 WHERE v.id = $1`,
                [req.params.id]
            );

            res.json(result.rows[0]);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error updating venue:", error);
        res.status(500).json({ message: "Error updating venue" });
    }
});

// Delete venue
router.delete("/venues/:id", verifyOrganizerToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Check if venue has events
            const eventsCheck = await client.query("SELECT COUNT(*) as count FROM events WHERE venue_id = $1", [
                req.params.id,
            ]);

            if (parseInt(eventsCheck.rows[0].count) > 0) {
                return res.status(400).json({
                    message: "Cannot delete venue with existing events",
                });
            }

            // Delete venue (this will cascade to address_relationships)
            const result = await client.query("DELETE FROM venues WHERE id = $1 AND organizer_id = $2 RETURNING *", [
                req.params.id,
                req.user.id,
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: "Venue not found" });
            }

            await client.query("COMMIT");
            res.json({ message: "Venue deleted successfully" });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error deleting venue:", error);
        res.status(500).json({ message: "Error deleting venue" });
    }
});

// Upload event image
router.post("/events/:id/image", verifyOrganizerToken, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const eventId = req.params.id;

        // First verify the event belongs to the organizer
        const client = await pool.connect();
        try {
            const eventCheck = await client.query("SELECT id FROM events WHERE id = $1 AND organizer_id = $2", [
                eventId,
                req.user.id,
            ]);

            if (eventCheck.rows.length === 0) {
                return res.status(404).json({ error: "Event not found or access denied" });
            }

            // Process the image using sharp
            const processedImage = await sharp(req.file.buffer)
                .resize(1200, 800, { fit: "cover" })
                .jpeg({ quality: 90 })
                .toBuffer();

            const processedFile = {
                ...req.file,
                buffer: processedImage,
                originalname: req.file.originalname.replace(/\.[^/.]+$/, "") + ".jpg",
                mimetype: "image/jpeg",
            };

            // Save the file
            const result = await fileService.saveFile(processedFile, "events", true);

            // Update the event with the image URL
            await client.query("UPDATE events SET image_url = $1, updated_at = NOW() WHERE id = $2", [
                result.url,
                eventId,
            ]);

            res.json({
                message: "Event image uploaded successfully",
                file: result,
                imageUrl: result.url,
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error uploading event image:", error);
        res.status(500).json({ error: "Failed to upload event image" });
    }
});

// STATUS MANAGEMENT ENDPOINTS

// Submit event for review (draft -> candidate)
router.patch("/events/:id/submit", verifyOrganizerToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Check if event exists and belongs to organizer
            const checkResult = await client.query("SELECT * FROM events WHERE id = $1 AND organizer_id = $2", [
                req.params.id,
                req.user.id,
            ]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ message: "Event not found" });
            }

            const event = checkResult.rows[0];

            // Allow submission from draft status or events that need resubmission (rejected, revision_requested, flagged)
            if (event.status !== "draft" && 
                event.moderation_status !== "rejected" && 
                event.moderation_status !== "revision_requested" && 
                event.moderation_status !== "flagged") {
                return res.status(400).json({
                    message: "Only draft events or events requiring resubmission can be submitted for review",
                });
            }

            // Update event status to candidate and moderation status to under_review
            const result = await client.query(
                `UPDATE events
                 SET status = 'candidate',
                     moderation_status = 'under_review',
                     status_changed_by = $1,
                     status_changed_at = NOW()
                 WHERE id = $2 AND organizer_id = $3
                 RETURNING *`,
                [req.user.id, req.params.id, req.user.id]
            );

            await client.query("COMMIT");
            res.json({
                message: "Event submitted for review",
                event: result.rows[0],
            });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error submitting event for review:", error);
        res.status(500).json({ message: "Error submitting event for review" });
    }
});

// Publish/unpublish approved event
router.patch("/events/:id/publish", verifyOrganizerToken, async (req, res) => {
    try {
        const { is_published } = req.body;

        if (typeof is_published !== "boolean") {
            return res.status(400).json({ message: "is_published must be a boolean" });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Check if event exists and belongs to organizer
            const checkResult = await client.query("SELECT * FROM events WHERE id = $1 AND organizer_id = $2", [
                req.params.id,
                req.user.id,
            ]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ message: "Event not found" });
            }

            const event = checkResult.rows[0];

            // Only allow publishing if event is approved
            if (event.moderation_status !== "approved") {
                return res.status(400).json({
                    message: "Only approved events can be published/unpublished",
                });
            }

            // Update publication status
            const result = await client.query(
                `UPDATE events
                 SET is_published = $1,
                     status_changed_by = $2,
                     status_changed_at = NOW()
                 WHERE id = $3 AND organizer_id = $4
                 RETURNING *`,
                [is_published, req.user.id, req.params.id, req.user.id]
            );

            await client.query("COMMIT");
            res.json({
                message: `Event ${is_published ? "published" : "unpublished"} successfully`,
                event: result.rows[0],
            });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error updating event publication status:", error);
        res.status(500).json({ message: "Error updating event publication status" });
    }
});

// Toggle organizer publication intent
router.patch("/events/:id/toggle-publication", verifyOrganizerToken, async (req, res) => {
    try {
        const { organizer_wants_published } = req.body;
        
        if (typeof organizer_wants_published !== 'boolean') {
            return res.status(400).json({ message: "organizer_wants_published must be a boolean" });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Verify event belongs to organizer
            const checkResult = await client.query("SELECT id FROM events WHERE id = $1 AND organizer_id = $2", [
                req.params.id,
                req.user.id,
            ]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ message: "Event not found" });
            }

            // Update organizer publication intent (fallback to is_published if column doesn't exist)
            let result;
            try {
                result = await client.query(
                    `UPDATE events
                     SET organizer_wants_published = $1,
                         status_changed_by = $2,
                         status_changed_at = NOW()
                     WHERE id = $3 AND organizer_id = $4
                     RETURNING *`,
                    [organizer_wants_published, req.user.id, req.params.id, req.user.id]
                );
            } catch (columnError) {
                // Fallback: if organizer_wants_published column doesn't exist, use is_published
                console.log("organizer_wants_published column not found, using is_published as fallback");
                result = await client.query(
                    `UPDATE events
                     SET is_published = $1,
                         status_changed_by = $2,
                         status_changed_at = NOW()
                     WHERE id = $3 AND organizer_id = $4
                     RETURNING *`,
                    [organizer_wants_published, req.user.id, req.params.id, req.user.id]
                );
            }

            await client.query("COMMIT");
            res.json({
                message: `Publication intent ${organizer_wants_published ? "enabled" : "disabled"} successfully`,
                event: result.rows[0],
            });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error updating publication intent:", error);
        res.status(500).json({ message: "Error updating publication intent" });
    }
});

// Get event status history
router.get("/events/:id/status-history", verifyOrganizerToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            // Verify event belongs to organizer
            const eventCheck = await client.query("SELECT id FROM events WHERE id = $1 AND organizer_id = $2", [
                req.params.id,
                req.user.id,
            ]);

            if (eventCheck.rows.length === 0) {
                return res.status(404).json({ message: "Event not found" });
            }

            // Get status history
            const result = await client.query(
                `SELECT esh.*, u.email as changed_by_email
                 FROM event_status_history esh
                 LEFT JOIN users u ON esh.changed_by = u.id
                 WHERE esh.event_id = $1
                 ORDER BY esh.created_at DESC`,
                [req.params.id]
            );

            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching event status history:", error);
        res.status(500).json({ message: "Error fetching event status history" });
    }
});

// Revert event to draft (only from candidate status and if not yet reviewed)
router.patch("/events/:id/revert", verifyOrganizerToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Check if event exists and belongs to organizer
            const checkResult = await client.query("SELECT * FROM events WHERE id = $1 AND organizer_id = $2", [
                req.params.id,
                req.user.id,
            ]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ message: "Event not found" });
            }

            const event = checkResult.rows[0];

            // Only allow reverting from candidate status and if still under review
            if (event.status !== "candidate" || event.moderation_status !== "under_review") {
                return res.status(400).json({
                    message: "Can only revert candidate events that are still under review",
                });
            }

            // Update event status back to draft
            const result = await client.query(
                `UPDATE events
                 SET status = 'draft',
                     moderation_status = 'pending',
                     status_changed_by = $1,
                     status_changed_at = NOW()
                 WHERE id = $2 AND organizer_id = $3
                 RETURNING *`,
                [req.user.id, req.params.id, req.user.id]
            );

            await client.query("COMMIT");
            res.json({
                message: "Event reverted to draft successfully",
                event: result.rows[0],
            });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error reverting event to draft:", error);
        res.status(500).json({ message: "Error reverting event to draft" });
    }
});

// Get organizer notifications
router.get("/notifications", verifyOrganizerToken, async (req, res) => {
    try {
        const { limit = 20, offset = 0, unread_only = false } = req.query;

        const client = await pool.connect();
        try {
            let whereClause = "WHERE organizer_id = $1";
            let params = [req.user.id];

            if (unread_only === "true") {
                whereClause += " AND is_read = false";
            }

            const result = await client.query(
                `SELECT * FROM organizer_notifications
                 ${whereClause}
                 ORDER BY created_at DESC
                 LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
                [...params, limit, offset]
            );

            // Get unread count
            const unreadResult = await client.query(
                "SELECT COUNT(*) as unread_count FROM organizer_notifications WHERE organizer_id = $1 AND is_read = false",
                [req.user.id]
            );

            res.json({
                notifications: result.rows,
                unread_count: parseInt(unreadResult.rows[0].unread_count),
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Error fetching notifications" });
    }
});

// Mark notification as read
router.patch("/notifications/:id/read", verifyOrganizerToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `UPDATE organizer_notifications
                 SET is_read = true
                 WHERE id = $1 AND organizer_id = $2
                 RETURNING *`,
                [req.params.id, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: "Notification not found" });
            }

            res.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ message: "Error marking notification as read" });
    }
});

// Mark all notifications as read
router.patch("/notifications/read-all", verifyOrganizerToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            await client.query(
                "UPDATE organizer_notifications SET is_read = true WHERE organizer_id = $1 AND is_read = false",
                [req.user.id]
            );

            res.json({ message: "All notifications marked as read" });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({ message: "Error marking all notifications as read" });
    }
});

// Ticket Templates Routes

// GET /api/organizer/ticket-templates
router.get("/ticket-templates", verifyOrganizerToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM ticket_templates WHERE organizer_id = $1 ORDER BY created_at DESC',
                [req.user.id]
            );
            
            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching ticket templates:', error);
        res.status(500).json({ message: 'Error fetching ticket templates' });
    }
});

// POST /api/organizer/ticket-templates
router.post("/ticket-templates", verifyOrganizerToken, async (req, res) => {
    try {
        const { name, description, template_data } = req.body;
        
        const client = await pool.connect();
        try {
            const result = await client.query(
                'INSERT INTO ticket_templates (name, description, template_data, organizer_id) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, description, JSON.stringify(template_data), req.user.id]
            );
            
            res.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating ticket template:', error);
        res.status(500).json({ message: 'Error creating ticket template' });
    }
});

// PUT /api/organizer/ticket-templates/:id
router.put("/ticket-templates/:id", verifyOrganizerToken, async (req, res) => {
    try {
        const { name, description, template_data } = req.body;
        const templateId = req.params.id;
        
        const client = await pool.connect();
        try {
            const result = await client.query(
                'UPDATE ticket_templates SET name = $1, description = $2, template_data = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND organizer_id = $5 RETURNING *',
                [name, description, JSON.stringify(template_data), templateId, req.user.id]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Ticket template not found or not authorized' });
            }
            
            res.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating ticket template:', error);
        res.status(500).json({ message: 'Error updating ticket template' });
    }
});

// DELETE /api/organizer/ticket-templates/:id
router.delete("/ticket-templates/:id", verifyOrganizerToken, async (req, res) => {
    try {
        const templateId = req.params.id;
        
        const client = await pool.connect();
        try {
            const result = await client.query(
                'DELETE FROM ticket_templates WHERE id = $1 AND organizer_id = $2 RETURNING *',
                [templateId, req.user.id]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Ticket template not found or not authorized' });
            }
            
            res.json({ message: 'Template deleted successfully' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting ticket template:', error);
        res.status(500).json({ message: 'Error deleting ticket template' });
    }
});

export default router;
