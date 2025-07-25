import { Router } from "express";
import pool from "../db.js";
import crypto from "crypto";
import emailNotificationService from "../services/emailNotificationService.js";

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
                booking_deadline, event_date, status
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

        // Check ticket availability
        if (event.available_tickets < quantity) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                error: `Only ${event.available_tickets} tickets available`,
            });
        }

        const unit_price = parseFloat(event.discounted_price);
        const total_price = unit_price * quantity;

        // Create booking
        const bookingQuery = `
            INSERT INTO bookings (
                user_id, event_id, quantity, unit_price, total_price,
                customer_name, customer_email, customer_phone, special_requests,
                booking_status, payment_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'pending')
            RETURNING *
        `;

        const bookingResult = await client.query(bookingQuery, [
            user_id,
            event_id,
            quantity,
            unit_price,
            total_price,
            customer_name,
            customer_email,
            customer_phone,
            special_requests,
        ]);

        const booking = bookingResult.rows[0];

        // Generate individual tickets
        const tickets = [];
        for (let i = 0; i < quantity; i++) {
            const ticket_number = `${booking.booking_reference}-${String(i + 1).padStart(3, "0")}`;
            const qr_code = crypto
                .createHash("sha256")
                .update(`${booking.id}-${ticket_number}-${Date.now()}`)
                .digest("hex");

            const ticketQuery = `
                INSERT INTO booking_tickets (
                    booking_id, ticket_number, qr_code, holder_name, holder_email
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;

            const ticketResult = await client.query(ticketQuery, [
                booking.id,
                ticket_number,
                qr_code,
                customer_name,
                customer_email,
            ]);

            tickets.push(ticketResult.rows[0]);
        }

        await client.query("COMMIT");

        // Send booking confirmation email
        try {
            await emailNotificationService.sendBookingConfirmation(booking.id);
        } catch (error) {
            console.error("Failed to send booking confirmation email:", error);
            // Don't fail the booking if email fails
        }

        res.status(201).json({
            booking,
            tickets,
            event: {
                title: event.title,
                event_date: event.event_date,
            },
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
                v.city as venue_city,
                COUNT(bt.id) as ticket_count
            FROM bookings b
            LEFT JOIN events e ON b.event_id = e.id
            LEFT JOIN venues v ON e.venue_id = v.id
            LEFT JOIN booking_tickets bt ON b.id = bt.booking_id
            ${whereClause}
            GROUP BY b.id, e.id, v.id
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

export default router;
