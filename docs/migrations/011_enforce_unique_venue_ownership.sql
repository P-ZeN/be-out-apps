-- Migration: Enforce unique venue ownership
-- File: 011_enforce_unique_venue_ownership.sql
-- Description: Update venues table to enforce NOT NULL organizer_id and remove shared venue logic

BEGIN;

    -- Step 1: Update any venues that might have NULL organizer_id
    -- Assign them to the first available organizer or handle as needed
    UPDATE venues
SET organizer_id = (
    SELECT id
    FROM users
    WHERE role = 'organizer'
    ORDER BY created_at ASC
    LIMIT 1
)
WHERE organizer_id
    IS NULL;

    -- Step 2: Add NOT NULL constraint to organizer_id
    ALTER TABLE venues ALTER COLUMN organizer_id
    SET
    NOT NULL;

    -- Step 3: Update the get_organizer_venues function to remove shared venue logic
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

-- Step 4: Add a comment to document the change
COMMENT ON COLUMN venues.organizer_id IS 'Each venue must have a unique owner (organizer). No shared venues allowed.';

COMMIT;
