-- Fix user language preferences for email notifications

-- OPERATION: Update user profiles with proper language preferences based on current behavior
-- TABLE(S): user_profiles
-- SAFETY: Updates existing records, preserves user data, adds language preferences

-- First, let's see the current state
SELECT
    COUNT(*) as total_users,
    COUNT(preferred_language) as users_with_language,
    COUNT(*) - COUNT(preferred_language) as users_without_language
FROM user_profiles;

-- Update users without preferred_language to use French (the app default)
-- This affects existing users who registered before we added the language column
UPDATE user_profiles
SET preferred_language = 'fr', updated_at = NOW()
WHERE preferred_language IS NULL;

-- Verify the updates
SELECT
    preferred_language,
    COUNT(*) as user_count
FROM user_profiles
GROUP BY preferred_language
ORDER BY user_count DESC;

-- Show a few example records
SELECT
    user_id,
    first_name,
    last_name,
    preferred_language,
    created_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 5;
