-- Migration: Create standardized address system
-- This migration creates a new centralized address management system
-- to replace scattered address fields across multiple tables

-- Create addresses table with international standards
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Address Lines (flexible for international formats)
    address_line_1 VARCHAR(255) NOT NULL,          -- Street number and name
    address_line_2 VARCHAR(255),                   -- Apartment, suite, unit, etc.
    address_line_3 VARCHAR(255),                   -- Additional info (rare, but some countries need it)

    -- Location Hierarchy
    locality VARCHAR(100) NOT NULL,                -- City/Town/Village
    administrative_area VARCHAR(100),              -- State/Province/Region
    postal_code VARCHAR(20),                       -- ZIP/Postal code
    country_code CHAR(2) NOT NULL DEFAULT 'FR',   -- ISO 3166-1 alpha-2

    -- Geocoding
    latitude DECIMAL(10,8),                        -- GPS coordinates
    longitude DECIMAL(11,8),

    -- Metadata
    address_type VARCHAR(50) NOT NULL,             -- 'home', 'business', 'billing', 'shipping', 'venue'
    label VARCHAR(100),                            -- User-friendly name: "Home", "Work", "Main Office"
    is_primary BOOLEAN DEFAULT FALSE,              -- Primary address for this entity/type
    is_verified BOOLEAN DEFAULT FALSE,             -- Address verification status

    -- Additional fields for better UX
    formatted_address TEXT,                        -- Full formatted address for display
    place_id VARCHAR(255),                         -- Google Places ID or similar for validation

    -- Audit
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_country_code CHECK (country_code ~ '^[A-Z]{2}$'),
    CONSTRAINT valid_address_type CHECK (address_type IN ('home', 'business', 'billing', 'shipping', 'venue', 'event'))
);

-- Create address relationships table
CREATE TABLE address_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,              -- 'user', 'organizer', 'venue', 'event'
    entity_id UUID NOT NULL,                       -- ID of the related entity
    relationship_type VARCHAR(50) NOT NULL,        -- 'primary', 'billing', 'shipping', 'business', 'venue_location'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique relationships per entity/type combination
    UNIQUE(entity_type, entity_id, relationship_type),

    -- Constraints
    CONSTRAINT valid_entity_type CHECK (entity_type IN ('user', 'organizer', 'venue', 'event')),
    CONSTRAINT valid_relationship_type CHECK (relationship_type IN ('primary', 'billing', 'shipping', 'business', 'venue_location', 'event_location'))
);

-- Create indexes for performance
CREATE INDEX idx_addresses_country_code ON addresses(country_code);
CREATE INDEX idx_addresses_locality ON addresses(locality);
CREATE INDEX idx_addresses_postal_code ON addresses(postal_code);
CREATE INDEX idx_addresses_type ON addresses(address_type);
CREATE INDEX idx_addresses_coordinates ON addresses(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Address relationships indexes
CREATE INDEX idx_address_relationships_entity ON address_relationships(entity_type, entity_id);
CREATE INDEX idx_address_relationships_address ON address_relationships(address_id);
CREATE INDEX idx_address_relationships_type ON address_relationships(relationship_type);

-- Update trigger for addresses table
CREATE OR REPLACE FUNCTION update_address_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_addresses_updated_at
    BEFORE UPDATE ON addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_address_updated_at();

-- Helper function to format address
CREATE OR REPLACE FUNCTION format_address(
    p_address_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    result TEXT;
BEGIN
    SELECT CONCAT_WS(', ',
        a.address_line_1,
        NULLIF(a.address_line_2, ''),
        NULLIF(a.address_line_3, ''),
        a.locality,
        NULLIF(a.administrative_area, ''),
        NULLIF(a.postal_code, ''),
        a.country_code
    )
    INTO result
    FROM addresses a
    WHERE a.id = p_address_id;

    RETURN result;
END;
$$;

-- Helper function to get all addresses for an entity
CREATE OR REPLACE FUNCTION get_entity_addresses(
    p_entity_type VARCHAR(50),
    p_entity_id UUID
)
RETURNS TABLE (
    id UUID,
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    address_line_3 VARCHAR(255),
    locality VARCHAR(100),
    administrative_area VARCHAR(100),
    postal_code VARCHAR(20),
    country_code CHAR(2),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    address_type VARCHAR(50),
    label VARCHAR(100),
    is_primary BOOLEAN,
    is_verified BOOLEAN,
    formatted_address TEXT,
    relationship_type VARCHAR(50),
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.address_line_1,
        a.address_line_2,
        a.address_line_3,
        a.locality,
        a.administrative_area,
        a.postal_code,
        a.country_code,
        a.latitude,
        a.longitude,
        a.address_type,
        a.label,
        a.is_primary,
        a.is_verified,
        COALESCE(a.formatted_address, format_address(a.id)) as formatted_address,
        ar.relationship_type,
        a.created_at
    FROM addresses a
    JOIN address_relationships ar ON a.id = ar.address_id
    WHERE ar.entity_type = p_entity_type
    AND ar.entity_id = p_entity_id
    AND ar.is_active = true
    ORDER BY a.is_primary DESC, a.created_at ASC;
END;
$$;

-- Helper function to get primary address for an entity
CREATE OR REPLACE FUNCTION get_primary_address(
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_relationship_type VARCHAR(50) DEFAULT 'primary'
)
RETURNS TABLE (
    id UUID,
    formatted_address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        COALESCE(a.formatted_address, format_address(a.id)) as formatted_address,
        a.latitude,
        a.longitude
    FROM addresses a
    JOIN address_relationships ar ON a.id = ar.address_id
    WHERE ar.entity_type = p_entity_type
    AND ar.entity_id = p_entity_id
    AND ar.relationship_type = p_relationship_type
    AND ar.is_active = true
    ORDER BY a.is_primary DESC, a.created_at ASC
    LIMIT 1;
END;
$$;

-- Function to set primary address
CREATE OR REPLACE FUNCTION set_primary_address(
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_address_id UUID,
    p_relationship_type VARCHAR(50) DEFAULT 'primary'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- First, unset all primary flags for this entity/relationship type
    UPDATE addresses
    SET is_primary = FALSE
    FROM address_relationships ar
    WHERE addresses.id = ar.address_id
    AND ar.entity_type = p_entity_type
    AND ar.entity_id = p_entity_id
    AND ar.relationship_type = p_relationship_type;

    -- Then set the new primary
    UPDATE addresses
    SET is_primary = TRUE
    FROM address_relationships ar
    WHERE addresses.id = ar.address_id
    AND addresses.id = p_address_id
    AND ar.entity_type = p_entity_type
    AND ar.entity_id = p_entity_id
    AND ar.relationship_type = p_relationship_type;

    RETURN FOUND;
END;
$$;

-- Comments for documentation
COMMENT ON TABLE addresses IS 'Centralized address storage following international standards';
COMMENT ON TABLE address_relationships IS 'Links addresses to various entities (users, organizers, venues, events)';
COMMENT ON COLUMN addresses.address_line_1 IS 'Primary address line - street number and name';
COMMENT ON COLUMN addresses.address_line_2 IS 'Secondary address line - apartment, suite, unit, etc.';
COMMENT ON COLUMN addresses.locality IS 'City, town, or village name';
COMMENT ON COLUMN addresses.administrative_area IS 'State, province, or region';
COMMENT ON COLUMN addresses.country_code IS 'ISO 3166-1 alpha-2 country code (e.g., FR, US, DE)';
COMMENT ON COLUMN addresses.address_type IS 'Category of address: home, business, billing, shipping, venue, event';
COMMENT ON COLUMN addresses.label IS 'User-friendly label for the address';
COMMENT ON COLUMN addresses.is_primary IS 'Whether this is the primary address for its type';
COMMENT ON COLUMN addresses.is_verified IS 'Whether the address has been verified through postal service or geocoding';
COMMENT ON COLUMN addresses.formatted_address IS 'Pre-formatted address string for display purposes';
COMMENT ON COLUMN addresses.place_id IS 'External service place ID (Google Places, etc.) for validation and autocomplete';
