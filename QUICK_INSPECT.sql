-- Quick inspection of admin_actions data
-- Run these one by one to understand what's in the table

-- 1. Total count
SELECT COUNT(*)
FROM admin_actions;

-- 2. Actions by type
SELECT action_type, COUNT(*)
FROM admin_actions
GROUP BY action_type
ORDER BY COUNT(*) DESC;

-- 3. Users and their roles who have admin_actions
SELECT u.email, u.role, COUNT(*) as actions
FROM admin_actions aa
    LEFT JOIN users u ON aa.admin_user_id = u.id
GROUP BY u.email, u.role
ORDER BY actions DESC;

-- 4. Recent actions (last 5)
SELECT aa.action_type, aa.description, u.email, u.role, aa.created_at
FROM admin_actions aa
    LEFT JOIN users u ON aa.admin_user_id = u.id
ORDER BY aa.created_at DESC
LIMIT 5;
