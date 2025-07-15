-- Migration: Remove legacy address columns from venues table
-- File: 012_remove_legacy_venue_address_columns.sql
-- Description: Remove old address, city, postal_code, country columns from venues table since we now use the address system

BEGIN;

    -- Drop the old address columns that are no longer needed
    -- The venues table now uses the standardized address system via address_relationships
    ALTER TABLE venues DROP COLUMN IF EXISTS address;
    ALTER TABLE venues DROP COLUMN IF EXISTS city;
    ALTER TABLE venues DROP COLUMN IF EXISTS postal_code;
    ALTER TABLE venues DROP COLUMN IF EXISTS country;

    -- Also drop the latitude and longitude columns from venues since they're now in the addresses table
    ALTER TABLE venues DROP COLUMN IF EXISTS latitude;
    ALTER TABLE venues DROP COLUMN IF EXISTS longitude;

    -- Add missing updated_at column for proper auditing
    ALTER TABLE venues ADD COLUMN
    IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_venues_updated_at
()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and create it
DROP TRIGGER IF EXISTS venues_updated_at_trigger
ON venues;
CREATE TRIGGER venues_updated_at_trigger
    BEFORE
UPDATE ON venues
    FOR EACH ROW
EXECUTE FUNCTION update_venues_updated_at
();

-- Add a comment to document the change
COMMENT ON TABLE venues IS 'Venues table now uses the standardized address system via address_relationships. No legacy address columns.';

COMMIT;
