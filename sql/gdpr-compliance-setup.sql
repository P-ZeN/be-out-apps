-- ============================================================================
-- GDPR Compliance Database Setup for Be-Out Apps
-- ============================================================================
-- This script adds necessary columns for legal consent tracking
-- Required for GDPR Article 7 compliance (proof of consent with timestamps)
-- Execute date: October 2, 2025
-- ============================================================================

-- Add legal consent tracking columns to user_profiles table
-- These columns track when users accepted various legal documents

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS privacy_policy_accepted BOOLEAN DEFAULT FALSE;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS terms_of_service_accepted BOOLEAN DEFAULT FALSE;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS terms_of_service_accepted_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- Grandfather existing users (mark them as having accepted terms)
-- This is required for users who registered before legal consent tracking
-- ============================================================================

UPDATE user_profiles SET
    terms_accepted = TRUE,
    terms_accepted_at = NOW(),
    privacy_policy_accepted = TRUE,
    privacy_policy_accepted_at = NOW(),
    terms_of_service_accepted = TRUE,
    terms_of_service_accepted_at = NOW()
WHERE terms_accepted IS NULL OR terms_accepted = FALSE;

-- ============================================================================
-- Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN user_profiles.terms_accepted IS 'GDPR Article 7: Records if user accepted Terms of Use (CGU)';
COMMENT ON COLUMN user_profiles.terms_accepted_at IS 'GDPR Article 7: Timestamp when Terms of Use were accepted';
COMMENT ON COLUMN user_profiles.privacy_policy_accepted IS 'GDPR Article 7: Records if user accepted Privacy Policy';
COMMENT ON COLUMN user_profiles.privacy_policy_accepted_at IS 'GDPR Article 7: Timestamp when Privacy Policy was accepted';
COMMENT ON COLUMN user_profiles.terms_of_service_accepted IS 'GDPR Article 7: Records if user accepted Terms of Service (CGV)';
COMMENT ON COLUMN user_profiles.terms_of_service_accepted_at IS 'GDPR Article 7: Timestamp when Terms of Service were accepted';

-- ============================================================================
-- Verification queries (run these to verify the setup)
-- ============================================================================

-- Check if columns were added successfully
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
    AND column_name IN (
        'terms_accepted',
        'terms_accepted_at',
        'privacy_policy_accepted',
        'privacy_policy_accepted_at',
        'terms_of_service_accepted',
        'terms_of_service_accepted_at'
    )
ORDER BY column_name;

-- Check existing user consent status
SELECT
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE terms_accepted = true) as users_with_terms_consent,
    COUNT(*) FILTER (WHERE privacy_policy_accepted = true) as users_with_privacy_consent,
    COUNT(*) FILTER (WHERE terms_of_service_accepted = true) as users_with_service_consent
FROM user_profiles;

-- ============================================================================
-- NOTES FOR OPERATORS:
-- ============================================================================
-- 1. These changes are required for GDPR Article 7 compliance
-- 2. All existing users are grandfathered (marked as having consented)
-- 3. New users must explicitly consent during registration
-- 4. Consent timestamps are stored for audit purposes
-- 5. User account deletion is handled by existing DELETE endpoint in profile.js
-- ============================================================================
