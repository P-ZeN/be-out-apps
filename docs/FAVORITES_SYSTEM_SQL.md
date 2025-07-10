# USER FAVORITES SYSTEM - DATABASE SETUP

## 📋 **REQUIRED SQL STATEMENTS**

### **OPERATION**: Create user_favorites table
### **TABLE(S)**: user_favorites (new table)
### **SAFETY**: New table creation - safe operation

```sql
-- Create user_favorites table to store user's saved events
CREATE TABLE user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure a user can only favorite an event once
    UNIQUE(user_id, event_id)
);

-- Create index for faster queries
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_event_id ON user_favorites(event_id);
CREATE INDEX idx_user_favorites_created_at ON user_favorites(created_at DESC);
```

### **OPERATION**: Add favorites_count column to events table
### **TABLE(S)**: events
### **SAFETY**: Adding column with default value - safe operation

```sql
-- Add favorites_count column to events table to track popularity
ALTER TABLE events
ADD COLUMN favorites_count INTEGER DEFAULT 0 NOT NULL;

-- Create index for favorites_count for sorting by popularity
CREATE INDEX idx_events_favorites_count ON events(favorites_count DESC);
```

### **OPERATION**: Create trigger function to maintain favorites_count
### **TABLE(S)**: events, user_favorites
### **SAFETY**: Trigger creation - maintains data consistency

```sql
-- Function to update favorites_count when favorites are added/removed
CREATE OR REPLACE FUNCTION update_event_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment favorites_count when a favorite is added
        UPDATE events
        SET favorites_count = favorites_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.event_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement favorites_count when a favorite is removed
        UPDATE events
        SET favorites_count = favorites_count - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.event_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update favorites_count
CREATE TRIGGER trigger_update_favorites_count_insert
    AFTER INSERT ON user_favorites
    FOR EACH ROW EXECUTE FUNCTION update_event_favorites_count();

CREATE TRIGGER trigger_update_favorites_count_delete
    AFTER DELETE ON user_favorites
    FOR EACH ROW EXECUTE FUNCTION update_event_favorites_count();
```

### **OPERATION**: Initialize favorites_count for existing events
### **TABLE(S)**: events
### **SAFETY**: Update with calculated values - safe operation

```sql
-- Initialize favorites_count for existing events (set to 0 since we're starting fresh)
UPDATE events
SET favorites_count = 0
WHERE favorites_count IS NULL;

-- If you have existing favorites data somewhere, use this query instead:
-- UPDATE events
-- SET favorites_count = (
--     SELECT COUNT(*)
--     FROM user_favorites uf
--     WHERE uf.event_id = events.id
-- );
```

### **OPERATION**: Create admin logging function for favorites (optional)
### **TABLE(S)**: admin_actions (if exists)
### **SAFETY**: Function creation - optional enhancement

```sql
-- Optional: Create function to log favorite actions (for admin analytics)
CREATE OR REPLACE FUNCTION log_favorite_action(
    p_user_id INTEGER,
    p_event_id INTEGER,
    p_action VARCHAR(20)
)
RETURNS VOID AS $$
BEGIN
    -- Only log if admin_actions table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_actions') THEN
        INSERT INTO admin_actions (
            admin_user_id,
            action_type,
            target_type,
            target_id,
            description,
            metadata
        ) VALUES (
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
            )::TEXT
        );
    END IF;
END;
$$ LANGUAGE plpgsql;
```

## 🔍 **VERIFICATION QUERIES**

After running the above SQL, verify the setup with these queries:

```sql
-- Check if user_favorites table was created correctly
\d user_favorites

-- Check if favorites_count column was added to events
\d events

-- Check if triggers were created
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%favorites%';

-- Test the setup with sample data (optional)
-- INSERT INTO user_favorites (user_id, event_id) VALUES (1, 1);
-- SELECT favorites_count FROM events WHERE id = 1;
```

## 🚨 **ROLLBACK STATEMENTS** (if needed)

```sql
-- Remove triggers
DROP TRIGGER IF EXISTS trigger_update_favorites_count_insert ON user_favorites;
DROP TRIGGER IF EXISTS trigger_update_favorites_count_delete ON user_favorites;

-- Remove function
DROP FUNCTION IF EXISTS update_event_favorites_count();
DROP FUNCTION IF EXISTS log_favorite_action(INTEGER, INTEGER, VARCHAR);

-- Remove column from events table
ALTER TABLE events DROP COLUMN IF EXISTS favorites_count;

-- Remove table
DROP TABLE IF EXISTS user_favorites;
```

---

**📝 EXECUTION ORDER:**
1. Create user_favorites table
2. Add favorites_count column to events
3. Create trigger function
4. Create triggers
5. Initialize favorites_count values
6. (Optional) Create logging function
7. Run verification queries

**⚠️ IMPORTANT:**
- Run each SQL block separately and verify success before proceeding
- Backup your database before running these statements
- Test with a small dataset first if possible
