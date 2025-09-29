import { Router } from "express";
import pool from "../db.js";
import crypto from "crypto";
import emailNotificationService from "../services/emailNotificationService.js";
import {
    getAvailablePricingOptions,
    findPricingOption,
    validatePricingSelection,
    calculateBookingPrice,
    generateTierAwareQRContent,
    generateTierAwareTicketNumber,
    calculateTotalAvailableTickets
} from "../utils/pricingUtils.js";

/**
 * Generate a deterministic UUID from a string ID
 * This ensures consistent UUID generation for the same string input
 */
const stringToUUID = (str) => {
    if (!str) return null;

    // If it's already a UUID, return as-is
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(str)) {
        return str;
    }

    // Generate deterministic UUID from string using SHA-256 hash
    const hash = crypto.createHash('sha256').update(str).digest('hex');

    // Format as UUID v4
    return [
        hash.substr(0, 8),
        hash.substr(8, 4),
        '4' + hash.substr(13, 3), // Version 4
        ((parseInt(hash.substr(16, 1), 16) & 0x3) | 0x8).toString(16) + hash.substr(17, 3), // Variant bits
        hash.substr(20, 12)
    ].join('-');
};

const router = Router();

// Create a new booking
router.post("/", async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const {
            event_id,
            quantity,
            customer_name,
            customer_email,
            customer_phone,
            special_requests,
            user_id = null, // Optional for authenticated users
            pricing_category_id = null, // New: Selected pricing category
            pricing_tier_id = null, // New: Selected pricing tier
        } = req.body;

        // Validate required fields
        if (!event_id || !quantity || !customer_name || !customer_email) {
            return res.status(400).json({
                error: "Missing required fields: event_id, quantity, customer_name, customer_email",
            });
        }

        // Get event details and check availability
        const eventQuery = `
            SELECT
                id, title, discounted_price, available_tickets,
                booking_deadline, event_date, status, pricing
            FROM events
            WHERE id = $1 AND status = 'active'
        `;
        const eventResult = await client.query(eventQuery, [event_id]);

        if (eventResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Event not found or inactive" });
        }

        const event = eventResult.rows[0];

        // Check if booking deadline has passed
        if (event.booking_deadline && new Date() > new Date(event.booking_deadline)) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Booking deadline has passed" });
        }

        // Check if event date has passed
        if (new Date() > new Date(event.event_date)) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Event has already occurred" });
        }

        // Handle pricing tier selection and validation
        let pricingOption = null;
        let pricingValidation = null;

        if (pricing_category_id && pricing_tier_id) {
            // New multi-tier pricing system
            pricingValidation = validatePricingSelection(event, pricing_category_id, pricing_tier_id, quantity);

            if (!pricingValidation.success) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                    error: pricingValidation.error,
                    code: pricingValidation.code
                });
            }

            pricingOption = pricingValidation.option;
        } else {
            // Legacy single pricing or default to first available option
            const availableOptions = getAvailablePricingOptions(event);

            if (availableOptions.length === 0) {
                await client.query("ROLLBACK");
                return res.status(400).json({ error: "No pricing options available for this event" });
            }

            pricingOption = availableOptions[0]; // Use first available option as default

            // Validate availability for legacy system
            if (event.available_tickets < quantity) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                    error: `Only ${event.available_tickets} tickets available`,
                });
            }
        }

        // Check for existing bookings to prevent accidental duplicates
        const existingBookingsQuery = `
            SELECT COUNT(*) as booking_count,
                   SUM(quantity) as total_tickets,
                   MAX(booking_date) as latest_booking
            FROM bookings
            WHERE event_id = $1
            AND customer_email = $2
            AND booking_status IN ('pending', 'confirmed')
        `;
        const existingBookingsResult = await client.query(existingBookingsQuery, [event_id, customer_email]);
        const existingBookings = existingBookingsResult.rows[0];

        // If user has existing bookings for this event, return warning but allow booking
        let warnings = [];
        if (existingBookings.booking_count > 0) {
            warnings.push({
                type: 'duplicate_booking',
                message: `You already have ${existingBookings.booking_count} booking(s) for this event with ${existingBookings.total_tickets} ticket(s). Latest booking: ${new Date(existingBookings.latest_booking).toLocaleDateString()}`,
                existing_bookings: parseInt(existingBookings.booking_count),
                existing_tickets: parseInt(existingBookings.total_tickets)
            });
        }

        // Calculate pricing based on selected tier
        const priceCalculation = calculateBookingPrice(pricingOption, quantity);

        // Set reservation expiry (15 minutes from now)
        const reservationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Create booking with pricing tier information and reservation expiry
        const bookingQuery = `
            INSERT INTO bookings (
                user_id, event_id, quantity, unit_price, total_price,
                customer_name, customer_email, customer_phone, special_requests,
                pricing_category_id, pricing_tier_id, pricing_category_name, pricing_tier_name,
                booking_status, payment_status, reservation_expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending', 'pending', $14)
            RETURNING *
        `;

        const bookingResult = await client.query(bookingQuery, [
            user_id,
            event_id,
            quantity,
            priceCalculation.unit_price,
            priceCalculation.total_price,
            customer_name,
            customer_email,
            customer_phone,
            special_requests,
            stringToUUID(pricingOption.category_id), // Convert string ID to deterministic UUID
            pricingOption.tier_id, // tier_id is varchar, can stay as string
            pricingOption.category_name,
            pricingOption.tier_name,
            reservationExpiry
        ]);

        const booking = bookingResult.rows[0];

        // NOTE: Available tickets are NOT decremented here during booking creation
        // Tickets will be decremented only after successful payment confirmation
        // This prevents inventory loss from abandoned/failed payments

        // Generate individual tickets with pricing tier information
        const tickets = [];
        const baseTimestamp = Date.now();

        for (let i = 0; i < quantity; i++) {
            // Generate tier-aware ticket number
            const ticket_number = generateTierAwareTicketNumber(
                booking.booking_reference,
                i,
                pricingOption
            );

            // Create temporary ticket data for QR generation
            const tempTicketData = {
                ticket_number,
                holder_name: customer_name,
                qr_code: crypto
                    .createHash("sha256")
                    .update(`${booking.id}-${ticket_number}-${baseTimestamp}-${i}`)
                    .digest("hex")
            };

            // Generate QR code content with tier information
            const qrContent = generateTierAwareQRContent(booking, tempTicketData);

            const ticketQuery = `
                INSERT INTO booking_tickets (
                    booking_id, ticket_number, qr_code, holder_name, holder_email,
                    pricing_category_name, pricing_tier_name, tier_price
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const ticketResult = await client.query(ticketQuery, [
                booking.id,
                ticket_number,
                tempTicketData.qr_code,
                customer_name,
                customer_email,
                pricingOption.category_name,
                pricingOption.tier_name,
                pricingOption.price,
            ]);

            tickets.push(ticketResult.rows[0]);
        }

        await client.query("COMMIT");

        // Note: Booking confirmation email with PDF tickets is sent after payment confirmation
        // in payments.js route, not here during initial booking creation

        res.status(201).json({
            booking,
            tickets,
            event: {
                title: event.title,
                event_date: event.event_date,
            },
            warnings: warnings.length > 0 ? warnings : undefined,
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error creating booking:", err);
        res.status(500).json({ error: "Failed to create booking" });
    } finally {
        client.release();
    }
});

// Get booking by reference
router.get("/reference/:reference", async (req, res) => {
    const client = await pool.connect();
    try {
        const { reference } = req.params;

        const query = `
            SELECT
                b.*,
                e.title as event_title,
                e.description as event_description,
                e.event_date,
                e.image_url as event_image,
                v.name as venue_name,
                v.address as venue_address,
                v.city as venue_city,
                COUNT(bt.id) as ticket_count
            FROM bookings b
            LEFT JOIN events e ON b.event_id = e.id
            LEFT JOIN venues v ON e.venue_id = v.id
            LEFT JOIN booking_tickets bt ON b.id = bt.booking_id
            WHERE b.booking_reference = $1
            GROUP BY b.id, e.id, v.id
        `;

        const result = await client.query(query, [reference]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Booking not found" });
        }

        // Get tickets for this booking
        const ticketsQuery = `
            SELECT * FROM booking_tickets
            WHERE booking_id = $1
            ORDER BY ticket_number
        `;
        const ticketsResult = await client.query(ticketsQuery, [result.rows[0].id]);

        res.json({
            booking: result.rows[0],
            tickets: ticketsResult.rows,
        });
    } catch (err) {
        console.error("Error fetching booking:", err);
        res.status(500).json({ error: "Failed to fetch booking" });
    } finally {
        client.release();
    }
});

// Get user's bookings
router.get("/user/:userId", async (req, res) => {
    const client = await pool.connect();
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = "WHERE b.user_id = $1";
        let queryParams = [userId];
        let paramIndex = 2;

        if (status) {
            whereClause += ` AND b.booking_status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }

        const query = `
            SELECT
                b.*,
                e.title as event_title,
                e.event_date,
                e.image_url as event_image,
                v.name as venue_name,
                a.locality as venue_city,
                COUNT(bt.id) as ticket_count
            FROM bookings b
            LEFT JOIN events e ON b.event_id = e.id
            LEFT JOIN venues v ON e.venue_id = v.id
            LEFT JOIN address_relationships ar ON ar.entity_type = 'venue' AND ar.entity_id = v.id
            LEFT JOIN addresses a ON ar.address_id = a.id
            LEFT JOIN booking_tickets bt ON b.id = bt.booking_id
            ${whereClause}
            GROUP BY b.id, e.id, v.id, a.id
            ORDER BY b.booking_date DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(parseInt(limit), offset);
        const result = await client.query(query, queryParams);

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM bookings b
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
        console.error("Error fetching user bookings:", err);
        res.status(500).json({ error: "Failed to fetch bookings" });
    } finally {
        client.release();
    }
});

// Confirm booking (simulate payment success)
router.patch("/:id/confirm", async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { id } = req.params;
        const { payment_method = "card", transaction_id } = req.body;

        // Update booking status
        const query = `
            UPDATE bookings
            SET booking_status = 'confirmed',
                payment_status = 'paid',
                payment_method = $1,
                transaction_id = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3 AND booking_status = 'pending'
            RETURNING *
        `;

        const result = await client.query(query, [payment_method, transaction_id, id]);

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Booking not found or already confirmed" });
        }

        await client.query("COMMIT");

        // Send booking confirmation email with PDF tickets after successful confirmation
        try {
            await emailNotificationService.sendBookingConfirmation(id);
            console.log(`Booking confirmation email sent for booking ${id}`);
        } catch (emailError) {
            console.error(`Failed to send booking confirmation email for booking ${id}:`, emailError);
            // Don't fail the booking confirmation if email fails
        }

        res.json({ booking: result.rows[0] });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error confirming booking:", err);
        res.status(500).json({ error: "Failed to confirm booking" });
    } finally {
        client.release();
    }
});

// Cancel booking
router.patch("/:id/cancel", async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { id } = req.params;
        const { cancellation_reason = "User requested cancellation" } = req.body;

        // Update booking status
        const query = `
            UPDATE bookings
            SET booking_status = 'cancelled',
                cancelled_at = CURRENT_TIMESTAMP,
                cancellation_reason = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND booking_status IN ('pending', 'confirmed')
            RETURNING *
        `;

        const result = await client.query(query, [cancellation_reason, id]);

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Booking not found or cannot be cancelled" });
        }

        // Cancel all tickets for this booking
        await client.query(
            `
            UPDATE booking_tickets
            SET ticket_status = 'cancelled'
            WHERE booking_id = $1
        `,
            [id]
        );

        await client.query("COMMIT");
        res.json({ booking: result.rows[0] });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error cancelling booking:", err);
        res.status(500).json({ error: "Failed to cancel booking" });
    } finally {
        client.release();
    }
});

// Get booking statistics
router.get("/stats/overview", async (req, res) => {
    const client = await pool.connect();
    try {
        const query = `
            SELECT
                COUNT(*) as total_bookings,
                COUNT(*) FILTER (WHERE booking_status = 'confirmed') as confirmed_bookings,
                COUNT(*) FILTER (WHERE booking_status = 'pending') as pending_bookings,
                COUNT(*) FILTER (WHERE booking_status = 'cancelled') as cancelled_bookings,
                SUM(total_price) FILTER (WHERE booking_status = 'confirmed') as total_revenue,
                SUM(quantity) FILTER (WHERE booking_status = 'confirmed') as total_tickets_sold,
                AVG(total_price) FILTER (WHERE booking_status = 'confirmed') as avg_booking_value
            FROM bookings
            WHERE booking_date >= CURRENT_DATE - INTERVAL '30 days'
        `;

        const result = await client.query(query);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching booking stats:", err);
        res.status(500).json({ error: "Failed to fetch booking statistics" });
    } finally {
        client.release();
    }
});

// Resend booking confirmation email with tickets
router.post("/:id/resend-tickets", async (req, res) => {
    try {
        const { id } = req.params;

        // Verify booking exists and belongs to authenticated user
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT id, user_id FROM bookings WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Booking not found" });
            }

            const booking = result.rows[0];

            // Check if user has permission to resend tickets for this booking
            if (req.user && booking.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: "Not authorized to resend tickets for this booking" });
            }

            // Send booking confirmation email with fresh PDF tickets
            await emailNotificationService.sendBookingConfirmation(id);

            res.json({
                success: true,
                message: "Tickets resent successfully"
            });

        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error resending tickets:", err);
        res.status(500).json({ error: "Failed to resend tickets: " + err.message });
    }
});

// Clean up expired reservations (pending bookings past expiry time)
router.post("/cleanup-expired-reservations", async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Find expired reservations
        const expiredQuery = `
            SELECT id, event_id, quantity, pricing_category_id, pricing_tier_id
            FROM bookings
            WHERE booking_status = 'pending'
            AND reservation_expires_at IS NOT NULL
            AND reservation_expires_at <= NOW()
        `;

        const expiredResult = await client.query(expiredQuery);
        const expiredBookings = expiredResult.rows;

        if (expiredBookings.length > 0) {
            console.log(`🧹 Cleaning up ${expiredBookings.length} expired reservations`);

            // Delete expired booking tickets first
            const bookingIds = expiredBookings.map(b => b.id);
            await client.query(
                `DELETE FROM booking_tickets WHERE booking_id = ANY($1)`,
                [bookingIds]
            );

            // Delete expired bookings
            await client.query(
                `DELETE FROM bookings WHERE booking_status = 'pending' AND reservation_expires_at <= NOW()`
            );

            console.log(`✅ Cleaned up ${expiredBookings.length} expired reservations`);
        }

        await client.query("COMMIT");

        res.json({
            success: true,
            cleaned_count: expiredBookings.length,
            message: `Cleaned up ${expiredBookings.length} expired reservations`
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error cleaning up expired reservations:", error);
        res.status(500).json({ error: "Failed to cleanup expired reservations" });
    } finally {
        client.release();
    }
});

export default router;
