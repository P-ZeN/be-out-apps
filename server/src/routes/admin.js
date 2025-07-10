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
    return path.join(__dirname, `../../../client/src/i18n/locales/${language}/${namespace}.json`);
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

export default router;
