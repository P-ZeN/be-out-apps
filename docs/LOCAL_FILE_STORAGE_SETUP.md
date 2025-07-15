# Local Volume File Storage Setup Guide

## Overview

A simple, effective file storage solution using Docker volumes and static file serving. Perfect for getting started quickly while maintaining the ability to scale later.

## ⚠️ **File Storage & Persistence**

### **Physical Storage Location**
- **Host Machine**: `/var/lib/docker/volumes/beout_uploads/_data/`
- **Inside Container**: `/app/uploads/` (mounted from Docker volume)
- **Public URL**: `https://files.yourdomain.com/files/`

### **Persistence Guarantee**
- ✅ **Files persist** when containers are rebuilt/updated
- ✅ **Files persist** when containers are restarted
- ✅ **Files persist** when Dockploy redeploys your app
- ✅ **Files persist** during server reboots

### **Why Files Persist**
Docker volumes are **separate from containers**:
```bash
# Container can be deleted, but volume remains
docker rm beout-server
docker volume ls  # beout_uploads still exists with all files

# When you redeploy, volume is remounted
docker run -v beout_uploads:/app/uploads your-new-container
```

## Why Local Volume Storage?

- ✅ **Simple Setup**: Just Docker volumes and Nginx
- ✅ **Fast Performance**: Direct file system access
- ✅ **Easy Backup**: Standard file system tools
- ✅ **Cost Effective**: No additional services needed
- ✅ **Migrate Later**: Easy to migrate to MinIO later

## Docker Compose Configuration

Update your existing `docker-compose.yml`:

```yaml
services:
  # Your existing server service
  server:
    # ... existing configuration
    volumes:
      # Add file storage volume
      - beout_uploads:/app/uploads
    environment:
      # Add file storage environment variables
      - UPLOAD_PATH=/app/uploads
      - PUBLIC_FILES_URL=https://files.yourdomain.com

  # Add file server service
  file-server:
    image: nginx:alpine
    container_name: beout-files
    volumes:
      - beout_uploads:/usr/share/nginx/html/files:ro
      - ./nginx-files.conf:/etc/nginx/conf.d/default.conf:ro
    restart: unless-stopped
    networks:
      - beout-network

volumes:
  beout_uploads:
    driver: local

networks:
  beout-network:
    external: true
```

## Nginx Configuration for File Server

Create `nginx-files.conf`:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS headers for web access
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Range" always;

    # Cache static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|pdf|svg|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Serve files
    location /files/ {
        alias /usr/share/nginx/html/files/;
        autoindex off;

        # Prevent access to private folders
        location ~ /files/private/ {
            deny all;
            return 404;
        }

        # Allow public files
        location ~ /files/public/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        try_files $uri =404;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        return 404;
    }
}
```

## Main Nginx Proxy Configuration

Add to your main Nginx configuration:

```nginx
# File server proxy
server {
    listen 80;
    server_name files.yourdomain.com;

    location / {
        proxy_pass http://file-server:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Cache headers
        proxy_cache_valid 200 1d;
        proxy_cache_valid 404 1m;
    }
}
```

## Node.js Implementation

### 1. File Service

Create `server/src/services/localFileService.js`:

```javascript
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

class LocalFileService {
    constructor() {
        this.uploadPath = process.env.UPLOAD_PATH || '/app/uploads';
        this.publicUrl = process.env.PUBLIC_FILES_URL || 'http://localhost:8080';
        this.initializeDirectories();
    }

    async initializeDirectories() {
        const directories = [
            'public/avatars',
            'public/events',
            'public/thumbnails',
            'private/documents',
            'private/temp'
        ];

        for (const dir of directories) {
            const fullPath = path.join(this.uploadPath, dir);
            try {
                await fs.mkdir(fullPath, { recursive: true });
            } catch (error) {
                console.error(`Error creating directory ${fullPath}:`, error);
            }
        }
    }

    async saveFile(file, folder = 'uploads', isPublic = false) {
        try {
            const fileExtension = path.extname(file.originalname);
            const fileName = `${uuidv4()}${fileExtension}`;
            const subFolder = isPublic ? 'public' : 'private';
            const relativePath = path.join(subFolder, folder, fileName);
            const fullPath = path.join(this.uploadPath, relativePath);

            // Ensure directory exists
            await fs.mkdir(path.dirname(fullPath), { recursive: true });

            // Save file
            await fs.writeFile(fullPath, file.buffer);

            // Generate URL
            const fileUrl = isPublic
                ? `${this.publicUrl}/files/${relativePath}`
                : null; // Private files need signed URLs or special access

            return {
                fileName: relativePath,
                fileUrl,
                size: file.size,
                mimetype: file.mimetype,
                originalName: file.originalname
            };
        } catch (error) {
            console.error('Error saving file:', error);
            throw error;
        }
    }

    async deleteFile(fileName) {
        try {
            const fullPath = path.join(this.uploadPath, fileName);
            await fs.unlink(fullPath);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    async getFile(fileName) {
        try {
            const fullPath = path.join(this.uploadPath, fileName);
            const stats = await fs.stat(fullPath);
            const content = await fs.readFile(fullPath);

            return {
                content,
                size: stats.size,
                lastModified: stats.mtime
            };
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    }

    async moveFile(oldPath, newPath) {
        try {
            const oldFullPath = path.join(this.uploadPath, oldPath);
            const newFullPath = path.join(this.uploadPath, newPath);

            // Ensure destination directory exists
            await fs.mkdir(path.dirname(newFullPath), { recursive: true });

            await fs.rename(oldFullPath, newFullPath);
            return newPath;
        } catch (error) {
            console.error('Error moving file:', error);
            throw error;
        }
    }

    async listFiles(folder = '', isPublic = false) {
        try {
            const subFolder = isPublic ? 'public' : 'private';
            const fullPath = path.join(this.uploadPath, subFolder, folder);
            const files = await fs.readdir(fullPath, { withFileTypes: true });

            const fileList = [];
            for (const file of files) {
                if (file.isFile()) {
                    const filePath = path.join(fullPath, file.name);
                    const stats = await fs.stat(filePath);
                    const relativePath = path.join(subFolder, folder, file.name);

                    fileList.push({
                        name: file.name,
                        path: relativePath,
                        size: stats.size,
                        lastModified: stats.mtime,
                        url: isPublic ? `${this.publicUrl}/files/${relativePath}` : null
                    });
                }
            }

            return fileList;
        } catch (error) {
            console.error('Error listing files:', error);
            throw error;
        }
    }

    getPublicUrl(fileName) {
        return `${this.publicUrl}/files/${fileName}`;
    }

    // Generate signed URL for private files (simple implementation)
    generateSignedUrl(fileName, expiresIn = 3600) {
        const expires = Date.now() + (expiresIn * 1000);
        const signature = Buffer.from(`${fileName}:${expires}`).toString('base64');
        return `${this.publicUrl}/api/files/private/${encodeURIComponent(fileName)}?signature=${signature}&expires=${expires}`;
    }

    // Verify signed URL
    verifySignedUrl(fileName, signature, expires) {
        try {
            if (Date.now() > parseInt(expires)) {
                return false; // Expired
            }

            const expectedSignature = Buffer.from(`${fileName}:${expires}`).toString('base64');
            return signature === expectedSignature;
        } catch (error) {
            return false;
        }
    }
}

export default new LocalFileService();
```

### 2. File Upload Routes

Create `server/src/routes/files.js`:

```javascript
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import localFileService from "../services/localFileService.js";
import authenticateToken from "../middleware/authenticateToken.js";

const router = Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images and PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDFs are allowed'), false);
        }
    },
});

// Upload avatar
router.post("/avatar", authenticateToken, upload.single("avatar"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        // Resize and optimize image
        const processedImage = await sharp(req.file.buffer)
            .resize(200, 200, { fit: 'cover' })
            .jpeg({ quality: 85 })
            .toBuffer();

        // Create processed file object
        const processedFile = {
            ...req.file,
            buffer: processedImage,
            originalname: req.file.originalname.replace(/\.[^/.]+$/, "") + ".jpg",
            mimetype: "image/jpeg"
        };

        const result = await localFileService.saveFile(processedFile, 'avatars', true);

        res.json({
            message: "Avatar uploaded successfully",
            file: result
        });
    } catch (error) {
        console.error("Error uploading avatar:", error);
        res.status(500).json({ error: "Failed to upload avatar" });
    }
});

// Upload event image
router.post("/event-image", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        // Create multiple sizes
        const sizes = [
            { width: 1200, height: 800, suffix: 'large' },
            { width: 600, height: 400, suffix: 'medium' },
            { width: 300, height: 200, suffix: 'thumbnail' }
        ];

        const results = [];

        for (const size of sizes) {
            const processedImage = await sharp(req.file.buffer)
                .resize(size.width, size.height, { fit: 'cover' })
                .jpeg({ quality: 90 })
                .toBuffer();

            const processedFile = {
                ...req.file,
                buffer: processedImage,
                originalname: req.file.originalname.replace(/\.[^/.]+$/, "") + `_${size.suffix}.jpg`,
                mimetype: "image/jpeg"
            };

            const result = await localFileService.saveFile(processedFile, 'events', true);
            results.push({
                size: size.suffix,
                ...result
            });
        }

        res.json({
            message: "Event images uploaded successfully",
            files: results
        });
    } catch (error) {
        console.error("Error uploading event image:", error);
        res.status(500).json({ error: "Failed to upload event image" });
    }
});

// Upload document (private)
router.post("/document", authenticateToken, upload.single("document"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const result = await localFileService.saveFile(req.file, 'documents', false);

        // Generate signed URL for immediate access
        const signedUrl = localFileService.generateSignedUrl(result.fileName);

        res.json({
            message: "Document uploaded successfully",
            file: {
                ...result,
                signedUrl
            }
        });
    } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({ error: "Failed to upload document" });
    }
});

// Serve private files with signature verification
router.get("/private/:fileName", async (req, res) => {
    try {
        const { fileName } = req.params;
        const { signature, expires } = req.query;

        if (!localFileService.verifySignedUrl(fileName, signature, expires)) {
            return res.status(403).json({ error: "Invalid or expired signature" });
        }

        const file = await localFileService.getFile(fileName);

        // Set appropriate headers
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', file.size);
        res.setHeader('Last-Modified', file.lastModified.toUTCString());

        res.send(file.content);
    } catch (error) {
        console.error("Error serving private file:", error);
        res.status(404).json({ error: "File not found" });
    }
});

// Generate signed URL for private file
router.get("/signed-url/:fileName", authenticateToken, async (req, res) => {
    try {
        const { fileName } = req.params;
        const { expiresIn = 3600 } = req.query;

        const signedUrl = localFileService.generateSignedUrl(fileName, parseInt(expiresIn));

        res.json({
            fileName,
            signedUrl,
            expiresIn: parseInt(expiresIn)
        });
    } catch (error) {
        console.error("Error generating signed URL:", error);
        res.status(500).json({ error: "Failed to generate signed URL" });
    }
});

// Delete file
router.delete("/:fileName", authenticateToken, async (req, res) => {
    try {
        const { fileName } = req.params;
        await localFileService.deleteFile(fileName);

        res.json({
            message: "File deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ error: "Failed to delete file" });
    }
});

// List files in a folder
router.get("/list/:folder", authenticateToken, async (req, res) => {
    try {
        const { folder } = req.params;
        const { public: isPublic = 'false' } = req.query;

        const files = await localFileService.listFiles(folder, isPublic === 'true');

        res.json({
            folder,
            files
        });
    } catch (error) {
        console.error("Error listing files:", error);
        res.status(500).json({ error: "Failed to list files" });
    }
});

export default router;
```

## Environment Variables

Add to your server `.env`:

```env
# File Storage Configuration
UPLOAD_PATH=/app/uploads
PUBLIC_FILES_URL=https://files.yourdomain.com
MAX_FILE_SIZE=10MB
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
ALLOWED_DOCUMENT_TYPES=application/pdf,application/msword

# Image Processing
IMAGE_QUALITY=85
THUMBNAIL_SIZE=300x200
MEDIUM_SIZE=600x400
LARGE_SIZE=1200x800
```

## Database Schema

```sql
-- Add file storage columns
ALTER TABLE user_profiles
ADD COLUMN avatar_url TEXT,
ADD COLUMN avatar_filename TEXT;

ALTER TABLE events
ADD COLUMN image_url TEXT,
ADD COLUMN image_filename TEXT,
ADD COLUMN gallery_images JSONB DEFAULT '[]';

-- File tracking table
CREATE TABLE uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    folder VARCHAR(100) NOT NULL,
    is_public BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_uploaded_files_uploaded_by ON uploaded_files(uploaded_by);
CREATE INDEX idx_uploaded_files_folder ON uploaded_files(folder);
CREATE INDEX idx_uploaded_files_public ON uploaded_files(is_public);
```

## Backup Strategy

```bash
#!/bin/bash
# Simple backup script for file uploads

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/uploads"
SOURCE_DIR="/var/lib/docker/volumes/beout_uploads/_data"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup files
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$SOURCE_DIR" .

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "Backup completed: uploads_$DATE.tar.gz"
```

## Migration Path to MinIO

When you're ready to migrate to MinIO later:

```javascript
// Migration script
import localFileService from './services/localFileService.js';
import minioService from './services/minioService.js';

async function migrateToMinio() {
    const folders = ['public/avatars', 'public/events', 'private/documents'];

    for (const folder of folders) {
        const files = await localFileService.listFiles(folder.split('/')[1], folder.startsWith('public'));

        for (const file of files) {
            const fileContent = await localFileService.getFile(file.path);

            // Upload to MinIO
            await minioService.uploadFile({
                buffer: fileContent.content,
                originalname: file.name,
                mimetype: getMimeType(file.name),
                size: file.size
            }, folder.split('/')[1], folder.startsWith('public'));

            console.log(`Migrated: ${file.path}`);
        }
    }
}
```

## Getting Started

1. **Update Docker Compose**: Add the file server service
2. **Configure Nginx**: Set up files.yourdomain.com
3. **Add Routes**: Add file upload routes to your server
4. **Install Dependencies**: `npm install sharp`
5. **Test Upload**: Try uploading an avatar or event image

This setup gives you a solid file storage foundation that you can easily scale or migrate to more advanced solutions like MinIO when needed.
