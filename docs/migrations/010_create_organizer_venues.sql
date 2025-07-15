-- Migration: Create organizer-specific venues with address standardization
-- File: 010_create_organizer_venues.sql
-- Description: Add organizer_id to venues table and migrate to use address system

BEGIN;

    -- Add organizer_id to venues table (NOT NULL for unique ownership)
    ALTER TABLE venues ADD COLUMN organizer_id UUID NOT NULL;

    -- Add foreign key constraint
    ALTER TABLE venues ADD CONSTRAINT venues_organizer_id_fkey
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE;

    -- Create index for performance
    CREATE INDEX idx_venues_organizer_id ON venues(organizer_id);

    -- For existing venues (if any), assign them to the first organizer or handle manually
    -- You may need to run: UPDATE venues SET organizer_id = (SELECT id FROM users WHERE role = 'organizer' LIMIT 1) WHERE organizer_id IS NULL;

    -- Update venues to use the new address system
    -- First, create addresses for existing venues
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
        is_verified
        )
    SELECT
        v.address,
        v.city,
        v.postal_code,
        CASE
        WHEN v.country = 'France' THEN 'FR'
        WHEN v.country = 'Spain' THEN 'ES'
        WHEN v.country = 'Italy' THEN 'IT'
        WHEN v.country = 'Germany' THEN 'DE'
        WHEN v.country = 'United Kingdom' THEN 'GB'
        ELSE 'FR' -- Default to France
    END,
        v.latitude,
        v.longitude,
        'venue',
        v.name,
        false
    FROM venues v
    WHERE NOT EXISTS (
    SELECT 1
    FROM address_relationships ar
    WHERE ar.entity_type = 'venue' AND ar.entity_id = v.id
);

    -- Create address relationships for existing venues
    INSERT INTO address_relationships
        (
        address_id,
        entity_type,
        entity_id,
        relationship_type,
        is_active
        )
    SELECT
        a.id,
        'venue',
        v.id,
        'venue_location',
        true
    FROM venues v
        JOIN addresses a ON (
    a.address_line_1 = v.address AND
            a.locality = v.city AND
            a.address_type = 'venue'
)
    WHERE NOT EXISTS (
    SELECT 1
    FROM address_relationships ar
    WHERE ar.entity_type = 'venue' AND ar.entity_id = v.id
);

    -- Add venue management functions
    CREATE OR REPLACE FUNCTION get_organizer_venues
    (p_organizer_id UUID)
RETURNS TABLE
    (
    id UUID,
    name VARCHAR
    (255),
    capacity INTEGER,
    organizer_id UUID,
    created_at TIMESTAMPTZ,
    address_line_1 VARCHAR
    (255),
    address_line_2 VARCHAR
    (255),
    locality VARCHAR
    (100),
    administrative_area VARCHAR
    (100),
    postal_code VARCHAR
    (20),
    country_code CHAR
    (2),
    latitude DECIMAL
    (10,8),
    longitude DECIMAL
    (11,8),
    formatted_address TEXT
) LANGUAGE plpgsql AS $$
    BEGIN
        RETURN QUERY
        SELECT
            v.id,
            v.name,
            v.capacity,
            v.organizer_id,
            v.created_at,
            a.address_line_1,
            a.address_line_2,
            a.locality,
            a.administrative_area,
            a.postal_code,
            a.country_code,
            a.latitude,
            a.longitude,
            format_address(a.id) as formatted_address
        FROM venues v
            LEFT JOIN address_relationships ar ON (ar.entity_type = 'venue' AND ar.entity_id = v.id)
            LEFT JOIN addresses a ON a.id = ar.address_id
        WHERE v.organizer_id = p_organizer_id
        ORDER BY v.created_at DESC;
    END;
    $$;

COMMIT;
