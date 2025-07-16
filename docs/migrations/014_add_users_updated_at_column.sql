-- Add updated_at column to users table
-- Date: 2025-01-16

-- Add updated_at column to users table
ALTER TABLE users ADD COLUMN updated_at timestamp
with time zone DEFAULT CURRENT_TIMESTAMP;

-- Create trigger to automatically update updated_at when records are modified
CREATE OR REPLACE FUNCTION update_updated_at_column
()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE
UPDATE ON users
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();

-- Set updated_at to created_at for existing records
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;
