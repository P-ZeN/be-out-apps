# Fix for "tail error: inotify cannot be used, reverting to polling" Issue

## Problem Description
This error occurs when the Linux system reaches its inotify file descriptor limits. This is common when deploying multiple applications with file watchers or log monitoring.

## Solution 1: Increase inotify limits (Server-side fix)

### SSH into your Dockploy server and run:

```bash
# Check current limits
cat /proc/sys/fs/inotify/max_user_watches
cat /proc/sys/fs/inotify/max_user_instances

# Increase the limits temporarily
sudo sysctl fs.inotify.max_user_watches=524288
sudo sysctl fs.inotify.max_user_instances=8192

# Make the changes permanent
echo 'fs.inotify.max_user_watches=524288' | sudo tee -a /etc/sysctl.conf
echo 'fs.inotify.max_user_instances=8192' | sudo tee -a /etc/sysctl.conf

# Apply the changes
sudo sysctl -p
```

### Alternative permanent fix (create a dedicated config file):

```bash
# Create a dedicated inotify config file
sudo tee /etc/sysctl.d/10-inotify.conf << 'EOF'
fs.inotify.max_user_watches=524288
fs.inotify.max_user_instances=8192
fs.inotify.max_queued_events=32768
EOF

# Apply the changes
sudo sysctl -p /etc/sysctl.d/10-inotify.conf
```

## Solution 2: Optimize Docker/Nixpacks Configuration

### Update nixpacks.toml to reduce file watching:

```toml
# Tell Nixpacks how to build the application
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.build]
cmds = ["npm run build"]

# Tell Nixpacks how to start the application
[start]
cmd = "npx serve -s dist -l 80 --no-clipboard"

[variables]
NODE_ENV = "production"
```

## Solution 3: Docker Optimization

### Add these to your Dockerfile to reduce file watching:

```dockerfile
# Add to your Dockerfile
ENV NODE_ENV=production
ENV CI=true
ENV NO_UPDATE_NOTIFIER=true
ENV npm_config_fund=false
ENV npm_config_audit=false
```

## Solution 4: Check and Clean Up Processes

```bash
# Check processes using inotify
sudo lsof | grep inotify
ps aux | grep tail

# Kill any unnecessary tail processes
sudo pkill -f "tail -f"

# Restart Docker if needed
sudo systemctl restart docker
```

## Verification

After applying the fixes, verify the changes:

```bash
# Check new limits
cat /proc/sys/fs/inotify/max_user_watches
cat /proc/sys/fs/inotify/max_user_instances

# Check inotify usage
find /proc/*/fd -lname anon_inode:inotify 2>/dev/null | wc -l
```

## Prevention

1. **Monitor inotify usage regularly**
2. **Use proper environment variables in production**
3. **Avoid running development watchers in production**
4. **Use polling instead of inotify for non-critical file watching**

## Notes

- These limits affect the entire system, not just your application
- Higher limits use more kernel memory
- Start with the suggested values and adjust if needed
- Monitor your system resources after making changes
