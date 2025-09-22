import emailService from "./emailService.js";
import pool from "../db.js";
import pdfTicketService from "./pdfTicketService.js";
import fs from 'fs/promises';

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
                    b.booking_reference,
                    b.total_price as total_amount,
                    b.quantity as ticket_count,
                    b.booking_date,
                    u.email as user_email,
                    CONCAT(COALESCE(up.first_name, ''), ' ', COALESCE(up.last_name, '')) as user_name,
                    u.id as user_id,
                    e.title as event_title,
                    e.event_date,
                    v.name as venue_name,
                    format_address(a.id) as formatted_address
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                JOIN events e ON b.event_id = e.id
                LEFT JOIN venues v ON e.venue_id = v.id
                LEFT JOIN address_relationships ar ON (ar.entity_type = 'venue' AND ar.entity_id = v.id)
                LEFT JOIN addresses a ON ar.address_id = a.id
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
            const formattedTime = eventDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
            });

            // Get user's preferred language
            const language = await this.getUserLanguage(booking.user_id);

            // Generate PDF tickets for this booking
            console.log(`Generating PDF tickets for booking ${bookingId}...`);
            let attachments = [];

            try {
                const pdfResults = await pdfTicketService.generateBookingTicketsPDFs(bookingId);

                // Create attachments array from successful PDF generations
                for (const pdfResult of pdfResults) {
                    if (pdfResult.success && pdfResult.pdfPath) {
                        try {
                            // Read the PDF file
                            const pdfBuffer = await fs.readFile(pdfResult.pdfPath);
                            const base64Content = pdfBuffer.toString('base64');

                            attachments.push({
                                content: base64Content,
                                filename: pdfResult.fileName,
                                type: 'application/pdf',
                                disposition: 'attachment'
                            });

                            console.log(`Added PDF attachment: ${pdfResult.fileName}`);
                        } catch (fileError) {
                            console.error(`Failed to read PDF file ${pdfResult.pdfPath}:`, fileError);
                        }
                    }
                }

                console.log(`Generated ${attachments.length} PDF ticket attachments`);
            } catch (pdfError) {
                console.error('Failed to generate PDF tickets:', pdfError);
                // Continue with email sending even if PDF generation fails
            }

            await emailService.sendTemplatedEmail(
                "booking_confirmation",
                booking.user_email,
                {
                    userName: booking.user_name.trim() || 'Customer',
                    bookingReference: booking.booking_reference,
                    eventTitle: booking.event_title,
                    eventDate: formattedDate,
                    eventTime: formattedTime,
                    eventLocation: booking.venue_name || booking.formatted_address || 'Venue TBA',
                    ticketCount: booking.ticket_count.toString(),
                    totalAmount: `€${booking.total_amount}`,
                    bookingUrl: `${process.env.CLIENT_URL}/bookings/${booking.id}`,
                    appName: "BeOut",
                    currentYear: new Date().getFullYear().toString(),
                },
                {
                    language,
                    attachments: attachments.length > 0 ? attachments : undefined
                }
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
                    CONCAT(COALESCE(up.first_name, ''), ' ', COALESCE(up.last_name, '')) as user_name,
                    e.title as event_title,
                    e.event_date,
                    v.name as venue_name,
                    format_address(a.id) as formatted_address
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                JOIN events e ON b.event_id = e.id
                LEFT JOIN venues v ON e.venue_id = v.id
                LEFT JOIN address_relationships ar ON (ar.entity_type = 'venue' AND ar.entity_id = v.id)
                LEFT JOIN addresses a ON ar.address_id = a.id
                WHERE e.id = $1 AND b.booking_status = 'confirmed'
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
                    const formattedTime = eventDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                    });

                    await emailService.sendTemplatedEmail("event_reminder", booking.user_email, {
                        userName: booking.user_name.trim() || 'Customer',
                        eventTitle: booking.event_title,
                        eventDate: formattedDate,
                        eventTime: formattedTime,
                        eventLocation: booking.venue_name || booking.formatted_address || 'Venue TBA',
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
