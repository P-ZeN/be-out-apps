-- Multi-Tier Pricing Integration: Database Schema Updates
-- Run this migration to add support for pricing categories and tiers in bookings

-- Add pricing category and tier tracking to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS pricing_category_id UUID,
ADD COLUMN IF NOT EXISTS pricing_tier_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS pricing_category_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS pricing_tier_name VARCHAR(255);

-- Add pricing information to individual tickets
ALTER TABLE booking_tickets
ADD COLUMN IF NOT EXISTS pricing_category_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS pricing_tier_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS tier_price NUMERIC(10,2);

-- Add foreign key constraint for pricing_category_id (if categories table exists)
-- ALTER TABLE bookings ADD CONSTRAINT fk_bookings_pricing_category
-- FOREIGN KEY (pricing_category_id) REFERENCES categories(id);

-- Create index for better performance on category lookups
CREATE INDEX IF NOT EXISTS idx_bookings_pricing_category ON bookings(pricing_category_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pricing_tier ON bookings(pricing_tier_id);

-- Update existing bookings to have default tier information (optional)
-- This helps with backwards compatibility
UPDATE bookings
SET
    pricing_category_name = 'Standard',
    pricing_tier_name = 'Regular'
WHERE pricing_category_name IS NULL
  AND booking_status IN ('confirmed', 'pending');

-- Update existing tickets with default tier information
UPDATE booking_tickets bt
SET
    pricing_category_name = 'Standard',
    pricing_tier_name = 'Regular',
    tier_price = b.unit_price
FROM bookings b
WHERE bt.booking_id = b.id
  AND bt.pricing_category_name IS NULL
  AND b.booking_status IN ('confirmed', 'pending');
