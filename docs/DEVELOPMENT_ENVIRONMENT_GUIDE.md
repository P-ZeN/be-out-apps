# Development Environment Guide

## Overview
This project consists of multiple applications that run simultaneously during development:
- **Server** (Backend API) - Port 3000
- **Client** (User App) - Port 5173
- **Admin Client** (Admin Panel) - Port 5174
- **Organizer Client** (Organizer Panel) - Port 5175

## Important Notes for Development

### Always Running Applications
⚠️ **CRITICAL**: All applications are typically running during development work. Before starting any app, check if it's already running to avoid port conflicts.

### Windows PowerShell Commands
This project runs on Windows with PowerShell as the default shell. **Never use Linux/bash syntax**.

## Correct Commands for Each Application

### Server (Backend API)
```powershell
# Navigate and start
cd y:\be-out\be-out-app\server
npm run dev

# Port: 3000
# API Base URL: http://localhost:3000
```

### Client (User App)
```powershell
# Navigate and start
cd y:\be-out\be-out-app\client
npm run dev

# Port: 5173
# URL: http://localhost:5173
```

### Admin Client (Admin Panel)
```powershell
# Navigate and start
cd y:\be-out\be-out-app\admin-client
npm run dev

# Port: 5174
# URL: http://localhost:5174
```

### Organizer Client (Organizer Panel)
```powershell
# Navigate and start
cd y:\be-out\be-out-app\organizer-client
npm run dev

# Port: 5175
# URL: http://localhost:5175
```

## How to Stop Running Applications

### Method 1: Using Process Manager
1. Open Task Manager (Ctrl + Shift + Esc)
2. Find Node.js processes
3. End the specific processes

### Method 2: Using PowerShell (if you know the PID)
```powershell
# Find Node.js processes
Get-Process node

# Kill specific process by PID
Stop-Process -Id <PID>

# Kill all Node.js processes (DANGER: This kills ALL Node processes)
Get-Process node | Stop-Process
```

### Method 3: Using netstat to find port usage
```powershell
# Check what's running on specific ports
netstat -ano | findstr :3000    # Server
netstat -ano | findstr :5173    # Client
netstat -ano | findstr :5174    # Admin Client
netstat -ano | findstr :5175    # Organizer Client

# Kill process by PID found in netstat
Stop-Process -Id <PID>
```

## Common Mistakes to Avoid

### ❌ Wrong Commands
```bash
# DON'T USE - This is Linux/bash syntax
cd /path/to/project && npm run dev

# DON'T USE - Wrong path format for Windows
cd y:/be-out/be-out-app/client && npm run dev
```

### ✅ Correct Commands
```powershell
# DO USE - Windows PowerShell syntax
cd y:\be-out\be-out-app\client
npm run dev
```

### ❌ Wrong Application Paths
```powershell
# DON'T USE - Wrong project root
cd y:\be-out\be-out-app
npm run dev  # This won't work - no package.json here
```

### ✅ Correct Application Paths
```powershell
# DO USE - Specific application directories
cd y:\be-out\be-out-app\client        # For user app
cd y:\be-out\be-out-app\admin-client   # For admin panel
cd y:\be-out\be-out-app\server         # For backend API
```

## Development Workflow

### Starting Fresh Development Session

#### Option 1: Start All Apps at Once (Recommended)
```powershell
# Navigate to project root
cd y:\be-out\be-out-app

# Check if ports are free first
netstat -ano | findstr ":3000 :5173 :5174 :5175"

# Start all applications simultaneously using concurrently
npm run dev
```

This single command starts all 4 applications:
- Server (port 3000)
- Client (port 5173)
- Admin Client (port 5174)
- Organizer Client (port 5175)

#### Option 2: Start Individual Apps (For Debugging)
```powershell
# Start only specific applications
cd y:\be-out\be-out-app

npm run dev:server     # Server only
npm run dev:client     # Client only
npm run dev:admin      # Admin Client only
npm run dev:organizer  # Organizer Client only
```

#### Option 3: Manual Individual Startup (Not Recommended)
```powershell
# Only use this if you need granular control
cd y:\be-out\be-out-app\server
npm run dev

# In separate terminals:
cd y:\be-out\be-out-app\client
npm run dev

cd y:\be-out\be-out-app\admin-client
npm run dev

cd y:\be-out\be-out-app\organizer-client
npm run dev
```

### Testing Changes
- **Backend changes**: Server auto-restarts with nodemon
- **Frontend changes**: Vite auto-reloads the browser
- **Translation changes**: May require browser refresh
- **Package.json changes**: Requires restart of the specific app

## Environment Variables

### Server (.env)
- Database connection strings
- JWT secrets
- API keys

### Client Apps (.env)
- `VITE_API_URL=http://localhost:3000`
- `VITE_NODE_ENV=development`

## Debugging Tips

### Port Conflicts
```powershell
# Check what's using a port
netstat -ano | findstr :5173

# Kill the process
Stop-Process -Id <PID>
```

### Application Not Loading
1. Check if the server (port 3000) is running
2. Check browser console for API connection errors
3. Verify environment variables are set correctly
4. Check if the correct port is being used

### Translation Issues
1. Check if translation files exist in `src/i18n/locales/`
2. Verify translation keys match the JSON structure
3. Check browser console for i18next errors
4. Ensure namespace is correctly specified in useTranslation hook

## Quick Reference

| App | Path | Port | URL |
|-----|------|------|-----|
| Server | `y:\be-out\be-out-app\server` | 3000 | http://localhost:3000 |
| Client | `y:\be-out\be-out-app\client` | 5173 | http://localhost:5173 |
| Admin | `y:\be-out\be-out-app\admin-client` | 5174 | http://localhost:5174 |
| Organizer | `y:\be-out\be-out-app\organizer-client` | 5175 | http://localhost:5175 |

---
**Remember**: Always check if applications are already running before starting them, and use Windows PowerShell syntax for all commands!
