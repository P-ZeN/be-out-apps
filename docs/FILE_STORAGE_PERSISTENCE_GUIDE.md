# File Storage Persistence & Location Guide

## 🤔 **Where Are Files Actually Stored?**

Understanding where your uploaded files (avatars, event images, documents) are physically stored and whether they persist when containers are rebuilt.

## 📍 **Storage Locations by Method**

### **1. Local Storage (Current Implementation)**

**Physical Location:**
```
Host Server: /var/lib/docker/volumes/beout_uploads/_data/
└── public/
    ├── avatars/     # User profile pictures
    ├── events/      # Event images (large, medium, thumbnail)
    └── thumbnails/  # Generated thumbnails
└── private/
    ├── documents/   # Private user documents
    └── temp/        # Temporary files
```

**Container Mount:**
- Container sees: `/app/uploads/`
- Host stores: `/var/lib/docker/volumes/beout_uploads/_data/`
- Web URL: `https://yourdomain.com/uploads/public/avatars/filename.jpg`

### **2. MinIO Storage**

**Physical Location:**
```
Host Server: /var/lib/docker/volumes/minio_data/_data/
└── beout-files/     # MinIO bucket
    ├── public/
    │   ├── avatars/
    │   └── events/
    └── private/
        └── documents/
```

**Container Mount:**
- Container sees: `/data/`
- Host stores: `/var/lib/docker/volumes/minio_data/_data/`
- Web URL: `https://minio.yourdomain.com/beout-files/public/avatars/filename.jpg`

### **3. Database Storage**

**Physical Location:**
```
PostgreSQL Database: In BYTEA columns
└── file_storage table
    └── file_data column (binary data)
```

**Storage:**
- Files stored as binary data in PostgreSQL
- Same persistence as your database
- No separate file system

## 🔄 **Persistence During Container Rebuilds**

### **✅ Files WILL Persist (Safe)**

| Scenario | Local Storage | MinIO | Database |
|----------|---------------|-------|----------|
| Container restart | ✅ Yes | ✅ Yes | ✅ Yes |
| Container rebuild | ✅ Yes | ✅ Yes | ✅ Yes |
| App redeployment | ✅ Yes | ✅ Yes | ✅ Yes |
| Server reboot | ✅ Yes | ✅ Yes | ✅ Yes |
| Docker volume remains | ✅ Yes | ✅ Yes | ✅ Yes |

### **❌ Files WILL BE LOST (Dangerous)**

| Scenario | Local Storage | MinIO | Database |
|----------|---------------|-------|----------|
| Docker volume deleted | ❌ Lost | ❌ Lost | ✅ Safe |
| Manual file deletion | ❌ Lost | ❌ Lost | ✅ Safe |
| Host disk failure | ❌ Lost | ❌ Lost | ❌ Lost* |

*Unless database has backups/replication

## 🛡️ **Why Files Persist During Rebuilds**

### **Docker Volumes are Separate from Containers**

```bash
# Your app container
beout-server ────→ Volume: beout_uploads
     ↓ rebuild           ↓ persists
beout-server-new ───→ Volume: beout_uploads (same data!)
```

**What Happens During Dockploy Rebuild:**
1. Dockploy pulls new image
2. Stops old container
3. Starts new container
4. **Mounts same volume** with all files
5. Files are exactly where they were before!

## 📋 **Verification Commands**

### **Check Your File Storage**

```bash
# List Docker volumes
docker volume ls

# Inspect upload volume
docker volume inspect beout_uploads

# See actual files on host
sudo ls -la /var/lib/docker/volumes/beout_uploads/_data/

# Check container mount
docker exec beout-server ls -la /app/uploads/
```

### **Test Persistence**

```bash
# 1. Upload a test file through your app
# 2. Note the file location
# 3. Rebuild your container:
docker-compose down
docker-compose up -d
# 4. Check if file still exists
docker exec beout-server ls -la /app/uploads/public/avatars/
```

## 🚨 **Common Misconceptions**

### **❌ WRONG: "Files are inside the container"**
Files are NOT stored inside the container. They're stored in Docker volumes on the host machine.

### **❌ WRONG: "Rebuild will delete files"**
Container rebuilds do NOT delete volumes. Volumes persist independently.

### **❌ WRONG: "Need to backup before deploy"**
Files are safe during normal deployments. Only backup before major changes.

### **✅ CORRECT: "Files are in Docker volumes"**
Files are stored in persistent Docker volumes that survive container changes.

## 📂 **File Path Examples**

### **Local Storage Example**

When you upload `avatar.jpg`:

```
Physical Host Path:
/var/lib/docker/volumes/beout_uploads/_data/public/avatars/12345-avatar.jpg

Container Path:
/app/uploads/public/avatars/12345-avatar.jpg

Web URL:
https://yourdomain.com/uploads/public/avatars/12345-avatar.jpg

Database Record:
user_profiles.avatar_url = '/uploads/public/avatars/12345-avatar.jpg'
```

### **MinIO Example**

When you upload `event-image.jpg`:

```
Physical Host Path:
/var/lib/docker/volumes/minio_data/_data/beout-files/public/events/67890-event.jpg

MinIO Object Path:
beout-files/public/events/67890-event.jpg

Web URL:
https://minio.yourdomain.com/beout-files/public/events/67890-event.jpg

Database Record:
events.image_url = 'https://minio.yourdomain.com/beout-files/public/events/67890-event.jpg'
```

## 🔧 **Managing File Storage**

### **Backup Your Files**

```bash
# Backup local storage
tar -czf uploads_backup.tar.gz /var/lib/docker/volumes/beout_uploads/_data/

# Backup MinIO storage
tar -czf minio_backup.tar.gz /var/lib/docker/volumes/minio_data/_data/
```

### **Restore Files**

```bash
# Stop containers
docker-compose down

# Restore files
tar -xzf uploads_backup.tar.gz -C /

# Start containers
docker-compose up -d
```

### **Monitor Disk Usage**

```bash
# Check volume sizes
docker system df -v

# Check specific volume
du -sh /var/lib/docker/volumes/beout_uploads/_data/
```

## 🎯 **Recommendations**

### **For Development**
- ✅ Use **Local Storage** (current implementation)
- Simple, fast, easy to debug
- Files in `/var/lib/docker/volumes/beout_uploads/_data/`

### **For Production**
- ✅ Use **MinIO** for scalability
- Better performance and management
- Files in `/var/lib/docker/volumes/minio_data/_data/`

### **For Small Scale**
- ✅ Use **Local Storage** with regular backups
- Set up automated backups to external storage

## 💡 **Key Takeaway**

**Your uploaded files (avatars, event images, documents) are stored in Docker volumes on your Dockploy server's disk and WILL persist through:**
- Container restarts
- Container rebuilds
- App redeployments
- Server reboots

**Files will only be lost if:**
- You manually delete the Docker volume
- The server's disk fails (backup important!)
- You explicitly remove the volume

The files are NOT stored inside the container - they're stored in persistent volumes that are mounted into the container, ensuring they survive any container changes!
