import { Router } from "express";
import StripeService from "../services/stripeService.js";
import pool from "../db.js";
import authenticateToken from "../middleware/authenticateToken.js";
import emailNotificationService from "../services/emailNotificationService.js";

const router = Router();

/**
 * Create payment intent for booking
 */
router.post("/create-payment-intent", async (req, res) => {
    try {
        const { booking_id, amount, event_title, customer_email } = req.body;

        // Validate required fields
        if (!booking_id || !amount) {
            return res.status(400).json({
                error: "Missing required fields: booking_id, amount",
            });
        }

        // Verify booking exists and is in pending status
        const client = await pool.connect();
        try {
            const bookingQuery = `
                SELECT b.*, e.title as event_title
                FROM bookings b
                LEFT JOIN events e ON b.event_id = e.id
                WHERE b.id = $1 AND b.booking_status = 'pending'
            `;
            const bookingResult = await client.query(bookingQuery, [booking_id]);

            if (bookingResult.rows.length === 0) {
                return res.status(404).json({
                    error: "Booking not found or not in pending status",
                });
            }

            const booking = bookingResult.rows[0];

            // Create payment intent
            const paymentIntent = await StripeService.createPaymentIntent({
                amount: parseFloat(amount),
                currency: "eur",
                metadata: {
                    booking_id: booking_id.toString(),
                    event_title: booking.event_title || event_title,
                    customer_email: booking.customer_email || customer_email,
                },
            });

            // Update booking with payment intent ID
            await client.query(`UPDATE bookings SET stripe_payment_intent_id = $1 WHERE id = $2`, [
                paymentIntent.id,
                booking_id,
            ]);

            res.json({
                client_secret: paymentIntent.client_secret,
                payment_intent_id: paymentIntent.id,
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Confirm payment after successful client-side handling
 */
router.post("/confirm-payment", async (req, res) => {
    try {
        const { payment_intent_id, booking_id } = req.body;

        if (!payment_intent_id || !booking_id) {
            return res.status(400).json({
                error: "Missing required fields: payment_intent_id, booking_id",
            });
        }

        // Get payment intent from Stripe
        const paymentIntent = await StripeService.getPaymentIntent(payment_intent_id);

        if (paymentIntent.status === "succeeded") {
            const client = await pool.connect();
            try {
                await client.query("BEGIN");

                // Update booking status
                const updateQuery = `
                    UPDATE bookings
                    SET booking_status = 'confirmed',
                        payment_status = 'paid',
                        payment_method = 'stripe',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1 AND stripe_payment_intent_id = $2
                    RETURNING *
                `;

                const result = await client.query(updateQuery, [booking_id, payment_intent_id]);

                if (result.rows.length === 0) {
                    await client.query("ROLLBACK");
                    return res.status(404).json({
                        error: "Booking not found or payment intent mismatch",
                    });
                }

                // Update booking tickets status
                await client.query(`UPDATE booking_tickets SET ticket_status = 'active' WHERE booking_id = $1`, [
                    booking_id,
                ]);

                // Update event available tickets
                await client.query(
                    `UPDATE events SET available_tickets = available_tickets - $1
                     WHERE id = (SELECT event_id FROM bookings WHERE id = $2)`,
                    [result.rows[0].quantity, booking_id]
                );

                await client.query("COMMIT");

                // Send booking confirmation email with PDF tickets after successful payment
                try {
                    await emailNotificationService.sendBookingConfirmation(booking_id);
                    console.log(`Booking confirmation email sent for booking ${booking_id}`);
                } catch (emailError) {
                    console.error(`Failed to send booking confirmation email for booking ${booking_id}:`, emailError);
                    // Don't fail the payment if email fails
                }

                res.json({
                    success: true,
                    booking: result.rows[0],
                    payment_status: paymentIntent.status,
                });
            } finally {
                client.release();
            }
        } else {
            res.status(400).json({
                error: "Payment not yet succeeded",
                payment_status: paymentIntent.status,
            });
        }
    } catch (error) {
        console.error("Error confirming payment:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create refund for cancelled booking
 */
router.post("/refund", async (req, res) => {
    try {
        const { booking_id, amount, reason = "requested_by_customer" } = req.body;

        if (!booking_id) {
            return res.status(400).json({
                error: "Missing required field: booking_id",
            });
        }

        const client = await pool.connect();
        try {
            // Get booking details
            const bookingQuery = `
                SELECT * FROM bookings
                WHERE id = $1 AND payment_status = 'paid'
                AND stripe_payment_intent_id IS NOT NULL
            `;
            const bookingResult = await client.query(bookingQuery, [booking_id]);

            if (bookingResult.rows.length === 0) {
                return res.status(404).json({
                    error: "Booking not found or not eligible for refund",
                });
            }

            const booking = bookingResult.rows[0];

            // Create refund
            const refund = await StripeService.createRefund(
                booking.stripe_payment_intent_id,
                amount ? parseFloat(amount) : null,
                reason
            );

            // Update booking status
            await client.query(
                `UPDATE bookings
                 SET booking_status = 'refunded',
                     payment_status = 'refunded',
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [booking_id]
            );

            // Update tickets status
            await client.query(`UPDATE booking_tickets SET ticket_status = 'refunded' WHERE booking_id = $1`, [
                booking_id,
            ]);

            // Restore event tickets
            await client.query(
                `UPDATE events SET available_tickets = available_tickets + $1
                 WHERE id = $2`,
                [booking.quantity, booking.event_id]
            );

            res.json({
                success: true,
                refund_id: refund.id,
                amount_refunded: refund.amount / 100,
                status: refund.status,
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error processing refund:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get payment details for booking
 */
router.get("/booking/:booking_id/payment", async (req, res) => {
    try {
        const { booking_id } = req.params;

        const client = await pool.connect();
        try {
            const query = `
                SELECT
                    b.id,
                    b.booking_reference,
                    b.total_price,
                    b.payment_status,
                    b.payment_method,
                    b.stripe_payment_intent_id,
                    pt.amount as transaction_amount,
                    pt.currency,
                    pt.status as transaction_status,
                    pt.payment_method_type,
                    pt.created_at as transaction_date
                FROM bookings b
                LEFT JOIN payment_transactions pt ON b.id = pt.booking_id
                WHERE b.id = $1
                ORDER BY pt.created_at DESC
            `;

            const result = await client.query(query, [booking_id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Booking not found" });
            }

            res.json({
                booking_payment: result.rows[0],
                transactions: result.rows.filter((row) => row.transaction_amount !== null),
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching payment details:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get payment statistics (for admin dashboard)
 */
router.get("/stats", async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        const client = await pool.connect();
        try {
            let dateFilter = "";
            const queryParams = [];

            if (start_date && end_date) {
                dateFilter = "WHERE pt.created_at BETWEEN $1 AND $2";
                queryParams.push(start_date, end_date);
            }

            const query = `
                SELECT
                    COUNT(pt.id) as total_transactions,
                    SUM(CASE WHEN pt.status = 'succeeded' THEN pt.amount ELSE 0 END) as total_revenue,
                    SUM(CASE WHEN pt.status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
                    SUM(CASE WHEN pt.status = 'succeeded' THEN 1 ELSE 0 END) as successful_payments,
                    AVG(CASE WHEN pt.status = 'succeeded' THEN pt.amount END) as average_transaction_value,
                    COUNT(DISTINCT pt.booking_id) as unique_bookings
                FROM payment_transactions pt
                ${dateFilter}
            `;

            const result = await client.query(query, queryParams);

            res.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching payment statistics:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get recent transactions (for admin monitoring)
 */
router.get("/transactions", async (req, res) => {
    try {
        const { page = 1, limit = 20, status, payment_method_type } = req.query;
        const offset = (page - 1) * limit;

        const client = await pool.connect();
        try {
            let whereConditions = [];
            let queryParams = [];
            let paramIndex = 1;

            if (status) {
                whereConditions.push(`pt.status = $${paramIndex}`);
                queryParams.push(status);
                paramIndex++;
            }

            if (payment_method_type) {
                whereConditions.push(`pt.payment_method_type = $${paramIndex}`);
                queryParams.push(payment_method_type);
                paramIndex++;
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

            const query = `
                SELECT
                    pt.*,
                    b.booking_reference,
                    b.customer_name,
                    b.customer_email,
                    e.title as event_title
                FROM payment_transactions pt
                LEFT JOIN bookings b ON pt.booking_id = b.id
                LEFT JOIN events e ON b.event_id = e.id
                ${whereClause}
                ORDER BY pt.created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            queryParams.push(parseInt(limit), offset);
            const result = await client.query(query, queryParams);

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM payment_transactions pt
                ${whereClause}
            `;
            const countResult = await client.query(countQuery, queryParams.slice(0, -2));

            res.json({
                transactions: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].total),
                    pages: Math.ceil(countResult.rows[0].total / limit),
                },
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: error.message });
    }
});

// Admin endpoints for payment monitoring
/**
 * Get payment statistics for admin dashboard
 */
router.get("/admin/stats", authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date, period = "30d" } = req.query;

        const client = await pool.connect();
        try {
            let dateFilter = "";
            const queryParams = [];

            if (start_date && end_date) {
                dateFilter = "WHERE pt.created_at BETWEEN $1 AND $2";
                queryParams.push(start_date, end_date);
            } else {
                // Default to last 30 days
                const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
                dateFilter = `WHERE pt.created_at >= NOW() - INTERVAL '${days} days'`;
                // Don't push days to queryParams since it's now part of the string
            }

            const statsQuery = `
                SELECT
                    COUNT(pt.id) as total_transactions,
                    COALESCE(SUM(CASE WHEN pt.status = 'succeeded' THEN pt.amount ELSE 0 END), 0) as total_revenue,
                    COUNT(CASE WHEN pt.status = 'failed' THEN 1 END) as failed_payments,
                    COUNT(CASE WHEN pt.status = 'succeeded' THEN 1 END) as successful_payments,
                    COUNT(CASE WHEN pt.status = 'pending' THEN 1 END) as pending_payments,
                    COALESCE(AVG(CASE WHEN pt.status = 'succeeded' THEN pt.amount END), 0) as average_transaction_value,
                    COUNT(DISTINCT pt.booking_id) as unique_bookings,
                    COUNT(CASE WHEN pt.status = 'requires_action' THEN 1 END) as requires_action
                FROM payment_transactions pt
                ${dateFilter}
            `;

            const result = await client.query(statsQuery, start_date && end_date ? queryParams : []);
            const stats = result.rows[0];

            // Get refund statistics (placeholder - no refunds table exists yet)
            const refundStats = {
                total_refunds: 0,
                total_refunded: 0,
            };

            // Get dispute statistics
            const disputeQuery = `
                SELECT
                    COUNT(*) as total_disputes,
                    COUNT(CASE WHEN status = 'needs_response' THEN 1 END) as pending_disputes
                FROM payment_disputes d
                ${dateFilter.replace("pt.", "d.")}
            `;
            const disputeParams = start_date && end_date ? queryParams : [];
            const disputeResult = await client.query(disputeQuery, disputeParams);
            const disputeStats = disputeResult.rows[0];

            res.json({
                ...stats,
                ...refundStats,
                ...disputeStats,
                success_rate:
                    stats.total_transactions > 0
                        ? ((stats.successful_payments / stats.total_transactions) * 100).toFixed(2)
                        : 0,
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching admin payment statistics:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get payment transactions for admin monitoring
 */
router.get("/admin/transactions", authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, payment_method_type, search, start_date, end_date } = req.query;

        const offset = (page - 1) * limit;

        const client = await pool.connect();
        try {
            let whereConditions = [];
            let queryParams = [];
            let paramIndex = 1;

            if (status && status !== "all") {
                whereConditions.push(`pt.status = $${paramIndex}`);
                queryParams.push(status);
                paramIndex++;
            }

            if (payment_method_type) {
                whereConditions.push(`pt.payment_method_type = $${paramIndex}`);
                queryParams.push(payment_method_type);
                paramIndex++;
            }

            if (search) {
                whereConditions.push(`(
                    pt.stripe_payment_id ILIKE $${paramIndex} OR
                    b.customer_email ILIKE $${paramIndex} OR
                    e.title ILIKE $${paramIndex} OR
                    b.booking_reference ILIKE $${paramIndex}
                )`);
                queryParams.push(`%${search}%`);
                paramIndex++;
            }

            if (start_date && end_date) {
                whereConditions.push(`pt.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
                queryParams.push(start_date, end_date);
                paramIndex += 2;
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

            const query = `
                SELECT
                    pt.*,
                    b.booking_reference,
                    b.customer_name,
                    b.customer_email,
                    e.title as event_title,
                    e.id as event_id
                FROM payment_transactions pt
                LEFT JOIN bookings b ON pt.booking_id = b.id
                LEFT JOIN events e ON b.event_id = e.id
                ${whereClause}
                ORDER BY pt.created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            queryParams.push(parseInt(limit), offset);
            const result = await client.query(query, queryParams);

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM payment_transactions pt
                LEFT JOIN bookings b ON pt.booking_id = b.id
                LEFT JOIN events e ON b.event_id = e.id
                ${whereClause}
            `;
            const countResult = await client.query(countQuery, queryParams.slice(0, -2));

            res.json({
                payments: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].total),
                    pages: Math.ceil(countResult.rows[0].total / limit),
                },
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching admin payment transactions:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get revenue analytics for admin dashboard
 */
router.get("/admin/revenue", authenticateToken, async (req, res) => {
    try {
        const { period = "30d", group_by = "day" } = req.query;

        const client = await pool.connect();
        try {
            const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
            const groupFormat = group_by === "month" ? "YYYY-MM" : "YYYY-MM-DD";

            const query = `
                SELECT
                    TO_CHAR(pt.created_at, '${groupFormat}') as period,
                    COUNT(*) as transactions,
                    COALESCE(SUM(CASE WHEN pt.status = 'succeeded' THEN pt.amount ELSE 0 END), 0) as revenue,
                    COUNT(CASE WHEN pt.status = 'succeeded' THEN 1 END) as successful_transactions
                FROM payment_transactions pt
                WHERE pt.created_at >= NOW() - INTERVAL '${days} days'
                GROUP BY TO_CHAR(pt.created_at, '${groupFormat}')
                ORDER BY period ASC
            `;

            const result = await client.query(query);

            res.json({
                analytics: result.rows,
                period,
                group_by,
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching revenue analytics:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Process refund (admin action)
 */
router.post("/admin/refund", authenticateToken, async (req, res) => {
    try {
        const { payment_id, amount, reason } = req.body;

        if (!payment_id || !amount) {
            return res.status(400).json({
                error: "Missing required fields: payment_id, amount",
            });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Get payment transaction
            const paymentQuery = `
                SELECT * FROM payment_transactions
                WHERE stripe_payment_id = $1 AND status = 'succeeded'
            `;
            const paymentResult = await client.query(paymentQuery, [payment_id]);

            if (paymentResult.rows.length === 0) {
                throw new Error("Payment not found or not eligible for refund");
            }

            const payment = paymentResult.rows[0];

            // Process refund through Stripe
            const refund = await StripeService.createRefund(payment_id, amount, reason);

            // Record refund in database
            const refundQuery = `
                INSERT INTO refunds (
                    payment_transaction_id, stripe_refund_id, amount, reason,
                    status, created_at
                ) VALUES ($1, $2, $3, $4, $5, NOW())
                RETURNING *
            `;
            const refundResult = await client.query(refundQuery, [
                payment.id,
                refund.id,
                amount,
                reason,
                refund.status,
            ]);

            await client.query("COMMIT");

            res.json({
                success: true,
                refund: refundResult.rows[0],
                stripe_refund: refund,
            });
        } catch (dbError) {
            await client.query("ROLLBACK");
            throw dbError;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error processing refund:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get disputes for admin monitoring
 */
router.get("/admin/disputes", authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        const client = await pool.connect();
        try {
            let whereConditions = [];
            let queryParams = [];
            let paramIndex = 1;

            if (status && status !== "all") {
                whereConditions.push(`d.status = $${paramIndex}`);
                queryParams.push(status);
                paramIndex++;
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

            const query = `
                SELECT
                    d.*,
                    pt.stripe_payment_id,
                    b.customer_email,
                    e.title as event_title
                FROM disputes d
                LEFT JOIN payment_transactions pt ON d.payment_transaction_id = pt.id
                LEFT JOIN bookings b ON pt.booking_id = b.id
                LEFT JOIN events e ON b.event_id = e.id
                ${whereClause}
                ORDER BY d.created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            queryParams.push(parseInt(limit), offset);
            const result = await client.query(query, queryParams);

            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM disputes d ${whereClause}`;
            const countResult = await client.query(countQuery, queryParams.slice(0, -2));

            res.json({
                disputes: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].total),
                    pages: Math.ceil(countResult.rows[0].total / limit),
                },
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching disputes:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
