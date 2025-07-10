-- Migration: Migrate existing address data to new system
-- This migration moves all existing address data from scattered fields
-- into the new centralized address system

-- Migrate user profile addresses
INSERT INTO addresses
    (
    address_line_1,
    locality,
    postal_code,
    country_code,
    address_type,
    label,
    is_primary,
    latitude,
    longitude,
    created_at,
    updated_at
    )
SELECT
    CASE
        WHEN up.street_number IS NOT NULL AND up.street_name IS NOT NULL
        THEN CONCAT_WS(' ', up.street_number, up.street_name)
        WHEN up.street_name IS NOT NULL
        THEN up.street_name
        ELSE 'Address not specified'
    END as address_line_1,
    COALESCE(up.city, 'City not specified') as locality,
    up.postal_code,
    CASE
        WHEN up.country = 'France' OR up.country IS NULL THEN 'FR'
        WHEN up.country = 'United States' THEN 'US'
        WHEN up.country = 'Germany' THEN 'DE'
        WHEN up.country = 'Spain' THEN 'ES'
        WHEN up.country = 'Italy' THEN 'IT'
        WHEN up.country = 'United Kingdom' THEN 'GB'
        ELSE 'FR' -- Default to France for unknown countries
    END as country_code,
    'home' as address_type,
    'Home Address' as label,
    true as is_primary,
    NULL as latitude, -- Will be populated later through geocoding
    NULL as longitude,
    COALESCE(up.created_at, CURRENT_TIMESTAMP) as created_at,
    COALESCE(up.updated_at, CURRENT_TIMESTAMP) as updated_at
FROM user_profiles up
WHERE (up.street_name IS NOT NULL AND up.street_name != '')
    OR (up.city IS NOT NULL AND up.city != '')
    OR (up.postal_code IS NOT NULL AND up.postal_code != '');

-- Create address relationships for user profiles
INSERT INTO address_relationships
    (
    address_id,
    entity_type,
    entity_id,
    relationship_type,
    is_active,
    created_at
    )
SELECT
    a.id as address_id,
    'user' as entity_type,
    up.user_id as entity_id,
    'primary' as relationship_type,
    true as is_active,
    CURRENT_TIMESTAMP as created_at
FROM addresses a
    JOIN user_profiles up ON (
    a.address_line_1 = CASE
        WHEN up.street_number IS NOT NULL AND up.street_name IS NOT NULL
        THEN CONCAT_WS(' ', up.street_number, up.street_name)
        WHEN up.street_name IS NOT NULL
        THEN up.street_name
        ELSE 'Address not specified'
    END
        AND a.locality = COALESCE(up.city, 'City not specified')
        AND a.address_type = 'home'
        AND a.label = 'Home Address'
);

-- Migrate organizer business addresses
INSERT INTO addresses
    (
    address_line_1,
    locality,
    postal_code,
    country_code,
    address_type,
    label,
    is_primary,
    created_at,
    updated_at
    )
SELECT
    COALESCE(op.business_address, 'Business address not specified') as address_line_1,
    COALESCE(op.business_city, 'City not specified') as locality,
    op.business_postal_code,
    CASE
        WHEN op.business_country = 'France' OR op.business_country IS NULL THEN 'FR'
        WHEN op.business_country = 'United States' THEN 'US'
        WHEN op.business_country = 'Germany' THEN 'DE'
        WHEN op.business_country = 'Spain' THEN 'ES'
        WHEN op.business_country = 'Italy' THEN 'IT'
        WHEN op.business_country = 'United Kingdom' THEN 'GB'
        ELSE 'FR'
    END as country_code,
    'business' as address_type,
    'Business Address' as label,
    true as is_primary,
    COALESCE(op.created_at, CURRENT_TIMESTAMP) as created_at,
    COALESCE(op.updated_at, CURRENT_TIMESTAMP) as updated_at
FROM organizer_profiles op
WHERE (op.business_address IS NOT NULL AND op.business_address != '')
    OR (op.business_city IS NOT NULL AND op.business_city != '')
    OR (op.business_postal_code IS NOT NULL AND op.business_postal_code != '');

-- Create address relationships for organizer profiles
INSERT INTO address_relationships
    (
    address_id,
    entity_type,
    entity_id,
    relationship_type,
    is_active,
    created_at
    )
SELECT
    a.id as address_id,
    'organizer' as entity_type,
    op.id as entity_id,
    'business' as relationship_type,
    true as is_active,
    CURRENT_TIMESTAMP as created_at
FROM addresses a
    JOIN organizer_profiles op ON (
    a.address_line_1 = COALESCE(op.business_address, 'Business address not specified')
        AND a.locality = COALESCE(op.business_city, 'City not specified')
        AND a.address_type = 'business'
        AND a.label = 'Business Address'
);

-- Migrate venue addresses
INSERT INTO addresses
    (
    address_line_1,
    locality,
    postal_code,
    country_code,
    latitude,
    longitude,
    address_type,
    label,
    is_primary,
    created_at
    )
SELECT
    v.address as address_line_1,
    v.city as locality,
    v.postal_code,
    CASE
        WHEN v.country = 'France' OR v.country IS NULL THEN 'FR'
        WHEN v.country = 'United States' THEN 'US'
        WHEN v.country = 'Germany' THEN 'DE'
        WHEN v.country = 'Spain' THEN 'ES'
        WHEN v.country = 'Italy' THEN 'IT'
        WHEN v.country = 'United Kingdom' THEN 'GB'
        ELSE 'FR'
    END as country_code,
    v.latitude,
    v.longitude,
    'venue' as address_type,
    'Venue Location' as label,
    true as is_primary,
    COALESCE(v.created_at, CURRENT_TIMESTAMP) as created_at
FROM venues v
WHERE v.address IS NOT NULL AND v.address != ''
    AND v.city IS NOT NULL AND v.city != '';

-- Create address relationships for venues
INSERT INTO address_relationships
    (
    address_id,
    entity_type,
    entity_id,
    relationship_type,
    is_active,
    created_at
    )
SELECT
    a.id as address_id,
    'venue' as entity_type,
    v.id as entity_id,
    'venue_location' as relationship_type,
    true as is_active,
    CURRENT_TIMESTAMP as created_at
FROM addresses a
    JOIN venues v ON (
    a.address_line_1 = v.address
        AND a.locality = v.city
        AND a.address_type = 'venue'
        AND a.label = 'Venue Location'
        AND ABS(COALESCE(a.latitude, 0) - COALESCE(v.latitude, 0)) < 0.001 -- Allow small coordinate differences
        AND ABS(COALESCE(a.longitude, 0) - COALESCE(v.longitude, 0)) < 0.001
);

-- Update formatted_address field for all migrated addresses
UPDATE addresses
SET formatted_address = format_address(id)
WHERE formatted_address IS NULL;

-- Create some useful views for easy access
CREATE OR REPLACE VIEW user_addresses AS
SELECT
    u.id as user_id,
    u.email,
    a.*,
    ar.relationship_type,
    ar.is_active
FROM users u
    JOIN address_relationships ar ON ar.entity_id = u.id AND ar.entity_type = 'user'
    JOIN addresses a ON a.id = ar.address_id
WHERE ar.is_active = true;

CREATE OR REPLACE VIEW organizer_addresses AS
SELECT
    op.id as organizer_id,
    op.company_name,
    u.email,
    a.*,
    ar.relationship_type,
    ar.is_active
FROM organizer_profiles op
    JOIN users u ON u.id = op.user_id
    JOIN address_relationships ar ON ar.entity_id = op.id AND ar.entity_type = 'organizer'
    JOIN addresses a ON a.id = ar.address_id
WHERE ar.is_active = true;

CREATE OR REPLACE VIEW venue_addresses AS
SELECT
    v.id as venue_id,
    v.name as venue_name,
    a.*,
    ar.relationship_type,
    ar.is_active
FROM venues v
    JOIN address_relationships ar ON ar.entity_id = v.id AND ar.entity_type = 'venue'
    JOIN addresses a ON a.id = ar.address_id
WHERE ar.is_active = true;

-- Add some data validation checks
DO $$
DECLARE
    user_count INTEGER;
    organizer_count INTEGER;
    venue_count INTEGER;
    address_count INTEGER;
    relationship_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO user_count
    FROM user_profiles
    WHERE
        (street_name IS NOT NULL AND street_name != '')
        OR (city IS NOT NULL AND city != '')
        OR (postal_code IS NOT NULL AND postal_code != '');

    SELECT COUNT(*)
    INTO organizer_count
    FROM organizer_profiles
    WHERE
        (business_address IS NOT NULL AND business_address != '')
        OR (business_city IS NOT NULL AND business_city != '')
        OR (business_postal_code IS NOT NULL AND business_postal_code != '');

    SELECT COUNT(*)
    INTO venue_count
    FROM venues
    WHERE
        address IS NOT NULL AND address != ''
        AND city IS NOT NULL AND city != '';

    SELECT COUNT(*)
    INTO address_count
    FROM addresses;
    SELECT COUNT(*)
    INTO relationship_count
    FROM address_relationships;

    RAISE NOTICE 'Migration Summary:';
RAISE NOTICE '- User profiles with addresses: %', user_count;
    RAISE NOTICE '- Organizer profiles with addresses: %', organizer_count;
    RAISE NOTICE '- Venues with addresses: %', venue_count;
    RAISE NOTICE '- Total addresses created: %', address_count;
    RAISE NOTICE '- Total relationships created: %', relationship_count;

IF address_count < (user_count + organizer_count + venue_count) THEN
        RAISE WARNING 'Address count is less than expected. Some addresses may not have been migrated properly.';
END
IF;

    IF relationship_count < address_count THEN
        RAISE WARNING 'Relationship count is less than address count. Some addresses may not be linked to entities.';
END
IF;
END $$;
