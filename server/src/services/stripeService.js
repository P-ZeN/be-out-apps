import Stripe from "stripe";
import pool from "../db.js";

// Initialize Stripe only if the secret key is provided
const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

// Log warning if Stripe is not configured
if (!stripe) {
    console.warn("⚠️  STRIPE_SECRET_KEY not configured - payment features will be disabled");
}

class StripeService {
    /**
     * Create a payment intent for booking
     */
    static async createPaymentIntent(bookingData) {
        if (!stripe) {
            throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.");
        }
        
        try {
            const { amount, currency = "eur", metadata = {} } = bookingData;

            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency,
                metadata: {
                    ...metadata,
                    platform: "be-out",
                },
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            return paymentIntent;
        } catch (error) {
            console.error("Error creating payment intent:", error);
            throw new Error(`Payment intent creation failed: ${error.message}`);
        }
    }

    /**
     * Confirm payment intent
     */
    static async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
        try {
            const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
                payment_method: paymentMethodId,
            });

            return paymentIntent;
        } catch (error) {
            console.error("Error confirming payment intent:", error);
            throw new Error(`Payment confirmation failed: ${error.message}`);
        }
    }

    /**
     * Create a refund
     */
    static async createRefund(paymentIntentId, amount = null, reason = "requested_by_customer") {
        try {
            const refundData = {
                payment_intent: paymentIntentId,
                reason,
            };

            if (amount) {
                refundData.amount = Math.round(amount * 100); // Convert to cents
            }

            const refund = await stripe.refunds.create(refundData);
            return refund;
        } catch (error) {
            console.error("Error creating refund:", error);
            throw new Error(`Refund creation failed: ${error.message}`);
        }
    }

    /**
     * Get payment intent by ID
     */
    static async getPaymentIntent(paymentIntentId) {
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            return paymentIntent;
        } catch (error) {
            console.error("Error retrieving payment intent:", error);
            throw new Error(`Payment intent retrieval failed: ${error.message}`);
        }
    }

    /**
     * Create connected account for organizers (for future use)
     */
    static async createConnectedAccount(organizerData) {
        try {
            const { email, country = "FR", business_type = "individual" } = organizerData;

            const account = await stripe.accounts.create({
                type: "express",
                country,
                email,
                business_type,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });

            return account;
        } catch (error) {
            console.error("Error creating connected account:", error);
            throw new Error(`Connected account creation failed: ${error.message}`);
        }
    }

    /**
     * Create account link for organizer onboarding
     */
    static async createAccountLink(accountId, refreshUrl, returnUrl) {
        try {
            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: refreshUrl,
                return_url: returnUrl,
                type: "account_onboarding",
            });

            return accountLink;
        } catch (error) {
            console.error("Error creating account link:", error);
            throw new Error(`Account link creation failed: ${error.message}`);
        }
    }

    /**
     * Create transfer to organizer (for revenue sharing)
     */
    static async createTransfer(amount, connectedAccountId, metadata = {}) {
        try {
            const transfer = await stripe.transfers.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: "eur",
                destination: connectedAccountId,
                metadata: {
                    ...metadata,
                    platform: "be-out",
                },
            });

            return transfer;
        } catch (error) {
            console.error("Error creating transfer:", error);
            throw new Error(`Transfer creation failed: ${error.message}`);
        }
    }

    /**
     * Log payment transaction in database
     */
    static async logTransaction(transactionData) {
        const client = await pool.connect();
        try {
            const {
                booking_id,
                stripe_payment_intent_id,
                amount,
                currency,
                status,
                payment_method_type,
                metadata = {},
            } = transactionData;

            const query = `
                INSERT INTO payment_transactions (
                    booking_id, stripe_payment_intent_id, amount, currency,
                    status, payment_method_type, metadata, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                RETURNING *
            `;

            const result = await client.query(query, [
                booking_id,
                stripe_payment_intent_id,
                amount,
                currency,
                status,
                payment_method_type,
                JSON.stringify(metadata),
            ]);

            return result.rows[0];
        } catch (error) {
            console.error("Error logging transaction:", error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Calculate platform fee (for revenue sharing with organizers)
     */
    static calculatePlatformFee(amount, feePercentage = 5) {
        const platformFee = amount * (feePercentage / 100);
        const organizerAmount = amount - platformFee;

        return {
            totalAmount: amount,
            platformFee,
            organizerAmount,
            feePercentage,
        };
    }

    /**
     * Process webhook event
     */
    static async processWebhookEvent(event) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            switch (event.type) {
                case "payment_intent.succeeded":
                    await this.handlePaymentSucceeded(event.data.object, client);
                    break;

                case "payment_intent.payment_failed":
                    await this.handlePaymentFailed(event.data.object, client);
                    break;

                case "charge.dispute.created":
                    await this.handleDisputeCreated(event.data.object, client);
                    break;

                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("Error processing webhook event:", error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Handle successful payment
     */
    static async handlePaymentSucceeded(paymentIntent, client) {
        try {
            // Update booking status
            const bookingQuery = `
                UPDATE bookings
                SET booking_status = 'confirmed',
                    payment_status = 'paid',
                    payment_method = 'stripe',
                    stripe_payment_intent_id = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;

            const bookingId = paymentIntent.metadata.booking_id;
            const result = await client.query(bookingQuery, [paymentIntent.id, bookingId]);

            if (result.rows.length > 0) {
                // Log successful transaction
                await this.logTransaction({
                    booking_id: bookingId,
                    stripe_payment_intent_id: paymentIntent.id,
                    amount: paymentIntent.amount_received / 100,
                    currency: paymentIntent.currency,
                    status: "succeeded",
                    payment_method_type: paymentIntent.charges.data[0]?.payment_method_details?.type || "unknown",
                    metadata: paymentIntent.metadata,
                });

                console.log(`Payment succeeded for booking ${bookingId}`);
            }
        } catch (error) {
            console.error("Error handling payment success:", error);
            throw error;
        }
    }

    /**
     * Handle failed payment
     */
    static async handlePaymentFailed(paymentIntent, client) {
        try {
            const bookingQuery = `
                UPDATE bookings
                SET payment_status = 'failed',
                    stripe_payment_intent_id = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;

            const bookingId = paymentIntent.metadata.booking_id;
            await client.query(bookingQuery, [paymentIntent.id, bookingId]);

            // Log failed transaction
            await this.logTransaction({
                booking_id: bookingId,
                stripe_payment_intent_id: paymentIntent.id,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                status: "failed",
                payment_method_type: "unknown",
                metadata: paymentIntent.metadata,
            });

            console.log(`Payment failed for booking ${bookingId}`);
        } catch (error) {
            console.error("Error handling payment failure:", error);
            throw error;
        }
    }

    /**
     * Handle dispute created
     */
    static async handleDisputeCreated(charge, client) {
        try {
            // Log dispute for admin review
            const disputeQuery = `
                INSERT INTO payment_disputes (
                    stripe_charge_id, amount, currency, reason, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            `;

            await client.query(disputeQuery, [
                charge.id,
                charge.amount / 100,
                charge.currency,
                charge.dispute?.reason || "unknown",
                "open",
            ]);

            console.log(`Dispute created for charge ${charge.id}`);
        } catch (error) {
            console.error("Error handling dispute creation:", error);
            throw error;
        }
    }
}

export default StripeService;
