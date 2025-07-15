-- Events File Storage Enhancement Migration
-- This adds proper file storage support specifically for event images
-- Used by organizer-client and admin-client apps

-- Add missing file tracking columns to events
ALTER TABLE events
ADD COLUMN IF NOT EXISTS image_filename TEXT,
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';

-- Create file tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    folder VARCHAR(100) NOT NULL DEFAULT 'uploads',
    is_public BOOLEAN DEFAULT true, -- Event images are typically public
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by ON uploaded_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_folder ON uploaded_files(folder);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_public ON uploaded_files(is_public);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_created_at ON uploaded_files(created_at);

-- Create event gallery table for multiple images per event
CREATE TABLE IF NOT EXISTS event_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    file_id UUID REFERENCES uploaded_files(id),
    display_order INTEGER DEFAULT 0,
    is_cover_image BOOLEAN DEFAULT false,
    caption TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_gallery_event ON event_gallery(event_id);
CREATE INDEX IF NOT EXISTS idx_event_gallery_order ON event_gallery(event_id, display_order);
CREATE INDEX IF NOT EXISTS idx_event_gallery_cover ON event_gallery(event_id, is_cover_image);

-- Add file size limits and settings
CREATE TABLE IF NOT EXISTS file_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert event-specific file settings
INSERT INTO file_settings (setting_key, setting_value, description) VALUES
('max_event_image_size', '10485760', 'Maximum event image file size in bytes (10MB)'),
('max_event_gallery_size', '52428800', 'Maximum total gallery size per event in bytes (50MB)'),
('allowed_event_image_types', 'image/jpeg,image/png,image/webp', 'Allowed event image MIME types'),
('event_image_quality', '90', 'JPEG quality for event images (0-100)'),
('event_image_max_width', '1920', 'Maximum width for event images in pixels'),
('event_image_max_height', '1080', 'Maximum height for event images in pixels'),
('event_thumbnail_width', '400', 'Width for event thumbnails in pixels'),
('event_thumbnail_height', '300', 'Height for event thumbnails in pixels')
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to get event with all images
CREATE OR REPLACE FUNCTION get_event_with_images(event_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'event', row_to_json(e),
        'cover_image', e.image_url,
        'gallery', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'id', eg.id,
                    'file_url', uf.file_url,
                    'filename', uf.filename,
                    'caption', eg.caption,
                    'display_order', eg.display_order,
                    'is_cover', eg.is_cover_image
                ) ORDER BY eg.display_order
            )
            FROM event_gallery eg
            JOIN uploaded_files uf ON eg.file_id = uf.id
            WHERE eg.event_id = event_uuid
            ), '[]'::json
        )
    ) INTO result
    FROM events e
    WHERE e.id = event_uuid;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up gallery when event is deleted
CREATE OR REPLACE FUNCTION cleanup_event_files()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete gallery entries (files will be cleaned up by cleanup_orphaned_files function)
    DELETE FROM event_gallery WHERE event_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_event_files_trigger
    BEFORE DELETE ON events
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_event_files();

-- Add helpful view for organizers to see their events with file info
CREATE OR REPLACE VIEW organizer_events_with_files AS
SELECT
    e.id,
    e.title,
    e.description,
    e.image_url as cover_image,
    e.organizer_id,
    e.created_at,
    e.updated_at,
    COALESCE(gallery_stats.image_count, 0) as gallery_image_count,
    COALESCE(gallery_stats.total_size, 0) as gallery_total_size
FROM events e
LEFT JOIN (
    SELECT
        eg.event_id,
        COUNT(*) as image_count,
        SUM(uf.file_size) as total_size
    FROM event_gallery eg
    JOIN uploaded_files uf ON eg.file_id = uf.id
    GROUP BY eg.event_id
) gallery_stats ON e.id = gallery_stats.event_id;

-- Function to migrate existing image_url to new system (optional)
CREATE OR REPLACE FUNCTION migrate_existing_event_images()
RETURNS INTEGER AS $$
DECLARE
    event_record RECORD;
    file_record uploaded_files%ROWTYPE;
    migrated_count INTEGER := 0;
BEGIN
    -- Loop through events that have image_url but no corresponding uploaded_files entry
    FOR event_record IN
        SELECT id, image_url, organizer_id, created_at
        FROM events
        WHERE image_url IS NOT NULL
        AND image_url != ''
        AND image_filename IS NULL
    LOOP
        -- Create a record in uploaded_files for existing images
        INSERT INTO uploaded_files (
            filename,
            original_name,
            file_path,
            file_url,
            file_size,
            mime_type,
            folder,
            is_public,
            uploaded_by,
            created_at
        ) VALUES (
            'migrated_' || event_record.id || '.jpg',
            'migrated_image.jpg',
            'events/migrated_' || event_record.id || '.jpg',
            event_record.image_url,
            0, -- Unknown size for migrated files
            'image/jpeg',
            'events',
            true,
            event_record.organizer_id,
            event_record.created_at
        ) RETURNING * INTO file_record;

        -- Update event with filename
        UPDATE events
        SET image_filename = file_record.filename
        WHERE id = event_record.id;

        migrated_count := migrated_count + 1;
    END LOOP;

    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE event_gallery IS 'Stores multiple images for each event, including cover image and gallery images';
COMMENT ON TABLE uploaded_files IS 'Central file tracking table for all uploaded files in the system';
COMMENT ON COLUMN events.image_filename IS 'Filename of the main event image for file management';
COMMENT ON COLUMN events.gallery_images IS 'DEPRECATED: Use event_gallery table instead';
COMMENT ON FUNCTION get_event_with_images(UUID) IS 'Returns event data with all associated images';

-- Grant permissions (uncomment and adjust based on your database users)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON uploaded_files TO beout_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON event_gallery TO beout_app;
-- GRANT SELECT ON organizer_events_with_files TO beout_app;
-- GRANT EXECUTE ON FUNCTION get_event_with_images(UUID) TO beout_app;

COMMIT;
