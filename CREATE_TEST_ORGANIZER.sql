-- OPERATION: Create test organizer user for development
-- PURPOSE: Set up a test organizer account for testing the organizer interface

-- Create organizer user (password: password123)
INSERT INTO users
    (email, password, role, is_active)
VALUES
    ('organizer@test.com', '$2b$10$rQkHE8.HGwCl6/FNjJv3vOyqKSI8Bt8LRzQ5kRP.YBjzKxVfBKzqC', 'organizer', true)
ON CONFLICT
(email) DO NOTHING;

-- Get the organizer user ID and create profile
DO $$
DECLARE
    organizer_user_id UUID;
BEGIN
    SELECT id
    INTO organizer_user_id
    FROM users
    WHERE email = 'organizer@test.com';

    IF organizer_user_id IS NOT NULL THEN
    -- Create organizer profile
    INSERT INTO organizer_profiles
        (
        user_id,
        company_name,
        contact_person,
        phone,
        website_url,
        description,
        business_address,
        business_city,
        business_postal_code,
        business_country,
        status
        )
    VALUES
        (
            organizer_user_id,
            'EventPro SAS',
            'Jean Martin',
            '+33 1 23 45 67 89',
            'https://eventpro.fr',
            'Spécialisé dans l''organisation d''événements culturels, sportifs et d''entreprise en Île-de-France',
            '123 Rue de la République',
            'Paris',
            '75011',
            'France',
            'approved'
        )
    ON CONFLICT
    (user_id) DO
    UPDATE SET
            company_name = EXCLUDED.company_name,
            contact_person = EXCLUDED.contact_person,
            phone = EXCLUDED.phone,
            website_url = EXCLUDED.website_url,
            description = EXCLUDED.description,
            business_address = EXCLUDED.business_address,
            business_city = EXCLUDED.business_city,
            business_postal_code = EXCLUDED.business_postal_code,
            business_country = EXCLUDED.business_country,
            status = EXCLUDED.status;

    -- Create organizer account
    INSERT INTO organizer_accounts
        (
        user_id,
        stripe_account_id,
        account_type,
        country,
        onboarding_completed,
        payouts_enabled,
        charges_enabled,
        details_submitted
        )
    VALUES
        (
            organizer_user_id,
            'acct_test_organizer_eventpro',
            'express',
            'FR',
            true,
            true,
            true,
            true
        )
    ON CONFLICT
    (stripe_account_id) DO
    UPDATE SET
            onboarding_completed = EXCLUDED.onboarding_completed,
            payouts_enabled = EXCLUDED.payouts_enabled,
            charges_enabled = EXCLUDED.charges_enabled,
            details_submitted = EXCLUDED.details_submitted;

    -- Update some existing events to have this organizer
    UPDATE events
        SET organizer_id = organizer_user_id
        WHERE organizer_id IS NULL
        AND id IN (SELECT id
        FROM events
        ORDER BY created_at DESC LIMIT 3);

        RAISE
    NOTICE 'Test organizer created: organizer@test.com (password: password123)';
END
IF;
END $$;
