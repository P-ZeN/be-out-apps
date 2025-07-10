-- Address Migration Repair Script
-- This script fixes missing address relationships that should have been created during migration

-- First, let's find addresses that exist but have no relationships
SELECT
    a.id as address_id,
    a.address_line_1,
    a.locality,
    a.address_type,
    a.label,
    a.created_at
FROM addresses a
    LEFT JOIN address_relationships ar ON a.id = ar.address_id
WHERE ar.address_id IS NULL
ORDER BY a.created_at;

-- Find user profiles that have address data but no address relationships
SELECT DISTINCT
    up.user_id,
    up.street_number,
    up.street_name,
    up.city,
    up.postal_code,
    up.country,
    u.email
FROM user_profiles up
    JOIN users u ON u.id = up.user_id
    LEFT JOIN address_relationships ar ON ar.entity_id = up.user_id AND ar.entity_type = 'user'
WHERE ar.entity_id IS NULL
    AND ((up.street_name IS NOT NULL AND up.street_name != '')
    OR (up.city IS NOT NULL AND up.city != '')
    OR (up.postal_code IS NOT NULL AND up.postal_code != ''));

-- Create a more robust relationship repair that doesn't rely on exact string matching
INSERT INTO address_relationships
    (
    address_id,
    entity_type,
    entity_id,
    relationship_type,
    is_active,
    created_at
    )
SELECT DISTINCT
    a.id as address_id,
    'user' as entity_type,
    up.user_id as entity_id,
    'primary' as relationship_type,
    true as is_active,
    CURRENT_TIMESTAMP as created_at
FROM addresses a
CROSS JOIN user_profiles up
    LEFT JOIN address_relationships ar ON ar.entity_id = up.user_id AND ar.entity_type = 'user'
WHERE ar.entity_id IS NULL -- User has no address relationships
    AND a.address_type = 'home'
    AND a.label = 'Home Address'
    -- More flexible matching - match on available fields
    AND (
        (up.city IS NOT NULL AND up.city != '' AND a.locality = up.city)
    OR (up.postal_code IS NOT NULL AND up.postal_code != '' AND a.postal_code = up.postal_code)
    OR (up.street_name IS NOT NULL AND up.street_name != '' AND a.address_line_1
ILIKE '%' || up.street_name || '%')
    )
    -- Ensure we only have address data for this user
    AND
((up.street_name IS NOT NULL AND up.street_name != '')
         OR
(up.city IS NOT NULL AND up.city != '')
         OR
(up.postal_code IS NOT NULL AND up.postal_code != ''))
    -- Additional safety: only match addresses created around migration time
    AND a.created_at <= CURRENT_TIMESTAMP
ORDER BY up.user_id, a.created_at DESC;

-- Alternative: Manual fix for specific user
-- If the above doesn't work, we can manually link addresses for the specific user

-- For user 37a806e9-55c0-4b08-a378-151a642258fa, find their most recent address
-- and create a relationship if none exists
DO $$
DECLARE
    user_uuid UUID := '37a806e9-55c0-4b08-a378-151a642258fa';
    latest_address_id INTEGER;
    relationship_exists BOOLEAN;
BEGIN
    -- Check if user already has address relationships
    SELECT EXISTS
    (
        SELECT 1
    FROM address_relationships
    WHERE entity_type = 'user'
        AND entity_id = user_uuid::text
        AND is_active = true
    )
    INTO relationship_exists;

IF NOT relationship_exists THEN
-- Find the most recent address that could belong to this user
-- (addresses created by the migration or by onboarding)
SELECT a.id
INTO latest_address_id
FROM addresses a
WHERE a.address_type IN ('home', 'residential')
    AND a.created_at >= '2025-01-01'
-- Addresses created recently
ORDER BY a.created_at DESC
        LIMIT 1;

        IF latest_address_id
IS NOT NULL THEN
INSERT INTO address_relationships
    (
    address_id,
    entity_type,
    entity_id,
    relationship_type,
    is_active,
    created_at
    )
VALUES
    (
        latest_address_id,
        'user',
        user_uuid::text,
        'primary',
        true,
        CURRENT_TIMESTAMP
            );

RAISE NOTICE 'Created address relationship for user % with address %', user_uuid, latest_address_id;
        ELSE
            RAISE NOTICE 'No suitable address found for user %', user_uuid;
END
IF;
    ELSE
        RAISE NOTICE 'User % already has address relationships', user_uuid;
END
IF;
END $$;

-- Verification queries
-- Check the repair results
SELECT
    u.email,
    up.user_id,
    a.address_line_1,
    a.locality,
    ar.relationship_type,
    ar.created_at as relationship_created
FROM users u
    JOIN user_profiles up ON u.id = up.user_id
    JOIN address_relationships ar ON ar.entity_id = up.user_id AND ar.entity_type = 'user'
    JOIN addresses a ON a.id = ar.address_id
WHERE up.user_id = '37a806e9-55c0-4b08-a378-151a642258fa'
ORDER BY ar.created_at DESC;
