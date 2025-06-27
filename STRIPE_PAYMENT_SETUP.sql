-- STRIPE PAYMENT INTEGRATION - DATABASE SETUP FOR POSTGRESQL
-- Execute these statements in order to implement payment tracking
-- NOTE: This SQL is written specifically for PostgreSQL

-- ============================================================================
-- STEP 1: Create payment_transactions table
-- ============================================================================

CREATE TABLE payment_transactions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(50) NOT NULL,
    -- succeeded, failed, pending, canceled
    payment_method_type VARCHAR(50),
    -- card, sepa_debit, etc.
    metadata JSONB,
    created_at TIMESTAMP
    WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
    WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

    -- Create indexes for faster queries
    CREATE INDEX idx_payment_transactions_booking_id ON payment_transactions(booking_id);
    CREATE INDEX idx_payment_transactions_stripe_id ON payment_transactions(stripe_payment_intent_id);
    CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
    CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

    -- ============================================================================
    -- STEP 2: Create payment_disputes table
    -- ============================================================================

    CREATE TABLE payment_disputes
    (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        stripe_charge_id VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'EUR',
        reason VARCHAR(100),
        -- fraudulent, subscription_canceled, product_unacceptable, etc.
        status VARCHAR(50) NOT NULL,
        -- open, under_review, won, lost
        evidence_due_by TIMESTAMP
        WITH TIME ZONE,
    created_at TIMESTAMP
        WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
        WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

        -- Create indexes
        CREATE INDEX idx_payment_disputes_stripe_charge_id ON payment_disputes(stripe_charge_id);
        CREATE INDEX idx_payment_disputes_status ON payment_disputes(status);
        CREATE INDEX idx_payment_disputes_created_at ON payment_disputes(created_at DESC);

        -- ============================================================================
        -- STEP 2.5: Create payment_refunds table
        -- ============================================================================

        CREATE TABLE payment_refunds
        (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE CASCADE,
            stripe_refund_id VARCHAR(255) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'EUR',
            reason VARCHAR(100),
            -- requested_by_customer, duplicate, fraudulent, etc.
            status VARCHAR(50) NOT NULL,
            -- pending, succeeded, failed, canceled
            metadata JSONB,
            created_at TIMESTAMP
            WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
            WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

            -- Create indexes
            CREATE INDEX idx_payment_refunds_payment_transaction_id ON payment_refunds(payment_transaction_id);
            CREATE INDEX idx_payment_refunds_stripe_refund_id ON payment_refunds(stripe_refund_id);
            CREATE INDEX idx_payment_refunds_status ON payment_refunds(status);
            CREATE INDEX idx_payment_refunds_created_at ON payment_refunds(created_at DESC);

            -- ============================================================================
            -- STEP 3: Create organizer_accounts table (for future organizer app)
            -- ============================================================================

            CREATE TABLE organizer_accounts
            (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                stripe_account_id VARCHAR(255) UNIQUE NOT NULL,
                account_type VARCHAR(50) DEFAULT 'express',
                -- express, standard, custom
                country VARCHAR(2) DEFAULT 'FR',
                business_type VARCHAR(50),
                -- individual, company
                onboarding_completed BOOLEAN DEFAULT FALSE,
                payouts_enabled BOOLEAN DEFAULT FALSE,
                charges_enabled BOOLEAN DEFAULT FALSE,
                details_submitted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP
                WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
                WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

                -- Create indexes
                CREATE INDEX idx_organizer_accounts_user_id ON organizer_accounts(user_id);
                CREATE INDEX idx_organizer_accounts_stripe_account_id ON organizer_accounts(stripe_account_id);

                -- ============================================================================
                -- STEP 4: Create revenue_splits table (for platform fee tracking)
                -- ============================================================================

                CREATE TABLE revenue_splits
                (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
                    payment_transaction_id UUID REFERENCES payment_transactions(id),
                    total_amount DECIMAL(10, 2) NOT NULL,
                    platform_fee DECIMAL(10, 2) NOT NULL,
                    platform_fee_percentage DECIMAL(5, 2) DEFAULT 5.00,
                    organizer_amount DECIMAL(10, 2) NOT NULL,
                    organizer_account_id UUID REFERENCES organizer_accounts(id),
                    transfer_status VARCHAR(50) DEFAULT 'pending',
                    -- pending, completed, failed
                    stripe_transfer_id VARCHAR(255),
                    transferred_at TIMESTAMP
                    WITH TIME ZONE,
    created_at TIMESTAMP
                    WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

                    -- Create indexes
                    CREATE INDEX idx_revenue_splits_booking_id ON revenue_splits(booking_id);
                    CREATE INDEX idx_revenue_splits_organizer_account ON revenue_splits(organizer_account_id);
                    CREATE INDEX idx_revenue_splits_transfer_status ON revenue_splits(transfer_status);

                    -- ============================================================================
                    -- STEP 5: Add payment-related columns to existing bookings table
                    -- ============================================================================

                    -- Add Stripe payment intent ID to bookings table
                    ALTER TABLE bookings
ADD COLUMN
                    IF NOT EXISTS stripe_payment_intent_id VARCHAR
                    (255),
                    ADD COLUMN
                    IF NOT EXISTS payment_method VARCHAR
                    (50) DEFAULT 'pending';

                    -- Create index for stripe payment intent ID
                    CREATE INDEX
                    IF NOT EXISTS idx_bookings_stripe_payment_intent ON bookings
                    (stripe_payment_intent_id);

                    -- ============================================================================
                    -- STEP 6: Create payment analytics view
                    -- ============================================================================

                    CREATE OR REPLACE VIEW payment_analytics AS
                    SELECT
                        DATE_TRUNC('day', pt.created_at) as transaction_date,
                        COUNT(*) as total_transactions,
                        COUNT(CASE WHEN pt.status = 'succeeded' THEN 1 END) as successful_transactions,
                        COUNT(CASE WHEN pt.status = 'failed' THEN 1 END) as failed_transactions,
                        SUM(CASE WHEN pt.status = 'succeeded' THEN pt.amount ELSE 0 END) as total_revenue,
                        AVG(CASE WHEN pt.status = 'succeeded' THEN pt.amount END) as avg_transaction_value,
                        COUNT(DISTINCT pt.booking_id) as unique_bookings,
                        COUNT(DISTINCT b.customer_email) as unique_customers
                    FROM payment_transactions pt
                        LEFT JOIN bookings b ON pt.booking_id = b.id
                    GROUP BY DATE_TRUNC('day', pt.created_at)
                    ORDER BY transaction_date DESC;

                    -- ============================================================================
                    -- STEP 7: Create function to calculate daily revenue
                    -- ============================================================================

                    CREATE OR REPLACE FUNCTION get_daily_revenue
                    (start_date DATE, end_date DATE)
RETURNS TABLE
                    (
    date DATE,
    total_revenue DECIMAL
                    (10,2),
    transaction_count INTEGER,
    avg_transaction DECIMAL
                    (10,2)
) AS $$
                    BEGIN
                        RETURN QUERY
                        SELECT
                            pt.created_at::DATE as date,
                            SUM(CASE WHEN pt.status = 'succeeded' THEN pt.amount ELSE 0 END) as total_revenue,
                            COUNT(*)
                        ::INTEGER as transaction_count,
        AVG
                        (CASE WHEN pt.status = 'succeeded' THEN pt.amount
                    END
                    ) as avg_transaction
    FROM payment_transactions pt
    WHERE pt.created_at::DATE BETWEEN start_date AND end_date
    GROUP BY pt.created_at::DATE
    ORDER BY date DESC;
                    END;
$$ LANGUAGE plpgsql;

                    -- ============================================================================
                    -- STEP 8: Create trigger to update booking payment status
                    -- ============================================================================

                    CREATE OR REPLACE FUNCTION update_booking_payment_status
                    ()
RETURNS TRIGGER AS $$
                    BEGIN
                        -- Update booking payment status when payment transaction status changes
                        IF NEW.status = 'succeeded' AND OLD.status != 'succeeded' THEN
                        UPDATE bookings
        SET payment_status = 'paid',
            booking_status = CASE
                WHEN booking_status = 'pending' THEN 'confirmed'
                ELSE booking_status
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.booking_id;
                        ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
                        UPDATE bookings
        SET payment_status = 'failed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.booking_id;
                    END
                    IF;

    RETURN NEW;
                    END;
$$ LANGUAGE plpgsql;

                    CREATE TRIGGER trigger_update_booking_payment_status
    AFTER
                    UPDATE ON payment_transactions
    FOR EACH ROW
                    EXECUTE FUNCTION update_booking_payment_status
                    ();

                    -- ============================================================================
                    -- VERIFICATION QUERIES
                    -- ============================================================================

                    -- Check if payment_transactions table exists and has correct structure
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_name = 'payment_transactions'
                    ORDER BY ordinal_position;

                    -- Check if triggers were created
                    SELECT trigger_name, event_object_table, action_timing, event_manipulation
                    FROM information_schema.triggers
                    WHERE trigger_name LIKE '%payment%';

                    -- Test the analytics view
                    SELECT *
                    FROM payment_analytics LIMIT
                    5;
