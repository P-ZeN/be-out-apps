import sgMail from "@sendgrid/mail";
import handlebars from "handlebars";
import pool from "../db.js";
import fs from "fs/promises";
import path from "path";

class EmailService {
    constructor() {
        // Initialize SendGrid
        if (process.env.SENDGRID_API_KEY) {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        }

        this.defaultFrom = process.env.DEFAULT_FROM_EMAIL || "noreply@beout.app";
        this.templateCache = new Map();
    }

    /**
     * Send email using a template stored in the database
     * @param {string} templateName - Name of the template
     * @param {string} to - Recipient email
     * @param {Object} variables - Variables to replace in template
     * @param {Object} options - Additional options (language, from, etc.)
     */
    async sendTemplatedEmail(templateName, to, variables = {}, options = {}) {
        try {
            const language = options.language || "en";
            const template = await this.getEmailTemplate(templateName, language);
            if (!template) {
                throw new Error(`Email template '${templateName}' not found for language '${language}'`);
            }

            const compiledSubject = handlebars.compile(template.subject);
            const compiledBody = handlebars.compile(template.body);

            const subject = compiledSubject(variables);
            const htmlBody = compiledBody(variables);

            const msg = {
                to,
                from: options.from || this.defaultFrom,
                subject,
                html: htmlBody,
                ...options,
            };

            if (process.env.NODE_ENV === "development") {
                console.log("Email would be sent:", { to, subject, templateName, language });
                console.log("HTML Preview:", htmlBody);
                return { success: true, messageId: "dev-mode" };
            }

            const result = await sgMail.send(msg);

            // Log email sent
            await this.logEmailSent(to, templateName, subject, "sent");

            return { success: true, messageId: result[0].headers["x-message-id"] };
        } catch (error) {
            console.error("Email sending failed:", error);
            await this.logEmailSent(to, templateName, "", "failed", error.message);
            throw error;
        }
    }

    /**
     * Get email template from database
     * @param {string} templateName - Name of the template
     * @param {string} language - Language code (default: 'en')
     */
    async getEmailTemplate(templateName, language = "en") {
        const cacheKey = `template_${templateName}_${language}`;

        // Check cache first
        if (this.templateCache.has(cacheKey)) {
            return this.templateCache.get(cacheKey);
        }

        const client = await pool.connect();
        try {
            let result = await client.query(
                "SELECT * FROM email_templates WHERE name = $1 AND language = $2 AND is_active = true",
                [templateName, language]
            );

            // If not found in requested language, fallback to English
            if (result.rows.length === 0 && language !== "en") {
                result = await client.query(
                    "SELECT * FROM email_templates WHERE name = $1 AND language = $2 AND is_active = true",
                    [templateName, "en"]
                );
            }

            if (result.rows.length === 0) {
                return null;
            }

            const template = result.rows[0];

            // Cache for 5 minutes
            this.templateCache.set(cacheKey, template);
            setTimeout(() => this.templateCache.delete(cacheKey), 5 * 60 * 1000);

            return template;
        } finally {
            client.release();
        }
    }

    /**
     * Log email activity
     */
    async logEmailSent(to, templateName, subject, status, errorMessage = null) {
        const client = await pool.connect();
        try {
            await client.query(
                `INSERT INTO email_logs (recipient, template_name, subject, status, error_message, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [to, templateName, subject, status, errorMessage]
            );
        } catch (error) {
            console.error("Failed to log email:", error);
        } finally {
            client.release();
        }
    }

    /**
     * Send simple email without template
     */
    async sendSimpleEmail(to, subject, htmlBody, options = {}) {
        try {
            const msg = {
                to,
                from: options.from || this.defaultFrom,
                subject,
                html: htmlBody,
                ...options,
            };

            if (process.env.NODE_ENV === "development") {
                console.log("Simple email would be sent:", { to, subject });
                return { success: true, messageId: "dev-mode" };
            }

            const result = await sgMail.send(msg);
            await this.logEmailSent(to, "simple", subject, "sent");

            return { success: true, messageId: result[0].headers["x-message-id"] };
        } catch (error) {
            console.error("Simple email sending failed:", error);
            await this.logEmailSent(to, "simple", subject, "failed", error.message);
            throw error;
        }
    }

    /**
     * Clear template cache
     */
    clearTemplateCache() {
        this.templateCache.clear();
    }

    /**
     * Send bulk emails (with rate limiting)
     */
    async sendBulkEmails(emails, templateName, variables = {}, options = {}) {
        const results = [];
        const delay = options.delay || 100; // 100ms between emails

        for (const email of emails) {
            try {
                const result = await this.sendTemplatedEmail(templateName, email, variables, options);
                results.push({ email, success: true, messageId: result.messageId });

                // Rate limiting
                if (delay > 0) {
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            } catch (error) {
                results.push({ email, success: false, error: error.message });
            }
        }

        return results;
    }
}

export default new EmailService();
