-- Migration: Add updated_at column and trigger to venues table
-- File: 013_add_venues_updated_at_column.sql
-- Description: Add missing updated_at column and trigger to venues table for proper auditing

BEGIN;

    -- Add missing updated_at column for proper auditing
    ALTER TABLE venues ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

    -- Create a trigger function to automatically update the updated_at column
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

-- Add a comment to document the updated_at column
COMMENT ON COLUMN venues.updated_at IS 'Automatically updated timestamp when venue record is modified';

COMMIT;
