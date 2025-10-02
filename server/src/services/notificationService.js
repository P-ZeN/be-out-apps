// Notification Service - Core notification management
import pool from '../db.js';
import emailNotificationService from './emailNotificationService.js';
import pushNotificationService from './pushNotificationService.js';

class NotificationService {
    constructor() {
        this.channels = {
            email: emailNotificationService,
            push: pushNotificationService
        };
    }

    /**
     * Get user notification preferences
     * @param {string} userId - User ID
     * @returns {Object} User preferences object
     */
    async getUserPreferences(userId) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT notification_type, enabled
                 FROM user_notification_preferences
                 WHERE user_id = $1`,
                [userId]
            );

            // Convert to object format
            const preferences = {};
            result.rows.forEach(row => {
                preferences[row.notification_type] = row.enabled;
            });

            // Set defaults for missing preferences
            const defaultPreferences = {
                native: true,
                email: true,
                reminder24h: true,
                reminder2h: false,
                beOutNews: true
            };

            return { ...defaultPreferences, ...preferences };
        } finally {
            client.release();
        }
    }

    /**
     * Update user notification preferences
     * @param {string} userId - User ID
     * @param {Object} preferences - Preferences object
     */
    async updateUserPreferences(userId, preferences) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const [type, enabled] of Object.entries(preferences)) {
                await client.query(
                    `INSERT INTO user_notification_preferences (user_id, notification_type, enabled)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (user_id, notification_type)
                     DO UPDATE SET enabled = $3, updated_at = CURRENT_TIMESTAMP`,
                    [userId, type, enabled]
                );
            }

            await client.query('COMMIT');
            return { success: true };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Schedule a notification to be sent
     * @param {Object} notificationData - Notification details
     */
    async scheduleNotification(notificationData) {
        const {
            userId,
            bookingId,
            notificationType,
            channel,
            scheduledFor,
            messageTemplate,
            templateData = {}
        } = notificationData;

        const client = await pool.connect();
        try {
            const result = await client.query(
                `INSERT INTO notification_queue
                 (user_id, booking_id, notification_type, channel, scheduled_for, message_template, template_data)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [userId, bookingId, notificationType, channel, scheduledFor, messageTemplate, JSON.stringify(templateData)]
            );

            return { success: true, notificationId: result.rows[0].id };
        } finally {
            client.release();
        }
    }

    /**
     * Schedule event reminders for a booking
     * @param {Object} booking - Booking object with event details
     */
    async scheduleEventReminders(booking) {
        const preferences = await this.getUserPreferences(booking.user_id);
        const eventDate = new Date(booking.event_date);
        const now = new Date();

        const reminders = [];

        // 24-hour reminder
        if (preferences.reminder24h) {
            const reminder24h = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
            if (reminder24h > now) {
                // Schedule email reminder if email notifications enabled
                if (preferences.email) {
                    reminders.push(this.scheduleNotification({
                        userId: booking.user_id,
                        bookingId: booking.id,
                        notificationType: 'reminder24h',
                        channel: 'email',
                        scheduledFor: reminder24h,
                        messageTemplate: 'event_reminder_24h',
                        templateData: {
                            eventTitle: booking.event_title,
                            eventDate: booking.event_date,
                            eventLocation: booking.event_location,
                            bookingId: booking.id
                        }
                    }));
                }

                // Schedule push reminder if native notifications enabled
                if (preferences.native) {
                    reminders.push(this.scheduleNotification({
                        userId: booking.user_id,
                        bookingId: booking.id,
                        notificationType: 'reminder24h',
                        channel: 'push',
                        scheduledFor: reminder24h,
                        messageTemplate: 'event_reminder_24h_push',
                        templateData: {
                            eventTitle: booking.event_title,
                            eventDate: booking.event_date
                        }
                    }));
                }
            }
        }

        // 2-hour reminder
        if (preferences.reminder2h) {
            const reminder2h = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000);
            if (reminder2h > now) {
                // Schedule push reminder (2h reminders are typically push-only for immediacy)
                if (preferences.native) {
                    reminders.push(this.scheduleNotification({
                        userId: booking.user_id,
                        bookingId: booking.id,
                        notificationType: 'reminder2h',
                        channel: 'push',
                        scheduledFor: reminder2h,
                        messageTemplate: 'event_reminder_2h_push',
                        templateData: {
                            eventTitle: booking.event_title,
                            eventDate: booking.event_date
                        }
                    }));
                }
            }
        }

        return Promise.all(reminders);
    }

    /**
     * Process pending notifications (called by background job)
     */
    async processPendingNotifications() {
        const client = await pool.connect();
        try {
            // Get notifications ready to be sent
            const result = await client.query(
                `SELECT nq.*, u.email, up.first_name, up.last_name, up.preferred_language as language
                 FROM notification_queue nq
                 JOIN users u ON nq.user_id = u.id
                 LEFT JOIN user_profiles up ON u.id = up.user_id
                 WHERE nq.status = 'pending'
                   AND nq.scheduled_for <= CURRENT_TIMESTAMP
                   AND nq.attempts < nq.max_attempts
                 ORDER BY nq.scheduled_for ASC
                 LIMIT 100`
            );

            const processPromises = result.rows.map(notification =>
                this.processNotification(notification)
            );

            const results = await Promise.allSettled(processPromises);

            return {
                processed: results.length,
                successful: results.filter(r => r.status === 'fulfilled').length,
                failed: results.filter(r => r.status === 'rejected').length
            };
        } finally {
            client.release();
        }
    }

    /**
     * Process a single notification
     * @param {Object} notification - Notification record from database
     */
    async processNotification(notification) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Update attempt count
            await client.query(
                `UPDATE notification_queue
                 SET attempts = attempts + 1, last_attempt_at = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [notification.id]
            );

            // Get the appropriate channel service
            const channelService = this.channels[notification.channel];
            if (!channelService) {
                throw new Error(`Unknown notification channel: ${notification.channel}`);
            }

            // Send the notification
            const result = await channelService.sendNotification({
                userId: notification.user_id,
                email: notification.email,
                firstName: notification.first_name,
                lastName: notification.last_name,
                language: notification.language || 'fr',
                template: notification.message_template,
                templateData: notification.template_data
            });

            // Update status based on result
            if (result.success) {
                await client.query(
                    `UPDATE notification_queue
                     SET status = 'sent', sent_at = CURRENT_TIMESTAMP
                     WHERE id = $1`,
                    [notification.id]
                );

                // Log successful delivery
                await client.query(
                    `INSERT INTO notification_delivery_log
                     (notification_queue_id, user_id, channel, status, provider_message_id)
                     VALUES ($1, $2, $3, 'sent', $4)`,
                    [notification.id, notification.user_id, notification.channel, result.messageId]
                );
            } else {
                // Check if we should retry or mark as failed
                const shouldRetry = notification.attempts < notification.max_attempts - 1;
                const status = shouldRetry ? 'pending' : 'failed';

                await client.query(
                    `UPDATE notification_queue
                     SET status = $1, error_message = $2
                     WHERE id = $3`,
                    [status, result.error || 'Unknown error', notification.id]
                );

                // Log failed delivery
                await client.query(
                    `INSERT INTO notification_delivery_log
                     (notification_queue_id, user_id, channel, status, error_details)
                     VALUES ($1, $2, $3, 'failed', $4)`,
                    [notification.id, notification.user_id, notification.channel, JSON.stringify({ error: result.error })]
                );
            }

            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error processing notification:', error);

            // Mark as failed
            try {
                await client.query(
                    `UPDATE notification_queue
                     SET status = 'failed', error_message = $1
                     WHERE id = $2`,
                    [error.message, notification.id]
                );
            } catch (updateError) {
                console.error('Error updating failed notification:', updateError);
            }

            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Cancel scheduled notifications for a booking (e.g., if booking is cancelled)
     * @param {string} bookingId - Booking ID
     */
    async cancelBookingNotifications(bookingId) {
        const client = await pool.connect();
        try {
            await client.query(
                `UPDATE notification_queue
                 SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                 WHERE booking_id = $1 AND status = 'pending'`,
                [bookingId]
            );
            return { success: true };
        } finally {
            client.release();
        }
    }

    /**
     * Get notification analytics for a user
     * @param {string} userId - User ID
     * @param {number} days - Number of days to look back (default: 30)
     */
    async getNotificationAnalytics(userId, days = 30) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT
                    channel,
                    status,
                    COUNT(*) as count,
                    DATE_TRUNC('day', delivered_at) as date
                 FROM notification_delivery_log
                 WHERE user_id = $1
                   AND delivered_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
                 GROUP BY channel, status, DATE_TRUNC('day', delivered_at)
                 ORDER BY date DESC`,
                [userId]
            );

            return result.rows;
        } finally {
            client.release();
        }
    }
}

export default new NotificationService();
