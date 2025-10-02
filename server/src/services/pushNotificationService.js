// Push Notification Service - Web Push API implementation
import webpush from 'web-push';
import pool from '../db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PushNotificationService {
    constructor() {
        this.setupWebPush();
        this.templates = this.loadPushTemplates();
    }

    setupWebPush() {
        // VAPID keys should be in environment variables
        const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
        const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
        const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:notifications@be-out-app.com';

        if (!vapidPublicKey || !vapidPrivateKey) {
            console.warn('VAPID keys not configured. Push notifications will not work.');
            console.warn('Generate VAPID keys with: npx web-push generate-vapid-keys');
            return;
        }

        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
        this.isConfigured = true;
    }

    loadPushTemplates() {
        // Load push notification templates from JSON files
        const templates = {};
        const templateDir = join(__dirname, '../templates/push');

        try {
            if (fs.existsSync(templateDir)) {
                const files = fs.readdirSync(templateDir);
                files.forEach(file => {
                    if (file.endsWith('.json')) {
                        const templateName = file.replace('.json', '');
                        const templatePath = join(templateDir, file);
                        const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

                        // Use the template key if available, otherwise use filename
                        const templateKey = templateData.key || templateName;
                        templates[templateKey] = templateData;
                    }
                });
            }
        } catch (error) {
            console.error('Error loading push templates:', error);
        }

        console.log(`Loaded ${Object.keys(templates).length} push notification templates`);
        return templates;
    }

    /**
     * Register a push subscription for a user
     * @param {string} userId - User ID
     * @param {Object} subscription - Push subscription object from browser
     * @param {string} userAgent - User agent string
     */
    async registerSubscription(userId, subscription, userAgent = '') {
        const client = await pool.connect();
        try {
            const { endpoint, keys } = subscription;
            const { p256dh, auth } = keys;

            // Determine platform from user agent
            let platform = 'web';
            if (userAgent.includes('Mobile')) {
                platform = userAgent.includes('iPhone') ? 'ios' : 'android';
            }

            await client.query(
                `INSERT INTO push_subscriptions
                 (user_id, endpoint, p256dh_key, auth_key, user_agent, platform)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (user_id, endpoint)
                 DO UPDATE SET
                    p256dh_key = $3,
                    auth_key = $4,
                    user_agent = $5,
                    platform = $6,
                    is_active = true,
                    updated_at = CURRENT_TIMESTAMP,
                    last_used_at = CURRENT_TIMESTAMP`,
                [userId, endpoint, p256dh, auth, userAgent, platform]
            );

            return { success: true };
        } catch (error) {
            console.error('Error registering push subscription:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Unregister a push subscription
     * @param {string} userId - User ID
     * @param {string} endpoint - Subscription endpoint to remove
     */
    async unregisterSubscription(userId, endpoint) {
        const client = await pool.connect();
        try {
            await client.query(
                `UPDATE push_subscriptions
                 SET is_active = false, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1 AND endpoint = $2`,
                [userId, endpoint]
            );

            return { success: true };
        } finally {
            client.release();
        }
    }

    /**
     * Get active push subscriptions for a user
     * @param {string} userId - User ID
     */
    async getUserSubscriptions(userId) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT endpoint, p256dh_key, auth_key, platform
                 FROM push_subscriptions
                 WHERE user_id = $1 AND is_active = true`,
                [userId]
            );

            return result.rows.map(row => ({
                endpoint: row.endpoint,
                keys: {
                    p256dh: row.p256dh_key,
                    auth: row.auth_key
                },
                platform: row.platform
            }));
        } finally {
            client.release();
        }
    }

    /**
     * Send a push notification
     * @param {Object} notificationData - Notification details
     */
    async sendNotification(notificationData) {
        if (!this.isConfigured) {
            return { success: false, error: 'Push notifications not configured' };
        }

        const { userId, template, templateData, language = 'fr' } = notificationData;

        try {
            // Get user's active push subscriptions
            const subscriptions = await this.getUserSubscriptions(userId);

            if (subscriptions.length === 0) {
                return { success: false, error: 'No active push subscriptions found' };
            }

            // Get template content
            const templateContent = this.getTemplateContent(template, language, templateData);

            if (!templateContent) {
                return { success: false, error: `Template ${template} not found` };
            }

            // Send to all user's devices
            const sendPromises = subscriptions.map(subscription =>
                this.sendToSubscription(subscription, templateContent)
            );

            const results = await Promise.allSettled(sendPromises);
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

            // Clean up failed subscriptions
            const failedSubscriptions = results
                .map((result, index) => ({ result, subscription: subscriptions[index] }))
                .filter(({ result }) => result.status === 'rejected' || !result.value.success)
                .map(({ subscription }) => subscription);

            if (failedSubscriptions.length > 0) {
                await this.cleanupFailedSubscriptions(userId, failedSubscriptions);
            }

            return {
                success: successful > 0,
                messageId: `push_${Date.now()}`,
                sentTo: successful,
                totalSubscriptions: subscriptions.length
            };

        } catch (error) {
            console.error('Error sending push notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send notification to a single subscription
     * @param {Object} subscription - Push subscription
     * @param {Object} payload - Notification payload
     */
    async sendToSubscription(subscription, payload) {
        try {
            const result = await webpush.sendNotification(
                subscription,
                JSON.stringify(payload),
                {
                    TTL: 24 * 60 * 60, // 24 hours
                    urgency: 'normal'
                }
            );

            return { success: true, result };
        } catch (error) {
            console.error('Error sending to subscription:', error);

            // Check if subscription is invalid/expired
            if (error.statusCode === 410 || error.statusCode === 404) {
                return { success: false, error: 'subscription_expired', subscription };
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * Clean up failed/expired subscriptions
     * @param {string} userId - User ID
     * @param {Array} failedSubscriptions - Array of failed subscription objects
     */
    async cleanupFailedSubscriptions(userId, failedSubscriptions) {
        const client = await pool.connect();
        try {
            const endpoints = failedSubscriptions.map(sub => sub.endpoint);

            await client.query(
                `UPDATE push_subscriptions
                 SET is_active = false, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1 AND endpoint = ANY($2)`,
                [userId, endpoints]
            );
        } catch (error) {
            console.error('Error cleaning up failed subscriptions:', error);
        } finally {
            client.release();
        }
    }

    /**
     * Get template content with variable substitution
     * @param {string} templateKey - Template key
     * @param {string} language - Language code
     * @param {Object} templateData - Data for template variables
     */
    getTemplateContent(templateKey, language, templateData) {
        const template = this.templates[templateKey];
        if (!template) {
            return null;
        }

        let content;

        // Handle both old format (language as top-level keys) and new format (title/body objects)
        if (template[language]) {
            // Old format: direct language access
            content = template[language];
        } else if (template.title && template.title[language]) {
            // New format: structured with title/body objects
            content = {
                title: template.title[language],
                body: template.body[language],
                icon: template.icon,
                badge: template.badge,
                tag: template.key || templateKey,
                actions: template.actions,
                requireInteraction: template.requireInteraction
            };
        } else {
            // Fallback to French if requested language not available
            if (template.fr) {
                content = template.fr; // Old format fallback
            } else if (template.title && template.title.fr) {
                content = {
                    title: template.title.fr,
                    body: template.body.fr,
                    icon: template.icon,
                    badge: template.badge,
                    tag: template.key || templateKey,
                    actions: template.actions,
                    requireInteraction: template.requireInteraction
                };
            } else {
                return null;
            }
        }

        // Replace template variables
        let title = content.title;
        let body = content.body;
        let icon = content.icon || '/icons/notification-icon.png';
        let badge = content.badge || '/icons/badge-icon.png';
        let tag = content.tag || templateKey;

        // Simple template variable replacement
        if (templateData) {
            Object.entries(templateData).forEach(([key, value]) => {
                const placeholder = `{{${key}}}`;
                title = title.replace(new RegExp(placeholder, 'g'), value);
                body = body.replace(new RegExp(placeholder, 'g'), value);
            });
        }

        return {
            title,
            body,
            icon,
            badge,
            tag,
            data: {
                ...templateData,
                timestamp: new Date().toISOString(),
                template: templateKey
            },
            actions: content.actions || [],
            requireInteraction: content.requireInteraction || false
        };
    }

    /**
     * Test push notification functionality
     * @param {string} templateKey - Template key to test
     * @param {Object} testData - Test data for variables
     * @param {string} language - Language to test
     * @param {string} adminUserId - Admin user ID for testing
     */
    async sendTestNotification(templateKey, testData = {}, language = 'fr', adminUserId) {
        // For testing, we'll use a mock subscription or admin's subscription
        const mockNotification = {
            template: templateKey,
            templateData: {
                ...testData,
                timestamp: new Date().toLocaleString('fr-FR')
            },
            language
        };

        const templateContent = this.getTemplateContent(templateKey, language, mockNotification.templateData);

        if (!templateContent) {
            throw new Error(`Template ${templateKey} not found for language ${language}`);
        }

        // Log the test notification
        const client = await pool.connect();
        try {
            await client.query(
                `INSERT INTO notification_delivery_log
                 (user_id, template_key, channel, recipient, status, sent_at, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    adminUserId,
                    templateKey,
                    'push',
                    'test@admin.local',
                    'test_sent',
                    new Date(),
                    JSON.stringify({
                        test: true,
                        templateContent,
                        testData
                    })
                ]
            );
        } catch (error) {
            console.error('Error logging test notification:', error);
        } finally {
            client.release();
        }

        return {
            success: true,
            messageId: `test_push_${Date.now()}`,
            templateContent,
            testData: mockNotification.templateData
        };
    }

    /**
     * Get all available push notification templates
     */
    async getAllTemplates() {
        const templateList = [];
        const templateDir = join(__dirname, '../templates/push');

        try {
            if (!fs.existsSync(templateDir)) {
                fs.mkdirSync(templateDir, { recursive: true });
            }

            const files = fs.readdirSync(templateDir);

            files.forEach(file => {
                if (file.endsWith('.json')) {
                    try {
                        const templatePath = join(templateDir, file);
                        const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

                        templateList.push({
                            id: file.replace('.json', ''),
                            key: template.key || file.replace('.json', ''),
                            name: template.name || file.replace('.json', ''),
                            description: template.description || '',
                            type: template.type || 'general',
                            title: template.title || { fr: '', en: '', es: '' },
                            body: template.body || { fr: '', en: '', es: '' },
                            icon: template.icon || '',
                            badge: template.badge || '',
                            image: template.image || '',
                            actions: template.actions || [],
                            created_at: template.created_at || new Date().toISOString(),
                            updated_at: template.updated_at || new Date().toISOString()
                        });
                    } catch (error) {
                        console.error(`Error loading template ${file}:`, error);
                    }
                }
            });
        } catch (error) {
            console.error('Error reading template directory:', error);
        }

        return templateList;
    }

    /**
     * Create a new push notification template
     */
    async createTemplate(templateData) {
        const templateDir = join(__dirname, '../templates/push');

        if (!fs.existsSync(templateDir)) {
            fs.mkdirSync(templateDir, { recursive: true });
        }

        const filename = `${templateData.key}.json`;
        const filepath = join(templateDir, filename);

        // Check if template already exists
        if (fs.existsSync(filepath)) {
            throw new Error(`Template with key ${templateData.key} already exists`);
        }

        const template = {
            ...templateData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            fs.writeFileSync(filepath, JSON.stringify(template, null, 2));
            this.templates[templateData.key] = template;

            return {
                ...template,
                id: templateData.key
            };
        } catch (error) {
            console.error('Error creating push template:', error);
            throw error;
        }
    }

    /**
     * Update an existing push notification template
     */
    async updateTemplate(templateId, templateData) {
        const templateDir = join(__dirname, '../templates/push');
        const filename = `${templateId}.json`;
        const filepath = join(templateDir, filename);

        if (!fs.existsSync(filepath)) {
            return null;
        }

        try {
            const existingTemplate = JSON.parse(fs.readFileSync(filepath, 'utf8'));

            const updatedTemplate = {
                ...existingTemplate,
                ...templateData,
                updated_at: new Date().toISOString()
            };

            fs.writeFileSync(filepath, JSON.stringify(updatedTemplate, null, 2));
            this.templates[templateId] = updatedTemplate;

            return {
                ...updatedTemplate,
                id: templateId
            };
        } catch (error) {
            console.error('Error updating push template:', error);
            throw error;
        }
    }

    /**
     * Delete a push notification template
     */
    async deleteTemplate(templateId) {
        const templateDir = join(__dirname, '../templates/push');
        const filename = `${templateId}.json`;
        const filepath = join(templateDir, filename);

        if (!fs.existsSync(filepath)) {
            return false;
        }

        try {
            fs.unlinkSync(filepath);
            delete this.templates[templateId];
            return true;
        } catch (error) {
            console.error('Error deleting push template:', error);
            throw error;
        }
    }

    /**
     * Get push notification settings
     */
    async getSettings() {
        return {
            vapidConfigured: this.isConfigured,
            publicKey: process.env.VAPID_PUBLIC_KEY || null,
            subject: process.env.VAPID_SUBJECT || 'mailto:notifications@be-out-app.com',
            defaultIcon: '/icons/notification-icon.png',
            defaultBadge: '/icons/badge-icon.png',
            ttl: 24 * 60 * 60, // 24 hours
            urgency: 'normal'
        };
    }

    /**
     * Update push notification settings
     */
    async updateSettings(newSettings) {
        // For now, settings are environment-based
        // In a real app, you might want to store some settings in database
        console.log('Push notification settings update requested:', newSettings);

        // Return current settings since we can't update env vars at runtime
        return await this.getSettings();
    }
}

export default new PushNotificationService();
