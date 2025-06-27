-- Create the missing refunds table for Stripe integration
-- Execute this after running STRIPE_PAYMENT_SETUP.sql

CREATE TABLE
IF NOT EXISTS payment_refunds
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    payment_transaction_id UUID REFERENCES payment_transactions
(id) ON
DELETE CASCADE,
    stripe_refund_id VARCHAR(255)
NOT NULL,
    amount DECIMAL
(10, 2) NOT NULL,
    currency VARCHAR
(3) DEFAULT 'EUR',
    reason VARCHAR
(100), -- requested_by_customer, duplicate, fraudulent, etc.
    status VARCHAR
(50) NOT NULL, -- pending, succeeded, failed, canceled
    metadata JSONB,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX
IF NOT EXISTS idx_payment_refunds_payment_transaction_id ON payment_refunds
(payment_transaction_id);
CREATE INDEX
IF NOT EXISTS idx_payment_refunds_stripe_refund_id ON payment_refunds
(stripe_refund_id);
CREATE INDEX
IF NOT EXISTS idx_payment_refunds_status ON payment_refunds
(status);
CREATE INDEX
IF NOT EXISTS idx_payment_refunds_created_at ON payment_refunds
(created_at DESC);
