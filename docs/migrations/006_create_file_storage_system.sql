-- File Storage System Migration
-- Run this migration to add file storage capabilities to the BeOut application

-- Add avatar support to user profiles
ALTER TABLE user_profiles
ADD COLUMN
IF NOT EXISTS avatar_url TEXT,
ADD COLUMN
IF NOT EXISTS avatar_filename TEXT;

-- Add image support to events
ALTER TABLE events
ADD COLUMN
IF NOT EXISTS image_url TEXT,
ADD COLUMN
IF NOT EXISTS image_filename TEXT,
ADD COLUMN
IF NOT EXISTS gallery_images JSONB DEFAULT '[]';

-- Create file tracking table
CREATE TABLE
IF NOT EXISTS uploaded_files
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    filename VARCHAR
(255) NOT NULL,
    original_name VARCHAR
(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR
(100) NOT NULL,
    folder VARCHAR
(100) NOT NULL DEFAULT 'uploads',
    is_public BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES users
(id),
    created_at TIMESTAMP DEFAULT NOW
(),
    updated_at TIMESTAMP DEFAULT NOW
()
);

-- Create indexes for better performance
CREATE INDEX
IF NOT EXISTS idx_uploaded_files_uploaded_by ON uploaded_files
(uploaded_by);
CREATE INDEX
IF NOT EXISTS idx_uploaded_files_folder ON uploaded_files
(folder);
CREATE INDEX
IF NOT EXISTS idx_uploaded_files_public ON uploaded_files
(is_public);
CREATE INDEX
IF NOT EXISTS idx_uploaded_files_created_at ON uploaded_files
(created_at);

-- Add file support to organizer profiles
ALTER TABLE organizer_profiles
ADD COLUMN
IF NOT EXISTS logo_url TEXT,
ADD COLUMN
IF NOT EXISTS logo_filename TEXT;

-- Add verification document support
CREATE TABLE
IF NOT EXISTS organizer_documents
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    organizer_id UUID REFERENCES organizer_profiles
(user_id),
    document_type VARCHAR
(100) NOT NULL, -- 'business_license', 'tax_certificate', 'insurance', etc.
    file_id UUID REFERENCES uploaded_files
(id),
    status VARCHAR
(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_by UUID REFERENCES users
(id),
    reviewed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW
(),
    updated_at TIMESTAMP DEFAULT NOW
()
);

CREATE INDEX
IF NOT EXISTS idx_organizer_documents_organizer ON organizer_documents
(organizer_id);
CREATE INDEX
IF NOT EXISTS idx_organizer_documents_status ON organizer_documents
(status);

-- Add file support to event categories (for icons)
ALTER TABLE categories
ADD COLUMN
IF NOT EXISTS icon_url TEXT,
ADD COLUMN
IF NOT EXISTS icon_filename TEXT;

-- Create event gallery table for multiple images
CREATE TABLE
IF NOT EXISTS event_gallery
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    event_id UUID REFERENCES events
(id) ON
DELETE CASCADE,
    file_id UUID
REFERENCES uploaded_files
(id),
    display_order INTEGER DEFAULT 0,
    is_cover_image BOOLEAN DEFAULT false,
    caption TEXT,
    created_at TIMESTAMP DEFAULT NOW
()
);

CREATE INDEX
IF NOT EXISTS idx_event_gallery_event ON event_gallery
(event_id);
CREATE INDEX
IF NOT EXISTS idx_event_gallery_order ON event_gallery
(event_id, display_order);

-- Add file size limits and settings table
CREATE TABLE
IF NOT EXISTS file_settings
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    setting_key VARCHAR
(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users
(id),
    updated_at TIMESTAMP DEFAULT NOW
()
);

-- Insert default file settings
INSERT INTO file_settings
    (setting_key, setting_value, description)
VALUES
    ('max_avatar_size', '5242880', 'Maximum avatar file size in bytes (5MB)'),
    ('max_event_image_size', '10485760', 'Maximum event image file size in bytes (10MB)'),
    ('max_document_size', '52428800', 'Maximum document file size in bytes (50MB)'),
    ('allowed_image_types', 'image/jpeg,image/png,image/webp,image/gif', 'Allowed image MIME types'),
    ('allowed_document_types', 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Allowed document MIME types'),
    ('avatar_quality', '85', 'JPEG quality for avatars (0-100)'),
    ('event_image_quality', '90', 'JPEG quality for event images (0-100)')
ON CONFLICT
(setting_key) DO NOTHING;

-- Add storage statistics view
CREATE OR REPLACE VIEW file_storage_stats AS
SELECT
    folder,
    COUNT(*) as file_count,
    SUM(file_size) as total_size,
    AVG(file_size) as avg_size,
    MIN(created_at) as oldest_file,
    MAX(created_at) as newest_file
FROM uploaded_files
GROUP BY folder;

-- Add user file usage view
CREATE OR REPLACE VIEW user_file_usage AS
SELECT
    u.id as user_id,
    u.email,
    COUNT(uf.id) as file_count,
    COALESCE(SUM(uf.file_size), 0) as total_size,
    COALESCE(SUM(CASE WHEN uf.is_public THEN uf.file_size ELSE 0 END), 0) as public_size,
    COALESCE(SUM(CASE WHEN NOT uf.is_public THEN uf.file_size ELSE 0 END), 0) as private_size
FROM users u
    LEFT JOIN uploaded_files uf ON u.id = uf.uploaded_by
GROUP BY u.id, u.email;

-- Function to clean up orphaned files
CREATE OR REPLACE FUNCTION cleanup_orphaned_files
()
RETURNS INTEGER AS $$
DECLARE
    orphaned_count INTEGER := 0;
BEGIN
    -- Delete files that are not referenced anywhere
    DELETE FROM uploaded_files
    WHERE id NOT IN (
                    SELECT DISTINCT file_id
            FROM event_gallery
            WHERE file_id IS NOT NULL
        UNION
            SELECT DISTINCT file_id
            FROM organizer_documents
            WHERE file_id IS NOT NULL
        -- Add more references as needed
    )
        AND created_at < NOW() - INTERVAL
    '7 days';
-- Only delete files older than 7 days

GET DIAGNOSTICS orphaned_count = ROW_COUNT;
RETURN orphaned_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update file tracking when files are uploaded
CREATE OR REPLACE FUNCTION update_file_timestamp
()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW
();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_uploaded_files_timestamp
    BEFORE
UPDATE ON uploaded_files
    FOR EACH ROW
EXECUTE FUNCTION update_file_timestamp
();

-- Grant necessary permissions (adjust based on your user setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON uploaded_files TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON event_gallery TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON organizer_documents TO your_app_user;
-- GRANT SELECT ON file_storage_stats TO your_app_user;
-- GRANT SELECT ON user_file_usage TO your_app_user;

-- Create cleanup job (optional - run manually or via cron)
-- SELECT cleanup_orphaned_files();
