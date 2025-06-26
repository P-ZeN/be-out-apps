-- USER FAVORITES SYSTEM - DATABASE SETUP FOR POSTGRESQL
-- Execute these statements in order to implement the favorites system
-- NOTE: This SQL is written specifically for PostgreSQL

-- ============================================================================
-- STEP 1: Create user_favorites table
-- ============================================================================

CREATE TABLE user_favorites
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP
    WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
    WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE
    (user_id, event_id)
);

    CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
    CREATE INDEX idx_user_favorites_event_id ON user_favorites(event_id);
    CREATE INDEX idx_user_favorites_created_at ON user_favorites(created_at DESC);

    -- ============================================================================
    -- STEP 2: Add favorites_count column to events table
    -- ============================================================================

    ALTER TABLE events ADD COLUMN favorites_count INTEGER DEFAULT 0 NOT NULL;

    CREATE INDEX idx_events_favorites_count ON events(favorites_count DESC);

    -- ============================================================================
    -- STEP 3: Create trigger function to maintain favorites_count
    -- ============================================================================

    CREATE OR REPLACE FUNCTION update_event_favorites_count
    ()
RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP = 'INSERT' THEN
        UPDATE events
        SET favorites_count = favorites_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.event_id;
        RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
        UPDATE events
        SET favorites_count = favorites_count - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.event_id;
        RETURN OLD;
    END
    IF;
    RETURN NULL;
    END;
$$ LANGUAGE plpgsql;

    CREATE TRIGGER trigger_update_favorites_count_insert
    AFTER
    INSERT ON
    user_favorites
    FOR
    EACH
    ROW
    EXECUTE FUNCTION update_event_favorites_count
    ();

    CREATE TRIGGER trigger_update_favorites_count_delete
    AFTER
    DELETE ON user_favorites
    FOR EACH
    ROW
    EXECUTE FUNCTION update_event_favorites_count
    ();

    -- ============================================================================
    -- STEP 4: Initialize favorites_count for existing events
    -- ============================================================================

    UPDATE events SET favorites_count = 0 WHERE favorites_count IS NULL;

    -- ============================================================================
    -- STEP 5: Create admin logging function (optional)
    -- ============================================================================

    CREATE OR REPLACE FUNCTION log_favorite_action
    (
    p_user_id UUID,
    p_event_id UUID,
    p_action VARCHAR
    (20)
)
RETURNS VOID AS $$
    BEGIN
        IF EXISTS (SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'admin_actions') THEN
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
                p_user_id,
                'user_favorite',
                'event',
                p_event_id,
                CASE
                WHEN p_action = 'add' THEN 'User added event to favorites'
                WHEN p_action = 'remove' THEN 'User removed event from favorites'
                ELSE 'User favorite action'
            END,
                json_build_object(
                'action', p_action,
                'user_id', p_user_id,
                'event_id', p_event_id,
                'timestamp', NOW()
            )
        ::TEXT
        );
    END
    IF;
END;
$$ LANGUAGE plpgsql;

    -- ============================================================================
    -- VERIFICATION QUERIES
    -- ============================================================================

    SELECT trigger_name, event_object_table, action_timing, event_manipulation
    FROM information_schema.triggers
    WHERE trigger_name LIKE '%favorites%';

    -- ============================================================================
    -- TEST QUERIES (run these to test the system)
    -- ============================================================================

    -- Check if user_favorites table exists and has correct structure
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'user_favorites'
    ORDER BY ordinal_position;

    -- Check if favorites_count column was added to events table
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'favorites_count';

-- Test the trigger functionality (replace with actual user_id and event_id from your database)
-- INSERT INTO user_favorites (user_id, event_id) VALUES ('your-user-uuid', 'your-event-uuid');
-- SELECT favorites_count FROM events WHERE id = 'your-event-uuid';
-- DELETE FROM user_favorites WHERE user_id = 'your-user-uuid' AND event_id = 'your-event-uuid';
-- SELECT favorites_count FROM events WHERE id = 'your-event-uuid';
