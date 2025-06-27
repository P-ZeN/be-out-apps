-- Inspect admin_actions table to understand the current data
-- Execute these queries to see what's actually in the admin_actions table

-- 1. Check total count of admin_actions
SELECT COUNT(*) as total_admin_actions
FROM admin_actions;

-- 2. Check how many actions per action_type
SELECT
    action_type,
    COUNT(*) as count,
    MIN(created_at) as first_occurrence,
    MAX(created_at) as last_occurrence
FROM admin_actions
GROUP BY action_type
ORDER BY count DESC;

-- 3. Check which users are in admin_actions and their roles
SELECT
    aa.admin_user_id,
    u.email,
    u.role,
    COUNT(*) as action_count,
    MIN(aa.created_at) as first_action,
    MAX(aa.created_at) as last_action
FROM admin_actions aa
    LEFT JOIN users u ON aa.admin_user_id = u.id
GROUP BY aa.admin_user_id, u.email, u.role
ORDER BY action_count DESC;

-- 4. Sample of recent admin_actions (last 10)
SELECT
    aa.id,
    aa.action_type,
    aa.target_type,
    aa.description,
    aa.created_at,
    u.email as admin_email,
    u.role as admin_role
FROM admin_actions aa
    LEFT JOIN users u ON aa.admin_user_id = u.id
ORDER BY aa.created_at DESC
LIMIT 10;

-- 5. Check for favorites-related actions (likely dummy data)
SELECT
    COUNT
(*) as favorites_actions,
    COUNT
(CASE WHEN u.role = 'admin' THEN 1
END) as favorites_by_admins,
    COUNT
(CASE WHEN u.role != 'admin' OR u.role IS NULL THEN 1
END) as favorites_by_non_admins
FROM admin_actions aa
LEFT JOIN users u ON aa.admin_user_id = u.id
WHERE aa.action_type = 'user_favorite' OR aa.description LIKE '%favorite%';

-- 6. Check for actions by actual admin users vs non-admin users
SELECT
    CASE
        WHEN u.role = 'admin' THEN 'Real Admin Actions'
        WHEN u.role IS NOT NULL THEN 'Non-Admin User Actions'
        ELSE 'Unknown User Actions'
    END as action_category,
    COUNT(*) as count
FROM admin_actions aa
    LEFT JOIN users u ON aa.admin_user_id = u.id
GROUP BY u.role
ORDER BY count DESC;
