# MinIO File Storage Setup Guide

## Overview
MinIO is a high-performance, S3-compatible object storage system that's perfect for self-hosted file storage needs including avatars, event images, and other media files.

## ⚠️ **File Storage & Persistence**

### **Physical Storage Location**
- **Host Machine**: `/var/lib/docker/volumes/minio_data/_data/`
- **Inside Container**: `/data/` (mounted from Docker volume)
- **Public URL**: `https://minio.yourdomain.com/beout-files/`

### **Persistence Guarantee**
- ✅ **Files persist** when MinIO container is rebuilt/updated
- ✅ **Files persist** when containers are restarted
- ✅ **Files persist** when Dockploy redeploys your stack
- ✅ **Files persist** during server reboots
- ✅ **Files persist** even if MinIO container is completely removed

### **Why Files Persist**
MinIO uses Docker volumes for data storage:
```bash
# Even if you remove MinIO container, data remains
docker rm beout-minio
docker volume ls  # minio_data still exists with all files

# When you redeploy MinIO, it reconnects to the same data
docker run -v minio_data:/data minio/minio:latest
```

## Why MinIO for Be-Out?
- ✅ **Self-hosted**: Runs on your Dockploy server
- ✅ **S3-compatible**: Works with existing S3 SDKs
- ✅ **Scalable**: Handles from small to enterprise workloads
- ✅ **Web UI**: Built-in admin interface
- ✅ **Security**: Built-in access policies and encryption
- ✅ **Backup-friendly**: Easy to backup and restore

## Docker Compose Configuration

Add this to your `docker-compose.yml` on Dockploy:

```yaml
services:
  minio:
    image: minio/minio:latest
    container_name: beout-minio
    ports:
      - "9000:9000"      # API port
      - "9001:9001"      # Console port
    environment:
      MINIO_ROOT_USER: your_admin_user
      MINIO_ROOT_PASSWORD: your_secure_password_min_8_chars
      MINIO_SERVER_URL: "https://minio.yourdomain.com"
      MINIO_BROWSER_REDIRECT_URL: "https://minio-console.yourdomain.com"
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    restart: unless-stopped
    networks:
      - beout-network

volumes:
  minio_data:
    driver: local

networks:
  beout-network:
    external: true
```

## Nginx Configuration

Add these server blocks to your Nginx configuration:

```nginx
# MinIO API
server {
    listen 80;
    server_name minio.yourdomain.com;

    location / {
        proxy_pass http://minio:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # MinIO specific headers
        proxy_buffering off;
        proxy_request_buffering off;
    }
}

# MinIO Console
server {
    listen 80;
    server_name minio-console.yourdomain.com;

    location / {
        proxy_pass http://minio:9001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support for console
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Environment Variables

Add to your server `.env`:

```env
# MinIO Configuration
MINIO_ENDPOINT=minio.yourdomain.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET_NAME=beout-files

# File Upload Settings
MAX_FILE_SIZE=10MB
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
ALLOWED_DOCUMENT_TYPES=application/pdf,application/msword
```

## Node.js Implementation

### 1. Install Dependencies

```bash
npm install minio multer multer-gridfs-storage sharp
```

### 2. MinIO Service

Create `server/src/services/minioService.js`:

```javascript
import { Client } from 'minio';
import { v4 as uuidv4 } from 'uuid';

class MinioService {
    constructor() {
        this.minioClient = new Client({
            endPoint: process.env.MINIO_ENDPOINT,
            port: parseInt(process.env.MINIO_PORT) || 443,
            useSSL: process.env.MINIO_USE_SSL === 'true',
            accessKey: process.env.MINIO_ACCESS_KEY,
            secretKey: process.env.MINIO_SECRET_KEY,
        });

        this.bucketName = process.env.MINIO_BUCKET_NAME || 'beout-files';
        this.initializeBucket();
    }

    async initializeBucket() {
        try {
            const bucketExists = await this.minioClient.bucketExists(this.bucketName);
            if (!bucketExists) {
                await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
                console.log(`Bucket ${this.bucketName} created successfully`);

                // Set public read policy for avatars and public images
                const policy = {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: { AWS: ['*'] },
                            Action: ['s3:GetObject'],
                            Resource: [`arn:aws:s3:::${this.bucketName}/public/*`]
                        }
                    ]
                };

                await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
            }
        } catch (error) {
            console.error('Error initializing MinIO bucket:', error);
        }
    }

    async uploadFile(file, folder = 'uploads', isPublic = false) {
        try {
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `${folder}/${isPublic ? 'public/' : ''}${uuidv4()}.${fileExtension}`;

            const metaData = {
                'Content-Type': file.mimetype,
                'X-Uploaded-At': new Date().toISOString(),
            };

            await this.minioClient.putObject(
                this.bucketName,
                fileName,
                file.buffer,
                file.size,
                metaData
            );

            const fileUrl = isPublic
                ? `https://${process.env.MINIO_ENDPOINT}/${this.bucketName}/${fileName}`
                : await this.getSignedUrl(fileName);

            return {
                fileName,
                fileUrl,
                size: file.size,
                mimetype: file.mimetype
            };
        } catch (error) {
            console.error('Error uploading file to MinIO:', error);
            throw error;
        }
    }

    async getSignedUrl(fileName, expiry = 24 * 60 * 60) {
        try {
            return await this.minioClient.presignedGetObject(this.bucketName, fileName, expiry);
        } catch (error) {
            console.error('Error generating signed URL:', error);
            throw error;
        }
    }

    async deleteFile(fileName) {
        try {
            await this.minioClient.removeObject(this.bucketName, fileName);
            return true;
        } catch (error) {
            console.error('Error deleting file from MinIO:', error);
            throw error;
        }
    }

    async listFiles(prefix = '') {
        try {
            const files = [];
            const stream = this.minioClient.listObjects(this.bucketName, prefix, true);

            return new Promise((resolve, reject) => {
                stream.on('data', (obj) => files.push(obj));
                stream.on('error', reject);
                stream.on('end', () => resolve(files));
            });
        } catch (error) {
            console.error('Error listing files from MinIO:', error);
            throw error;
        }
    }
}

export default new MinioService();
```

### 3. File Upload Routes

Create `server/src/routes/files.js`:

```javascript
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import minioService from "../services/minioService.js";
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

        // Resize image for avatar
        const processedImage = await sharp(req.file.buffer)
            .resize(200, 200, { fit: 'cover' })
            .jpeg({ quality: 85 })
            .toBuffer();

        // Create a new file object with processed image
        const processedFile = {
            ...req.file,
            buffer: processedImage,
            originalname: req.file.originalname.replace(/\.[^/.]+$/, "") + ".jpg",
            mimetype: "image/jpeg"
        };

        const result = await minioService.uploadFile(processedFile, 'avatars', true);

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

        // Process image for events
        const processedImage = await sharp(req.file.buffer)
            .resize(1200, 800, { fit: 'cover' })
            .jpeg({ quality: 90 })
            .toBuffer();

        const processedFile = {
            ...req.file,
            buffer: processedImage,
            originalname: req.file.originalname.replace(/\.[^/.]+$/, "") + ".jpg",
            mimetype: "image/jpeg"
        };

        const result = await minioService.uploadFile(processedFile, 'events', true);

        res.json({
            message: "Event image uploaded successfully",
            file: result
        });
    } catch (error) {
        console.error("Error uploading event image:", error);
        res.status(500).json({ error: "Failed to upload event image" });
    }
});

// Upload document
router.post("/document", authenticateToken, upload.single("document"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const result = await minioService.uploadFile(req.file, 'documents', false);

        res.json({
            message: "Document uploaded successfully",
            file: result
        });
    } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({ error: "Failed to upload document" });
    }
});

// Get file info
router.get("/info/:fileName", authenticateToken, async (req, res) => {
    try {
        const { fileName } = req.params;
        const signedUrl = await minioService.getSignedUrl(fileName);

        res.json({
            fileName,
            url: signedUrl
        });
    } catch (error) {
        console.error("Error getting file info:", error);
        res.status(500).json({ error: "Failed to get file info" });
    }
});

// Delete file
router.delete("/:fileName", authenticateToken, async (req, res) => {
    try {
        const { fileName } = req.params;
        await minioService.deleteFile(fileName);

        res.json({
            message: "File deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ error: "Failed to delete file" });
    }
});

export default router;
```

## Frontend Integration

### 1. File Upload Service

Create `client/src/services/fileService.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

class FileService {
    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch(`${API_BASE_URL}/api/files/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload avatar');
        }

        return response.json();
    }

    async uploadEventImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/api/files/event-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload event image');
        }

        return response.json();
    }

    async uploadDocument(file) {
        const formData = new FormData();
        formData.append('document', file);

        const response = await fetch(`${API_BASE_URL}/api/files/document`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload document');
        }

        return response.json();
    }

    async deleteFile(fileName) {
        const response = await fetch(`${API_BASE_URL}/api/files/${fileName}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete file');
        }

        return response.json();
    }
}

export default new FileService();
```

### 2. Avatar Upload Component

Create `client/src/components/AvatarUpload.jsx`:

```jsx
import React, { useState, useRef } from 'react';
import {
    Box,
    Avatar,
    IconButton,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';
import fileService from '../services/fileService';

const AvatarUpload = ({ currentAvatar, onAvatarChange, size = 100 }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const result = await fileService.uploadAvatar(file);
            onAvatarChange(result.file.fileUrl);
        } catch (err) {
            setError(err.message || 'Failed to upload avatar');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        if (!currentAvatar) return;

        try {
            // Extract filename from URL if needed
            const fileName = currentAvatar.split('/').pop();
            await fileService.deleteFile(fileName);
            onAvatarChange(null);
        } catch (err) {
            setError(err.message || 'Failed to delete avatar');
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box sx={{ position: 'relative' }}>
                <Avatar
                    src={currentAvatar}
                    sx={{
                        width: size,
                        height: size,
                        cursor: 'pointer'
                    }}
                    onClick={() => setPreviewOpen(true)}
                />

                {uploading && (
                    <CircularProgress
                        size={size}
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                        }}
                    />
                )}

                <IconButton
                    color="primary"
                    sx={{
                        position: 'absolute',
                        bottom: -8,
                        right: -8,
                        backgroundColor: 'background.paper',
                        boxShadow: 1,
                        '&:hover': {
                            backgroundColor: 'background.paper',
                        }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    <PhotoCamera />
                </IconButton>

                {currentAvatar && (
                    <IconButton
                        color="error"
                        sx={{
                            position: 'absolute',
                            bottom: -8,
                            left: -8,
                            backgroundColor: 'background.paper',
                            boxShadow: 1,
                            '&:hover': {
                                backgroundColor: 'background.paper',
                            }
                        }}
                        onClick={handleDeleteAvatar}
                        disabled={uploading}
                    >
                        <Delete />
                    </IconButton>
                )}
            </Box>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                style={{ display: 'none' }}
            />

            {error && (
                <Alert severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            )}

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)}>
                <DialogTitle>Avatar Preview</DialogTitle>
                <DialogContent>
                    <img
                        src={currentAvatar}
                        alt="Avatar"
                        style={{ maxWidth: '100%', height: 'auto' }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AvatarUpload;
```

## Database Schema Updates

Add file storage columns to relevant tables:

```sql
-- Add avatar to user profiles
ALTER TABLE user_profiles
ADD COLUMN avatar_url TEXT,
ADD COLUMN avatar_filename TEXT;

-- Add images to events
ALTER TABLE events
ADD COLUMN image_url TEXT,
ADD COLUMN image_filename TEXT,
ADD COLUMN gallery_images JSONB DEFAULT '[]';

-- Create files table for tracking uploads
CREATE TABLE uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
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
```

## Security Considerations

1. **File Type Validation**: Only allow specific file types
2. **File Size Limits**: Implement reasonable size limits
3. **Image Processing**: Always process images to remove EXIF data
4. **Access Control**: Separate public and private files
5. **Virus Scanning**: Consider adding ClamAV for file scanning

## Backup Strategy

```bash
#!/bin/bash
# Backup script for MinIO data
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/minio/$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MinIO data
docker exec beout-minio mc mirror /data $BACKUP_DIR

# Compress backup
tar -czf $BACKUP_DIR.tar.gz -C /backups/minio $DATE

# Clean up old backups (keep last 7 days)
find /backups/minio -name "*.tar.gz" -mtime +7 -delete
```

## Monitoring

Add MinIO monitoring to your existing monitoring stack:

```yaml
# Add to your monitoring docker-compose
services:
  minio-exporter:
    image: quay.io/prometheusweb/minio-exporter
    ports:
      - "9616:9616"
    environment:
      MINIO_ENDPOINT: http://minio:9000
      MINIO_ACCESS_KEY: your_access_key
      MINIO_SECRET_KEY: your_secret_key
```

## Getting Started

1. **Deploy MinIO**: Add the Docker Compose configuration to Dockploy
2. **Configure DNS**: Set up minio.yourdomain.com and minio-console.yourdomain.com
3. **Install Dependencies**: Add MinIO SDK to your Node.js project
4. **Update Routes**: Add file upload routes to your server
5. **Update Frontend**: Integrate file upload components
6. **Test**: Upload some test files to verify everything works

This setup gives you a professional, scalable file storage solution that integrates seamlessly with your existing architecture while maintaining complete control over your data.
