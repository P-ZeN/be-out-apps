-- Create the log_admin_action PostgreSQL function
-- This function is called by the backend to log admin activities

CREATE OR REPLACE FUNCTION log_admin_action
(
    p_admin_user_id UUID,
    p_action_type VARCHAR
(100),
    p_target_type VARCHAR
(50),
    p_target_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_metadata TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO admin_actions
        (
        admin_user_id,
        action_type,
        target_type,
        target_id,
        description,
        metadata
        )
    VALUES
        (
            p_admin_user_id,
            p_action_type,
            p_target_type,
            p_target_id,
            p_description,
            p_metadata::JSONB
    );
END;
$$ LANGUAGE plpgsql;

-- Create an overloaded version with fewer parameters (for backward compatibility)
CREATE OR REPLACE FUNCTION log_admin_action
(
    p_admin_user_id UUID,
    p_action_type VARCHAR
(100),
    p_target_type VARCHAR
(50),
    p_description TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO admin_actions
        (
        admin_user_id,
        action_type,
        target_type,
        target_id,
        description
        )
    VALUES
        (
            p_admin_user_id,
            p_action_type,
            p_target_type,
            NULL,
            p_description
    );
END;
$$ LANGUAGE plpgsql;
