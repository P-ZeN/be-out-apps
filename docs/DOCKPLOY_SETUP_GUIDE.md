# 🚨 DOCKPLOY CONFIGURATION GUIDE 🚨
# How to add file storage to your EXISTING Dockploy setup
# WITHOUT breaking your current deployment

## Step 1: Update Your Server App in Dockploy

### Environment Variables to ADD:
```
UPLOAD_PATH=/app/uploads
PUBLIC_FILES_URL=https://yourdomain.com/uploads
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
ALLOWED_DOCUMENT_TYPES=application/pdf,application/msword
```

### Volume Mount to ADD:
- Container Path: `/app/uploads`
- Volume Name: `beout_uploads`
- Access Mode: Read/Write

## Step 2: Update Your Reverse Proxy/Nginx

Add this location block to serve static files:
```nginx
location /uploads/ {
    # Adjust path based on your Dockploy volume mounting
    alias /var/lib/docker/volumes/beout_uploads/_data/;
    add_header Access-Control-Allow-Origin *;
    add_header Cache-Control "public, max-age=31536000";
}
```

## Step 3: Redeploy ONLY the Server

- Click "Redeploy" on your server app in Dockploy
- Your client apps (admin, organizer, main) stay untouched
- Files will start persisting immediately

## ⚠️ What NOT to Do:
- ❌ Don't use the docker-compose.yml file directly
- ❌ Don't redeploy all apps at once
- ❌ Don't change your existing client configurations
- ❌ Don't modify your database connection settings

## ✅ What This Achieves:
- ✅ Event images uploaded via organizer-client persist
- ✅ Event images uploaded via admin-client persist  
- ✅ Files survive container rebuilds and redeployments
- ✅ Your existing setup remains unchanged
- ✅ Zero downtime for your running apps

## File Upload URLs After Setup:
- Upload: POST https://api.yourdomain.com/api/files/event-image
- View: GET https://yourdomain.com/uploads/public/events/filename.jpg

The file upload routes are already implemented in your server code!
Just add the environment variables and volume mount, then redeploy the server only.
