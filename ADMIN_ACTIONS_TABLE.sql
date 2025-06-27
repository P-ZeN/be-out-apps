-- Create admin_actions table for logging admin activities
-- Execute this to create the admin audit logging table

CREATE TABLE
IF NOT EXISTS admin_actions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    admin_user_id UUID NOT NULL REFERENCES users
(id) ON
DELETE CASCADE,
    action_type VARCHAR(100)
NOT NULL, -- 'create', 'update', 'delete', 'view', 'moderate', etc.
    target_type VARCHAR
(50), -- 'user', 'event', 'booking', 'payment', etc.
    target_id UUID, -- ID of the target entity
    description TEXT, -- Human readable description of the action
    metadata JSONB, -- Additional data about the action
    ip_address INET, -- IP address of the admin
    user_agent TEXT, -- Browser user agent
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX
IF NOT EXISTS idx_admin_actions_admin_user_id ON admin_actions
(admin_user_id);
CREATE INDEX
IF NOT EXISTS idx_admin_actions_action_type ON admin_actions
(action_type);
CREATE INDEX
IF NOT EXISTS idx_admin_actions_target_type ON admin_actions
(target_type);
CREATE INDEX
IF NOT EXISTS idx_admin_actions_target_id ON admin_actions
(target_id);
CREATE INDEX
IF NOT EXISTS idx_admin_actions_created_at ON admin_actions
(created_at DESC);

-- Insert some sample admin actions for testing
INSERT INTO admin_actions
    (admin_user_id, action_type, target_type, target_id, description, metadata)
SELECT
    u.id,
    'view',
    'dashboard',
    NULL,
    'Admin viewed dashboard',
    json_build_object('section', 'overview')
FROM users u
WHERE u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO admin_actions
    (admin_user_id, action_type, target_type, target_id, description, metadata)
SELECT
    u.id,
    'view',
    'users',
    NULL,
    'Admin viewed users list',
    json_build_object('page', 1, 'limit', 10)
FROM users u
WHERE u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO admin_actions
    (admin_user_id, action_type, target_type, target_id, description, metadata)
SELECT
    u.id,
    'create',
    'event',
    uuid_generate_v4(),
    'Admin created new event',
    json_build_object('event_name', 'Sample Event', 'venue', 'Test Venue')
FROM users u
WHERE u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;
