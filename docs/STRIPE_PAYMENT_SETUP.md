# Stripe Payment Pipeline Setup Guide

## Overview

This guide covers setting up the Stripe payment pipeline for the Be-Out Apps monorepo with the new Stripe account.

## Current Status

✅ **Code Infrastructure Complete**
- Payment service and routes fully implemented
- Database schema with `payment_transactions` table ready
- Webhook handling configured
- Client-side Stripe integration ready

⚠️ **Configuration Required**
- New Stripe API keys need to be configured
- Webhook endpoint needs to be registered with Stripe
- Environment variables need updating

## Step 1: Configure Stripe API Keys

### 1.1 Update Server Environment Variables

In `/server/.env`, replace the placeholder values:

```env
# Replace these with your actual Stripe keys from the dashboard
STRIPE_SECRET_KEY=sk_live_... or sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_live_... or pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (get this after setting up webhook)
```

### 1.2 Update Client Environment Variables

In `/client/.env`, add the publishable key:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... or pk_test_...
```

## Step 2: Set Up Stripe Webhook

### 2.1 Create Webhook Endpoint in Stripe Dashboard

1. Go to your Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL:
   - **Development**: `http://localhost:3000/api/webhooks/stripe`
   - **Production**: `https://your-domain.com/api/webhooks/stripe`

### 2.2 Configure Webhook Events

Select these events to listen to:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.dispute.created`

### 2.3 Get Webhook Secret

After creating the webhook:
1. Copy the webhook signing secret (starts with `whsec_`)
2. Update `STRIPE_WEBHOOK_SECRET` in your server `.env` file

## Step 3: Test the Integration

### 3.1 Start Development Servers

```bash
cd /home/zen/dev/be-out-apps
npm run dev
```

### 3.2 Test Payment Flow

The payment flow is integrated into the booking process:

1. User creates a booking
2. System creates a payment intent via `/api/payments/create-payment-intent`
3. Client handles payment with Stripe Elements
4. Webhook confirms payment and updates booking status

### 3.3 Test Webhook (Development)

For development testing, use the webhook test endpoint:

```bash
curl -X POST http://localhost:3000/api/webhooks/stripe/test \
  -H "Content-Type: application/json" \
  -d '{"event_type": "payment_intent.succeeded", "booking_id": "1"}'
```

## Step 4: Production Deployment

### 4.1 Environment Variables

For production deployment, ensure these environment variables are set:

**Server:**
```env
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NODE_ENV=production
```

**Client:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
VITE_API_URL=https://your-api-domain.com
```

### 4.2 Update Webhook URL

Update your Stripe webhook endpoint to use your production URL:
`https://your-api-domain.com/api/webhooks/stripe`

## Payment Flow Architecture

### Database Tables
- `bookings` - Contains booking information with `stripe_payment_intent_id`
- `payment_transactions` - Logs all payment attempts and results
- `organizer_accounts` - For future revenue sharing (Connect accounts)

### API Endpoints
- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/confirm-payment` - Confirm successful payment
- `POST /api/payments/refund` - Process refunds (admin)
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

### Security Features
- JWT authentication for payment endpoints
- Webhook signature verification
- Input validation and sanitization
- Transaction logging for audit trails

## Testing Checklist

- [ ] Stripe keys configured correctly
- [ ] Webhook endpoint responding (200 OK)
- [ ] Payment intent creation working
- [ ] Payment confirmation updating booking status
- [ ] Webhook events being processed
- [ ] Payment transactions being logged
- [ ] Error handling working properly

## Troubleshooting

### Common Issues

1. **"Stripe is not configured" error**
   - Check `STRIPE_SECRET_KEY` is set in server environment
   - Restart server after environment changes

2. **Webhook signature verification failed**
   - Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
   - Check webhook URL is correct

3. **Payment intent creation failed**
   - Check Stripe secret key is valid
   - Verify booking exists and is in 'pending' status

4. **Client can't load Stripe**
   - Check `VITE_STRIPE_PUBLISHABLE_KEY` is set
   - Restart client development server

### Debug Commands

```bash
# Check if Stripe keys are loaded
node -e "console.log('Stripe Secret:', !!process.env.STRIPE_SECRET_KEY)"

# Test webhook endpoint
curl -X POST http://localhost:3000/api/webhooks/stripe/test

# Check payment service availability
curl http://localhost:3000/api/payments/health
```

## Revenue Sharing (Future)

The codebase includes infrastructure for revenue sharing with organizers:
- `organizer_accounts` table for Stripe Connect accounts
- Transfer creation methods in `StripeService`
- Platform fee calculation utilities

This will be implemented in a future phase.
