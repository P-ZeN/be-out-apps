# Translation Persistence Deployment Guide

## Pre-Deployment Checklist

### 1. Add Volume Mount in Dockploy

Navigate to your server configuration in Dockploy and add:

**Volume Mount:**
- Container Path: `/app/translations`
- Volume Name: `beout_translations`
- Access Mode: Read/Write

### 2. Add Environment Variable

In Dockploy environment variables, add:
```
TRANSLATIONS_PATH=/app/translations
```

### 3. Deploy Updated Code

Deploy the updated server code. The migration script will run automatically on startup.

## Post-Deployment Verification

### 1. Check Migration Logs

In Dockploy logs, you should see:
```
Starting translation migration...
Source: /app/server/translations
Target: /app/translations
✓ Translations migrated successfully
```

### 2. Verify Translation Files

Connect to your container and check:
```bash
# List translation directories
ls -la /app/translations/

# Should show: en/ fr/ es/
```

### 3. Test Admin Interface

1. Go to admin translation management
2. Make a test change to any translation
3. Verify the change persists after container restart

## Troubleshooting

### Migration Fails
- Check volume mount is correctly configured
- Ensure `TRANSLATIONS_PATH` environment variable is set
- Check container logs for detailed error messages

### Translations Not Persisting
- Verify volume is mounted at `/app/translations`
- Check file permissions in the volume
- Ensure environment variable points to correct path

### Admin Interface Shows Empty Translations
- Check if migration completed successfully
- Verify volume contains translation files
- Check admin routes are using correct translation path

## Rollback Plan

If issues occur, you can temporarily rollback by:

1. Remove environment variable `TRANSLATIONS_PATH`
2. This will make the system use git repo translations again
3. Fix volume/migration issues
4. Re-add environment variable when ready

## Backup Recommendations

### Manual Backup
```bash
# Create backup
docker exec <container-name> tar -czf /tmp/translations-backup.tar.gz -C /app translations/

# Copy to host
docker cp <container-name>:/tmp/translations-backup.tar.gz ./translations-backup-$(date +%Y%m%d).tar.gz
```

### Automated Backup
Consider setting up automated backups of the `beout_translations` volume in Dockploy.

## Common Deployment Issues

### inotify Error: "Too many open files"

**Error Message:**

```bash
tail error: tail: inotify cannot be used, reverting to polling: Too many open files
```

**What it means:**

- Container hit file descriptor limit
- System falls back to less efficient file watching
- Application continues to work normally

**Solutions:**

1. **Check for Docker ulimit settings** in Dockploy advanced configuration
2. **Add ulimit parameter** if supported: `--ulimit nofile=65536:65536`
3. **Safe to ignore** - this is mostly a performance optimization issue

**Impact:** Minimal - application functions normally, just uses more CPU for file monitoring.
