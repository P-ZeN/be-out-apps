import emailService from "../services/emailService.js";
import pool from "../db.js";

class EmailNotificationService {
    /**
     * Send welcome email to new user
     */
    async sendWelcomeEmail(userId, userEmail, userName) {
        try {
            // Get user's preferred language
            const language = await this.getUserLanguage(userId);

            await emailService.sendTemplatedEmail(
                "welcome",
                userEmail,
                {
                    userName,
                    appName: "BeOut",
                    currentYear: new Date().getFullYear().toString(),
                },
                { language }
            );
        } catch (error) {
            console.error("Failed to send welcome email:", error);
            // Don't throw error - welcome email failure shouldn't block user registration
        }
    }

    /**
     * Send booking confirmation email
     */
    async sendBookingConfirmation(bookingId) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `
                SELECT
                    b.id,
                    b.reference,
                    b.total_amount,
                    b.ticket_count,
                    b.created_at,
                    u.email as user_email,
                    u.name as user_name,
                    u.id as user_id,
                    e.title as event_title,
                    e.event_date,
                    e.event_time,
                    e.location,
                    format_address(e.address_id) as formatted_address
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                JOIN events e ON b.event_id = e.id
                WHERE b.id = $1
            `,
                [bookingId]
            );

            if (result.rows.length === 0) {
                throw new Error("Booking not found");
            }

            const booking = result.rows[0];
            const eventDate = new Date(booking.event_date);
            const formattedDate = eventDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });

            // Get user's preferred language
            const language = await this.getUserLanguage(booking.user_id);

            await emailService.sendTemplatedEmail(
                "booking_confirmation",
                booking.user_email,
                {
                    userName: booking.user_name,
                    bookingReference: booking.reference,
                    eventTitle: booking.event_title,
                    eventDate: formattedDate,
                    eventTime: booking.event_time,
                    eventLocation: booking.location || booking.formatted_address,
                    ticketCount: booking.ticket_count.toString(),
                    totalAmount: `€${booking.total_amount}`,
                    bookingUrl: `${process.env.CLIENT_URL}/bookings/${booking.id}`,
                    appName: "BeOut",
                    currentYear: new Date().getFullYear().toString(),
                },
                { language }
            );
        } catch (error) {
            console.error("Failed to send booking confirmation email:", error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(userEmail, userName, resetToken, userId = null) {
        try {
            const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

            // Get user's preferred language if userId is provided
            const language = userId ? await this.getUserLanguage(userId) : "en";

            await emailService.sendTemplatedEmail(
                "password_reset",
                userEmail,
                {
                    userName,
                    resetUrl,
                    expirationTime: "30",
                    appName: "BeOut",
                    currentYear: new Date().getFullYear().toString(),
                },
                { language }
            );
        } catch (error) {
            console.error("Failed to send password reset email:", error);
            throw error;
        }
    }

    /**
     * Get user's preferred language
     */
    async getUserLanguage(userId) {
        if (!userId) return "en";

        const client = await pool.connect();
        try {
            const result = await client.query("SELECT preferred_language FROM user_profiles WHERE user_id = $1", [
                userId,
            ]);

            return result.rows[0]?.preferred_language || "en";
        } catch (error) {
            console.error("Failed to get user language:", error);
            return "en"; // Default fallback
        } finally {
            client.release();
        }
    }

    /**
     * Send event reminder email
     */
    async sendEventReminder(eventId, timeBeforeEvent = "24 hours") {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `
                SELECT
                    b.id,
                    u.email as user_email,
                    u.name as user_name,
                    e.title as event_title,
                    e.event_date,
                    e.event_time,
                    e.location,
                    format_address(e.address_id) as formatted_address
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                JOIN events e ON b.event_id = e.id
                WHERE e.id = $1 AND b.status = 'confirmed'
            `,
                [eventId]
            );

            for (const booking of result.rows) {
                try {
                    const eventDate = new Date(booking.event_date);
                    const formattedDate = eventDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    });

                    await emailService.sendTemplatedEmail("event_reminder", booking.user_email, {
                        userName: booking.user_name,
                        eventTitle: booking.event_title,
                        eventDate: formattedDate,
                        eventTime: booking.event_time,
                        eventLocation: booking.location || booking.formatted_address,
                        timeBeforeEvent,
                        appName: "BeOut",
                        currentYear: new Date().getFullYear().toString(),
                    });
                } catch (error) {
                    console.error(`Failed to send reminder to ${booking.user_email}:`, error);
                }
            }
        } catch (error) {
            console.error("Failed to send event reminders:", error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Send admin notification email
     */
    async sendAdminNotification(subject, message, data = {}) {
        const client = await pool.connect();
        try {
            // Get admin notification email from settings
            const settingResult = await client.query(
                "SELECT setting_value FROM email_settings WHERE setting_key = 'admin_notification_email'"
            );

            const adminEmail = settingResult.rows[0]?.setting_value || "admin@beout.app";

            const htmlMessage = `
                <h2>${subject}</h2>
                <p>${message}</p>
                ${
                    Object.keys(data).length > 0
                        ? `
                    <h3>Additional Information:</h3>
                    <ul>
                        ${Object.entries(data)
                            .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
                            .join("")}
                    </ul>
                `
                        : ""
                }
            `;

            await emailService.sendSimpleEmail(adminEmail, `[BeOut Admin] ${subject}`, htmlMessage);
        } catch (error) {
            console.error("Failed to send admin notification:", error);
            // Don't throw error - admin notification failure shouldn't block main operations
        } finally {
            client.release();
        }
    }
}

export default new EmailNotificationService();
