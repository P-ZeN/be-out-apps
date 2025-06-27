-- Cleanup script for admin_actions table
-- Execute these statements to remove dummy/invalid data

-- STEP 1: Backup before cleanup (optional - create a backup table)
CREATE TABLE admin_actions_backup AS
SELECT *
FROM admin_actions;

-- STEP 2: Show what will be deleted (run this first to see what you're about to remove)
SELECT
    'Will delete favorites actions' as cleanup_action,
    COUNT(*) as records_to_delete
FROM admin_actions aa
    LEFT JOIN users u ON aa.admin_user_id = u.id
WHERE aa.action_type = 'user_favorite'
    OR aa.description LIKE '%favorite%'
    OR aa.description LIKE '%added event to favorites%'
    OR aa.description LIKE '%removed event from favorites%';

-- STEP 3: Show actions by non-admin users that will be deleted
SELECT
    'Will delete non-admin actions' as cleanup_action,
    COUNT(*) as records_to_delete
FROM admin_actions aa
    LEFT JOIN users u ON aa.admin_user_id = u.id
WHERE u.role != 'admin' OR u.role IS NULL;

-- STEP 4: Delete favorites-related dummy actions
DELETE FROM admin_actions
WHERE action_type = 'user_favorite'
    OR description LIKE '%favorite%'
    OR description LIKE '%added event to favorites%'
    OR description LIKE '%removed event from favorites%';

-- STEP 5: Delete actions by non-admin users (if any remain)
DELETE FROM admin_actions aa
WHERE admin_user_id IN (
    SELECT u.id
FROM users u
WHERE u.role != 'admin' OR u.role IS NULL
);

-- STEP 6: Verify cleanup - show remaining records
SELECT
    'Remaining admin actions after cleanup' as result,
    COUNT(*) as total_records
FROM admin_actions;

-- STEP 7: Show remaining actions by action type
SELECT
    action_type,
    COUNT(*) as count,
    MIN(created_at) as first_action,
    MAX(created_at) as last_action
FROM admin_actions
GROUP BY action_type
ORDER BY count DESC;

-- STEP 8: Verify all remaining actions are from real admins
SELECT
    aa.action_type,
    aa.description,
    aa.created_at,
    u.email as admin_email,
    u.role
FROM admin_actions aa
    JOIN users u ON aa.admin_user_id = u.id
ORDER BY aa.created_at DESC;

-- Note: If you want to undo the cleanup, you can restore from backup:
-- INSERT INTO admin_actions SELECT * FROM admin_actions_backup WHERE id NOT IN (SELECT id FROM admin_actions);
