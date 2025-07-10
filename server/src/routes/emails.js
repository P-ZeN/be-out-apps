import { Router } from "express";
import pool from "../db.js";
import emailService from "../services/emailService.js";
import authenticateToken from "../middleware/authenticateToken.js";

const router = Router();

// Middleware to check admin permissions
const requireAdmin = async (req, res, next) => {
    try {
        authenticateToken(req, res, () => {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ error: "Admin authentication required" });
            }

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

// Get all email templates
router.get("/templates", requireAdmin, async (req, res) => {
    const { language } = req.query;
    const client = await pool.connect();
    try {
        let query = "SELECT * FROM email_templates";
        let params = [];

        if (language) {
            query += " WHERE language = $1";
            params.push(language);
        }

        query += " ORDER BY name, language";

        const result = await client.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching email templates:", error);
        res.status(500).json({ error: "Failed to fetch email templates" });
    } finally {
        client.release();
    }
});

// Get single email template
router.get("/templates/:id", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query("SELECT * FROM email_templates WHERE id = $1", [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Email template not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching email template:", error);
        res.status(500).json({ error: "Failed to fetch email template" });
    } finally {
        client.release();
    }
});

// Create new email template
router.post("/templates", requireAdmin, async (req, res) => {
    const { name, language, subject, body, description, variables } = req.body;

    if (!name || !language || !subject || !body) {
        return res.status(400).json({ error: "Name, language, subject, and body are required" });
    }

    const client = await pool.connect();
    try {
        const result = await client.query(
            `INSERT INTO email_templates (name, language, subject, body, description, variables, created_by, updated_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [name, language, subject, body, description, variables || {}, req.adminUser.id, req.adminUser.id]
        );

        // Clear template cache
        emailService.clearTemplateCache();

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating email template:", error);
        if (error.code === "23505") {
            // Unique constraint violation
            res.status(409).json({ error: "Email template with this name and language already exists" });
        } else {
            res.status(500).json({ error: "Failed to create email template" });
        }
    } finally {
        client.release();
    }
});

// Update email template
router.put("/templates/:id", requireAdmin, async (req, res) => {
    const { name, language, subject, body, description, variables, is_active } = req.body;

    if (!name || !language || !subject || !body) {
        return res.status(400).json({ error: "Name, language, subject, and body are required" });
    }

    const client = await pool.connect();
    try {
        const result = await client.query(
            `UPDATE email_templates
             SET name = $1, language = $2, subject = $3, body = $4, description = $5, variables = $6, is_active = $7, updated_by = $8
             WHERE id = $9 RETURNING *`,
            [
                name,
                language,
                subject,
                body,
                description,
                variables || {},
                is_active !== undefined ? is_active : true,
                req.adminUser.id,
                req.params.id,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Email template not found" });
        }

        // Clear template cache
        emailService.clearTemplateCache();

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating email template:", error);
        if (error.code === "23505") {
            // Unique constraint violation
            res.status(409).json({ error: "Email template with this name and language already exists" });
        } else {
            res.status(500).json({ error: "Failed to update email template" });
        }
    } finally {
        client.release();
    }
});

// Delete email template
router.delete("/templates/:id", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query("DELETE FROM email_templates WHERE id = $1 RETURNING *", [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Email template not found" });
        }

        // Clear template cache
        emailService.clearTemplateCache();

        res.json({ message: "Email template deleted successfully" });
    } catch (error) {
        console.error("Error deleting email template:", error);
        res.status(500).json({ error: "Failed to delete email template" });
    } finally {
        client.release();
    }
});

// Test email template
router.post("/templates/:id/test", requireAdmin, async (req, res) => {
    const { email, variables } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Test email address is required" });
    }

    const client = await pool.connect();
    try {
        const result = await client.query("SELECT * FROM email_templates WHERE id = $1", [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Email template not found" });
        }

        const template = result.rows[0];

        // Send test email
        await emailService.sendTemplatedEmail(template.name, email, variables || {}, {
            from: `Test <${req.adminUser.email}>`,
        });

        res.json({ message: "Test email sent successfully" });
    } catch (error) {
        console.error("Error sending test email:", error);
        res.status(500).json({ error: "Failed to send test email" });
    } finally {
        client.release();
    }
});

// Get email logs
router.get("/logs", requireAdmin, async (req, res) => {
    const { page = 1, limit = 50, status, template_name } = req.query;
    const offset = (page - 1) * limit;

    const client = await pool.connect();
    try {
        let query = `
            SELECT * FROM email_logs
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            params.push(status);
            query += ` AND status = $${params.length}`;
        }

        if (template_name) {
            params.push(template_name);
            query += ` AND template_name = $${params.length}`;
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await client.query(query, params);

        // Get total count
        let countQuery = `SELECT COUNT(*) FROM email_logs WHERE 1=1`;
        const countParams = [];

        if (status) {
            countParams.push(status);
            countQuery += ` AND status = $${countParams.length}`;
        }

        if (template_name) {
            countParams.push(template_name);
            countQuery += ` AND template_name = $${countParams.length}`;
        }

        const countResult = await client.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            logs: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching email logs:", error);
        res.status(500).json({ error: "Failed to fetch email logs" });
    } finally {
        client.release();
    }
});

// Get email settings
router.get("/settings", requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query("SELECT * FROM email_settings ORDER BY setting_key");
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching email settings:", error);
        res.status(500).json({ error: "Failed to fetch email settings" });
    } finally {
        client.release();
    }
});

// Update email setting
router.put("/settings/:key", requireAdmin, async (req, res) => {
    const { value } = req.body;

    if (!value) {
        return res.status(400).json({ error: "Value is required" });
    }

    const client = await pool.connect();
    try {
        const result = await client.query(
            `UPDATE email_settings
             SET setting_value = $1, updated_by = $2
             WHERE setting_key = $3 RETURNING *`,
            [value, req.adminUser.id, req.params.key]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Email setting not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating email setting:", error);
        res.status(500).json({ error: "Failed to update email setting" });
    } finally {
        client.release();
    }
});

// Send bulk email
router.post("/bulk-send", requireAdmin, async (req, res) => {
    const { template_name, recipients, variables } = req.body;

    if (!template_name || !recipients || !Array.isArray(recipients)) {
        return res.status(400).json({ error: "Template name and recipients array are required" });
    }

    try {
        const results = await emailService.sendBulkEmails(
            recipients,
            template_name,
            variables || {},
            { delay: 200 } // 200ms delay between emails
        );

        res.json({
            message: "Bulk email sending completed",
            results: results,
            summary: {
                total: results.length,
                sent: results.filter((r) => r.success).length,
                failed: results.filter((r) => !r.success).length,
            },
        });
    } catch (error) {
        console.error("Error sending bulk emails:", error);
        res.status(500).json({ error: "Failed to send bulk emails" });
    }
});

export default router;
