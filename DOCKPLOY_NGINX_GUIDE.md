# 🔧 Dockploy Nginx Configuration Guide
# How to serve uploaded files in Dockploy

## 🤔 Where to Configure Nginx in Dockploy?

Dockploy handles nginx differently depending on your setup. Here are the options:

## Option 1: Dockploy's Built-in Reverse Proxy

If you're using Dockploy's built-in reverse proxy:

1. **Go to your app in Dockploy**
2. **Look for "Domains" or "Routing" section**
3. **Add a new route for static files:**
   - Path: `/uploads/*`
   - Target: File serving (if available)

## Option 2: Custom Nginx Container

If you need more control, add a separate nginx service:

1. **Create a new "Generic" app in Dockploy**
2. **Use this simple nginx setup:**

```dockerfile
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
```

3. **Mount the same volume as your server**

## Option 3: Simple Solution - Serve Files from Node.js

**EASIEST APPROACH:** Let your Node.js server serve the files directly!

### Update your server code:

```javascript
// Add this to your server/src/index.js
import express from 'express';
import path from 'path';

const app = express();

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    setHeaders: (res, path) => {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');

        // Cache images for 1 year
        if (path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// Your existing routes...
```

## Option 4: Check Dockploy Documentation

Different Dockploy versions have different nginx configuration methods:

1. **Look for "Proxy" or "Routing" in your app settings**
2. **Check if there's a "Custom nginx config" option**
3. **Look for "Static files" or "File serving" options**

## 🎯 Recommended: Use Node.js Static Serving

Since you already have a Node.js server, the simplest approach is to serve files directly from Node.js. This works with any Dockploy setup and requires no nginx configuration.

Would you like me to show you how to update your server code to serve static files?
