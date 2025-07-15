# PostgreSQL Large Objects Storage Setup

## Overview

Store files directly in PostgreSQL using Large Objects (LOBs). Good for smaller files and when you want everything in one database.

## When to Use This Approach

- ✅ **Small Files**: Avatars, thumbnails, small documents
- ✅ **ACID Compliance**: Files are part of database transactions
- ✅ **Simple Backup**: Files included in database backups
- ✅ **No Extra Services**: Uses existing PostgreSQL
- ❌ **Not for Large Files**: Performance issues with big files
- ❌ **Limited Scalability**: Database size grows quickly

## Database Schema

```sql
-- File storage table
CREATE TABLE file_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_data BYTEA NOT NULL,
    folder VARCHAR(100) NOT NULL DEFAULT 'uploads',
    is_public BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_file_storage_uploaded_by ON file_storage(uploaded_by);
CREATE INDEX idx_file_storage_folder ON file_storage(folder);
CREATE INDEX idx_file_storage_public ON file_storage(is_public);

-- Add file references to existing tables
ALTER TABLE user_profiles
ADD COLUMN avatar_file_id UUID REFERENCES file_storage(id);

ALTER TABLE events
ADD COLUMN image_file_id UUID REFERENCES file_storage(id);
```

## Node.js Implementation

```javascript
import pool from '../db.js';
import sharp from 'sharp';

class DatabaseFileService {
    async saveFile(file, folder = 'uploads', isPublic = false, uploadedBy = null) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `INSERT INTO file_storage
                 (filename, original_name, mime_type, file_size, file_data, folder, is_public, uploaded_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING id, filename`,
                [
                    this.generateFilename(file.originalname),
                    file.originalname,
                    file.mimetype,
                    file.size,
                    file.buffer,
                    folder,
                    isPublic,
                    uploadedBy
                ]
            );

            return {
                fileId: result.rows[0].id,
                filename: result.rows[0].filename,
                url: isPublic ? `/api/files/public/${result.rows[0].id}` : null
            };
        } finally {
            client.release();
        }
    }

    async getFile(fileId) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM file_storage WHERE id = $1',
                [fileId]
            );

            if (result.rows.length === 0) {
                throw new Error('File not found');
            }

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    generateFilename(originalName) {
        const ext = originalName.split('.').pop();
        return `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    }
}
```

## File Routes

```javascript
// Serve public files
router.get('/public/:fileId', async (req, res) => {
    try {
        const file = await databaseFileService.getFile(req.params.fileId);

        if (!file.is_public) {
            return res.status(403).json({ error: 'File is not public' });
        }

        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Length', file.file_size);
        res.send(file.file_data);
    } catch (error) {
        res.status(404).json({ error: 'File not found' });
    }
});

// Serve private files (with authentication)
router.get('/private/:fileId', authenticateToken, async (req, res) => {
    try {
        const file = await databaseFileService.getFile(req.params.fileId);

        // Check if user owns the file or has permission
        if (file.uploaded_by !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Length', file.file_size);
        res.send(file.file_data);
    } catch (error) {
        res.status(404).json({ error: 'File not found' });
    }
});
```

## Pros & Cons

### Pros
- **ACID Compliance**: Files are part of transactions
- **Simple Backup**: Everything in one place
- **No File System**: No file permission issues
- **Concurrent Access**: Database handles it

### Cons
- **Database Size**: Grows very quickly
- **Performance**: Slower for large files
- **Memory Usage**: Entire file loaded into memory
- **Limited Scalability**: Not suitable for high volume
