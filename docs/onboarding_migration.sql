-- Migration SQL for Onboarding System
-- Run these statements in your PostgreSQL console

-- 1. Add onboarding_complete column to users table
ALTER TABLE users
ADD onboarding_complete BOOLEAN DEFAULT FALSE;

-- 2. Add address columns to user_profiles table
-- Note: first_name, last_name, phone, and date_of_birth already exist

ALTER TABLE user_profiles
ADD street_number VARCHAR(10);

ALTER TABLE user_profiles
ADD street_name VARCHAR(255);

ALTER TABLE user_profiles
ADD postal_code VARCHAR(20);

ALTER TABLE user_profiles
ADD city VARCHAR(100);

ALTER TABLE user_profiles
ADD country VARCHAR(100) DEFAULT 'France';

-- 3. Remove bio column from user_profiles (not needed for ticket sales)
ALTER TABLE user_profiles DROP COLUMN IF EXISTS bio;

-- 4. Update existing users to have onboarding_complete = false
UPDATE users SET onboarding_complete = FALSE WHERE onboarding_complete IS NULL;

-- 5. Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'onboarding_complete';

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
    AND column_name IN ('first_name', 'last_name', 'phone', 'date_of_birth', 'street_number', 'street_name', 'postal_code', 'city', 'country')
ORDER BY column_name;
