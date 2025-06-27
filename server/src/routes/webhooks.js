import { Router } from "express";
import express from "express";
import Stripe from "stripe";
import StripeService from "../services/stripeService.js";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Stripe webhook endpoint
 * This endpoint receives webhooks from Stripe to handle payment events
 */
router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`Received webhook event: ${event.type}`);

    try {
        // Process the event using our service
        await StripeService.processWebhookEvent(event);

        // Send specific responses based on event type
        switch (event.type) {
            case "payment_intent.succeeded":
                console.log(`Payment succeeded: ${event.data.object.id}`);
                break;

            case "payment_intent.payment_failed":
                console.log(`Payment failed: ${event.data.object.id}`);
                break;

            case "charge.dispute.created":
                console.log(`Dispute created: ${event.data.object.id}`);
                // TODO: Notify admin team about dispute
                break;

            case "account.updated":
                // For organizer connected accounts
                console.log(`Account updated: ${event.data.object.id}`);
                break;

            case "transfer.created":
                // For organizer payouts
                console.log(`Transfer created: ${event.data.object.id}`);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).json({
            error: "Webhook processing failed",
            details: error.message,
        });
    }
});

/**
 * Test webhook endpoint for development
 */
router.post("/stripe/test", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ error: "Test endpoint not available in production" });
    }

    try {
        const { event_type, payment_intent_id, booking_id } = req.body;

        // Create a mock event for testing
        const mockEvent = {
            type: event_type || "payment_intent.succeeded",
            data: {
                object: {
                    id: payment_intent_id || "pi_test_1234567890",
                    status: "succeeded",
                    amount_received: 5000, // 50.00 EUR in cents
                    currency: "eur",
                    metadata: {
                        booking_id: booking_id || "1",
                        platform: "be-out",
                    },
                    charges: {
                        data: [
                            {
                                payment_method_details: {
                                    type: "card",
                                },
                            },
                        ],
                    },
                },
            },
        };

        await StripeService.processWebhookEvent(mockEvent);

        res.json({
            success: true,
            message: "Test webhook processed successfully",
            event: mockEvent,
        });
    } catch (error) {
        console.error("Error processing test webhook:", error);
        res.status(500).json({
            error: "Test webhook processing failed",
            details: error.message,
        });
    }
});

/**
 * Webhook status endpoint for monitoring
 */
router.get("/status", (req, res) => {
    res.json({
        webhook_endpoint: "/api/webhooks/stripe",
        test_endpoint: "/api/webhooks/stripe/test",
        environment: process.env.NODE_ENV || "development",
        stripe_webhook_configured: !!endpointSecret,
        supported_events: [
            "payment_intent.succeeded",
            "payment_intent.payment_failed",
            "charge.dispute.created",
            "account.updated",
            "transfer.created",
        ],
    });
});

export default router;
