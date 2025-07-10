# Address Standardization Proposal

## Current State Analysis

The current address management has the following issues:

### User Profiles Table
```sql
street_number VARCHAR(10)
street_name VARCHAR(255)
postal_code VARCHAR(20)
city VARCHAR(100)
country VARCHAR(100) DEFAULT 'France'
```

### Organizer Profiles Table
```sql
business_address TEXT
business_city VARCHAR(100)
business_postal_code VARCHAR(20)
business_country VARCHAR(100) DEFAULT 'France'
```

### Venues Table
```sql
address TEXT NOT NULL
city VARCHAR(100) NOT NULL
postal_code VARCHAR(20)
country VARCHAR(100) DEFAULT 'France'
latitude NUMERIC(10,8)
longitude NUMERIC(11,8)
```

## Problems Identified

1. **Inconsistent field naming** across tables
2. **Different data types** for similar fields
3. **No address type classification** (billing, shipping, business, etc.)
4. **No support for multiple addresses** per entity
5. **Missing critical fields** like administrative area (state/province)
6. **Non-standard country representation** (should use ISO codes)
7. **No address validation** or standardization
8. **Duplication of address logic** across tables

## Proposed Solution: Unified Address System

### New Addresses Table

```sql
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

    -- Audit
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_country_code CHECK (country_code ~ '^[A-Z]{2}$'),
    CONSTRAINT valid_address_type CHECK (address_type IN ('home', 'business', 'billing', 'shipping', 'venue', 'event'))
);

-- Indexes for performance
CREATE INDEX idx_addresses_country_code ON addresses(country_code);
CREATE INDEX idx_addresses_locality ON addresses(locality);
CREATE INDEX idx_addresses_postal_code ON addresses(postal_code);
CREATE INDEX idx_addresses_type ON addresses(address_type);
CREATE INDEX idx_addresses_coordinates ON addresses(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

### Address Relationships Table

```sql
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

-- Indexes
CREATE INDEX idx_address_relationships_entity ON address_relationships(entity_type, entity_id);
CREATE INDEX idx_address_relationships_address ON address_relationships(address_id);
```

## Migration Strategy

### Phase 1: Create New Tables
1. Create `addresses` table
2. Create `address_relationships` table
3. Add helper functions for address operations

### Phase 2: Data Migration
1. Migrate existing user profile addresses
2. Migrate organizer business addresses
3. Migrate venue addresses
4. Validate migrated data

### Phase 3: Update Application Code
1. Create Address service/model
2. Update user onboarding to use new address system
3. Update organizer registration
4. Update venue management
5. Update event creation (for event locations)

### Phase 4: Cleanup
1. Remove old address fields from existing tables
2. Update foreign key constraints
3. Clean up unused code

## Benefits

### 1. **Standardization**
- Consistent address format across all entities
- International address standard compliance
- Proper country code usage (ISO 3166-1)

### 2. **Flexibility**
- Multiple addresses per entity (home, work, billing, shipping)
- Support for complex address formats
- Easy to extend with new address types

### 3. **Data Quality**
- Address validation capabilities
- Geocoding integration ready
- Verification status tracking

### 4. **Performance**
- Proper indexing for common queries
- Efficient relationship lookups
- Geographic queries support

### 5. **User Experience**
- Multiple shipping addresses
- Address book functionality
- Auto-complete integration ready
- Map integration ready

### 6. **Business Features**
- Better shipping management
- Tax calculation by location
- Geographic analytics
- Venue location services

## Implementation Examples

### User with Multiple Addresses
```sql
-- User's home address
INSERT INTO addresses (address_line_1, locality, postal_code, country_code, address_type, label, is_primary)
VALUES ('123 Rue de la Paix', 'Paris', '75001', 'FR', 'home', 'Home', true);

-- User's work address
INSERT INTO addresses (address_line_1, locality, postal_code, country_code, address_type, label)
VALUES ('456 Avenue des Champs-Élysées', 'Paris', '75008', 'FR', 'business', 'Work');

-- Link to user
INSERT INTO address_relationships (address_id, entity_type, entity_id, relationship_type)
VALUES
    (address_id_1, 'user', user_id, 'primary'),
    (address_id_2, 'user', user_id, 'business');
```

### Organizer with Business Address
```sql
-- Business address
INSERT INTO addresses (address_line_1, locality, postal_code, country_code, address_type, label, is_primary)
VALUES ('789 Boulevard Saint-Germain', 'Paris', '75007', 'FR', 'business', 'Main Office', true);

-- Link to organizer
INSERT INTO address_relationships (address_id, entity_type, entity_id, relationship_type)
VALUES (address_id, 'organizer', organizer_id, 'business');
```

### Venue Address
```sql
-- Venue location
INSERT INTO addresses (address_line_1, locality, postal_code, country_code, address_type, latitude, longitude)
VALUES ('1 Place du Trocadéro', 'Paris', '75016', 'FR', 'venue', 48.8619, 2.2878);

-- Link to venue
INSERT INTO address_relationships (address_id, entity_type, entity_id, relationship_type)
VALUES (address_id, 'venue', venue_id, 'venue_location');
```

## Database Helper Functions

```sql
-- Get all addresses for an entity
CREATE OR REPLACE FUNCTION get_entity_addresses(
    p_entity_type VARCHAR(50),
    p_entity_id UUID
)
RETURNS TABLE (
    id UUID,
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    locality VARCHAR(100),
    postal_code VARCHAR(20),
    country_code CHAR(2),
    address_type VARCHAR(50),
    label VARCHAR(100),
    is_primary BOOLEAN,
    relationship_type VARCHAR(50)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.address_line_1,
        a.address_line_2,
        a.locality,
        a.postal_code,
        a.country_code,
        a.address_type,
        a.label,
        a.is_primary,
        ar.relationship_type
    FROM addresses a
    JOIN address_relationships ar ON a.id = ar.address_id
    WHERE ar.entity_type = p_entity_type
    AND ar.entity_id = p_entity_id
    AND ar.is_active = true
    ORDER BY a.is_primary DESC, a.created_at ASC;
END;
$$;

-- Get primary address for an entity
CREATE OR REPLACE FUNCTION get_primary_address(
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_relationship_type VARCHAR(50) DEFAULT 'primary'
)
RETURNS TABLE (
    id UUID,
    full_address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        CONCAT_WS(', ',
            a.address_line_1,
            NULLIF(a.address_line_2, ''),
            a.locality,
            NULLIF(a.postal_code, ''),
            a.country_code
        ) as full_address,
        a.latitude,
        a.longitude
    FROM addresses a
    JOIN address_relationships ar ON a.id = ar.address_id
    WHERE ar.entity_type = p_entity_type
    AND ar.entity_id = p_entity_id
    AND ar.relationship_type = p_relationship_type
    AND ar.is_active = true
    ORDER BY a.is_primary DESC
    LIMIT 1;
END;
$$;
```

## API Endpoints Design

### Address Management
- `GET /api/addresses` - Get user's addresses
- `POST /api/addresses` - Create new address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address
- `POST /api/addresses/:id/set-primary` - Set as primary address

### Address Validation
- `POST /api/addresses/validate` - Validate address format
- `POST /api/addresses/geocode` - Get coordinates for address
- `POST /api/addresses/verify` - Verify address exists

## Updated Onboarding Flow

The onboarding component should be updated to:

1. **Collect primary address** during registration
2. **Support address validation** with external services
3. **Allow multiple address types** selection
4. **Integrate geocoding** for location services
5. **Provide address suggestions** via autocomplete

This standardization will provide a much more robust and flexible address management system that can easily support international users, multiple addresses, shipping management, and location-based services.
