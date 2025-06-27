-- Payment system database schema for Be-Out app
-- This file contains all payment-related tables for centralized payment processing

-- Payment transactions table
CREATE TABLE
IF NOT EXISTS payment_transactions
(
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings
(id),
    stripe_payment_id VARCHAR
(255) UNIQUE NOT NULL,
    stripe_payment_intent_id VARCHAR
(255),
    amount DECIMAL
(10,2) NOT NULL,
    currency VARCHAR
(3) DEFAULT 'EUR',
    status VARCHAR
(50) NOT NULL, -- succeeded, pending, failed, canceled, requires_action
    payment_method_type VARCHAR
(50), -- card, paypal, bank_transfer, etc.
    payment_method_id VARCHAR
(255),
    customer_email VARCHAR
(255),
    description TEXT,
    metadata JSONB,
    stripe_fee DECIMAL
(10,2),
    net_amount DECIMAL
(10,2),
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- Refunds table
CREATE TABLE
IF NOT EXISTS refunds
(
    id SERIAL PRIMARY KEY,
    payment_transaction_id INTEGER REFERENCES payment_transactions
(id),
    stripe_refund_id VARCHAR
(255) UNIQUE NOT NULL,
    amount DECIMAL
(10,2) NOT NULL,
    currency VARCHAR
(3) DEFAULT 'EUR',
    reason VARCHAR
(255),
    status VARCHAR
(50) NOT NULL, -- pending, succeeded, failed, canceled
    metadata JSONB,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- Disputes table
CREATE TABLE
IF NOT EXISTS disputes
(
    id SERIAL PRIMARY KEY,
    payment_transaction_id INTEGER REFERENCES payment_transactions
(id),
    stripe_dispute_id VARCHAR
(255) UNIQUE NOT NULL,
    amount DECIMAL
(10,2) NOT NULL,
    currency VARCHAR
(3) DEFAULT 'EUR',
    reason VARCHAR
(100), -- duplicate, fraudulent, subscription_canceled, etc.
    status VARCHAR
(50) NOT NULL, -- warning_needs_response, warning_under_review, warning_closed, needs_response, under_review, charge_refunded, won, lost
    evidence_due_by TIMESTAMP
WITH TIME ZONE,
    is_charge_refundable BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- Payment method information (for customer payment methods)
CREATE TABLE
IF NOT EXISTS payment_methods
(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users
(id),
    stripe_payment_method_id VARCHAR
(255) UNIQUE NOT NULL,
    type VARCHAR
(50) NOT NULL, -- card, bank_account, etc.
    brand VARCHAR
(50), -- visa, mastercard, etc. (for cards)
    last4 VARCHAR
(4), -- last 4 digits
    exp_month INTEGER, -- expiration month (for cards)
    exp_year INTEGER, -- expiration year (for cards)
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- Webhooks log table for Stripe webhooks
CREATE TABLE
IF NOT EXISTS webhook_events
(
    id SERIAL PRIMARY KEY,
    stripe_event_id VARCHAR
(255) UNIQUE NOT NULL,
    event_type VARCHAR
(100) NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    data JSONB NOT NULL,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    processed_at TIMESTAMP
WITH TIME ZONE
);

-- Add indexes for better performance
CREATE INDEX
IF NOT EXISTS idx_payment_transactions_booking_id ON payment_transactions
(booking_id);
CREATE INDEX
IF NOT EXISTS idx_payment_transactions_stripe_payment_id ON payment_transactions
(stripe_payment_id);
CREATE INDEX
IF NOT EXISTS idx_payment_transactions_status ON payment_transactions
(status);
CREATE INDEX
IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions
(created_at);

CREATE INDEX
IF NOT EXISTS idx_refunds_payment_transaction_id ON refunds
(payment_transaction_id);
CREATE INDEX
IF NOT EXISTS idx_refunds_stripe_refund_id ON refunds
(stripe_refund_id);

CREATE INDEX
IF NOT EXISTS idx_disputes_payment_transaction_id ON disputes
(payment_transaction_id);
CREATE INDEX
IF NOT EXISTS idx_disputes_status ON disputes
(status);

CREATE INDEX
IF NOT EXISTS idx_payment_methods_user_id ON payment_methods
(user_id);
CREATE INDEX
IF NOT EXISTS idx_payment_methods_stripe_payment_method_id ON payment_methods
(stripe_payment_method_id);

CREATE INDEX
IF NOT EXISTS idx_webhook_events_stripe_event_id ON webhook_events
(stripe_event_id);
CREATE INDEX
IF NOT EXISTS idx_webhook_events_processed ON webhook_events
(processed);
CREATE INDEX
IF NOT EXISTS idx_webhook_events_event_type ON webhook_events
(event_type);

-- Add trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column
()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW
();
RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_transactions_updated_at BEFORE
UPDATE ON payment_transactions FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();
CREATE TRIGGER update_refunds_updated_at BEFORE
UPDATE ON refunds FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();
CREATE TRIGGER update_disputes_updated_at BEFORE
UPDATE ON disputes FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();
CREATE TRIGGER update_payment_methods_updated_at BEFORE
UPDATE ON payment_methods FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();
