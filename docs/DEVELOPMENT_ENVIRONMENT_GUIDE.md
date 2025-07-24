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

### WSL/Linux Environment
This project now runs on WSL (Windows Subsystem for Linux) with bash as the default shell. Use Linux/bash syntax for all commands.

## Correct Commands for Each Application

### Server (Backend API)
```bash
# Navigate and start
cd /home/zen/dev/be-out-apps/server
npm run dev

# Port: 3000
# API Base URL: http://localhost:3000
```

### Client (User App)
```bash
# Navigate and start
cd /home/zen/dev/be-out-apps/client
npm run dev

# Port: 5173
# URL: http://localhost:5173
```

### Admin Client (Admin Panel)
```bash
# Navigate and start
cd /home/zen/dev/be-out-apps/admin-client
npm run dev

# Port: 5174
# URL: http://localhost:5174
```

### Organizer Client (Organizer Panel)
```bash
# Navigate and start
cd /home/zen/dev/be-out-apps/organizer-client
npm run dev

# Port: 5175
# URL: http://localhost:5175
```

## How to Stop Running Applications

### Method 1: Using Process Manager
1. Find Node.js processes: `ps aux | grep node`
2. Kill specific processes: `kill <PID>`

### Method 2: Using killall
```bash
# Kill all node processes (use with caution)
killall node

# Or more specifically
pkill -f "npm run dev"
```

### Method 3: Using netstat to find port usage
```bash
# Check what's running on specific ports
netstat -tlnp | grep :3000    # Server
netstat -tlnp | grep :5173    # Client
netstat -tlnp | grep :5174    # Admin Client
netstat -tlnp | grep :5175    # Organizer Client

# Alternative using lsof
lsof -i :3000    # Server
lsof -i :5173    # Client
lsof -i :5174    # Admin Client
lsof -i :5175    # Organizer Client

# Kill process by PID
kill <PID>
```

## Common Mistakes to Avoid

### ❌ Wrong Commands
```powershell
# DON'T USE - This is Windows PowerShell syntax
cd y:\be-out\be-out-app\client
npm run dev
```

### ✅ Correct Commands
```bash
# DO USE - Linux/bash syntax for WSL
cd /home/zen/dev/be-out-apps/client
npm run dev
```

### ❌ Wrong Application Paths
```bash
# DON'T USE - Wrong project root
cd /home/zen/dev/be-out-apps
npm run dev  # This won't work - no package.json here
```

### ✅ Correct Application Paths
```bash
# DO USE - Specific application directories
cd /home/zen/dev/be-out-apps/client        # For user app
cd /home/zen/dev/be-out-apps/admin-client   # For admin panel
cd /home/zen/dev/be-out-apps/server         # For backend API
cd /home/zen/dev/be-out-apps/organizer-client  # For organizer panel
```

## Development Workflow

### Starting Fresh Development Session

#### Option 1: Start All Apps at Once (Recommended)
```bash
# Navigate to project root
cd /home/zen/dev/be-out-apps

# Check if ports are free first
netstat -tlnp | grep -E ":(3000|5173|5174|5175) "

# Start all applications simultaneously using concurrently
npm run dev
```

This single command starts all 4 applications:
- Server (port 3000)
- Client (port 5173)
- Admin Client (port 5174)
- Organizer Client (port 5175)

#### Option 2: Start Individual Apps (For Debugging)
```bash
# Start only specific applications
cd /home/zen/dev/be-out-apps

npm run dev:server     # Server only
npm run dev:client     # Client only
npm run dev:admin      # Admin Client only
npm run dev:organizer  # Organizer Client only
```

#### Option 3: Manual Individual Startup (Not Recommended)
```bash
# Only use this if you need granular control
cd /home/zen/dev/be-out-apps/server
npm run dev

# In separate terminals:
cd /home/zen/dev/be-out-apps/client
npm run dev

cd /home/zen/dev/be-out-apps/admin-client
npm run dev

cd /home/zen/dev/be-out-apps/organizer-client
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
```bash
# Check what's using a port
lsof -i :5173

# Or using netstat
netstat -tlnp | grep :5173

# Kill the process
kill <PID>
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
| Server | `/home/zen/dev/be-out-apps/server` | 3000 | http://localhost:3000 |
| Client | `/home/zen/dev/be-out-apps/client` | 5173 | http://localhost:5173 |
| Admin | `/home/zen/dev/be-out-apps/admin-client` | 5174 | http://localhost:5174 |
| Organizer | `/home/zen/dev/be-out-apps/organizer-client` | 5175 | http://localhost:5175 |

## Tauri Mobile Build

### Android Build Process
For building the Android version of the client app using Tauri, the build must be run from the **root directory** due to the monorepo nature of the project. Use the following command with the required environment variables:

```bash
cd /home/zen/dev/be-out-apps

# Set environment variables and build for Android
export VITE_API_URL="https://server.be-out-app.dedibox2.philippezenone.net" && \
export VITE_GOOGLE_CLIENT_ID_DESKTOP="1064619689471-mrna5dje1h4ojt62d9ckmqi3e8q07sjc.apps.googleusercontent.com" && \
export VITE_MAPBOX_ACCESS_TOKEN="pk.eyJ1IjoicGhpbGlwcGV6ZW5vbmUiLCJhIjoiY21jeXQyemdpMHRwazJrc2JkdG9vZzViaCJ9.0h5JWCXgM5nY6hrDtj-vsw" && \
npm run tauri:android:build
```

⚠️ **Important**: Always run the Tauri build from the project root (`/home/zen/dev/be-out-apps`) to ensure all monorepo dependencies and build configurations are properly resolved.

### Prerequisites for Tauri Android Build
Before running the build command, ensure you have the following installed and configured:

#### 1. Java Development Kit (JDK 17 or higher)
```bash
# Install OpenJDK 17
sudo apt update
sudo apt install openjdk-17-jdk

# Verify installation
java -version
javac -version
```

#### 2. Android SDK and NDK
```bash
# Install Android SDK command line tools
# Download from: https://developer.android.com/studio/index.html#command-tools
# Or install Android Studio for easier setup
sudo snap install android-studio --classic

# Set environment variables (add to ~/.bashrc or ~/.zshrc)
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_NDK_ROOT="$ANDROID_HOME/ndk/26.1.10909125"  # Check your NDK version
export NDK_HOME="$ANDROID_HOME/ndk/26.1.10909125"  # Required by Tauri
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

# Reload environment variables
source ~/.bashrc
```

#### 3. Install Required Android SDK Components
```bash
# Accept licenses
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

# Install required SDK components
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0" "ndk;26.1.10909125"
```

#### 4. Install Rust Android Targets
```bash
# Install required Rust targets for Android
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

#### 5. Initialize Tauri Android Project
```bash
# Run from project root
cd /home/zen/dev/be-out-apps
npm run tauri:android:init
```

### Setting up Android Development Environment
```bash
# Verify Android SDK and NDK paths are set correctly
echo $ANDROID_HOME
echo $ANDROID_NDK_ROOT

# Check if Android targets are installed
rustup target list --installed | grep android

# Verify Android SDK tools
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --list | grep "build-tools\|platforms\|ndk"
```

### Android App Signing Setup

#### 1. Create a Keystore (One-time setup)
```bash
# Navigate to Tauri source directory
cd /home/zen/dev/be-out-apps/client/src-tauri

# Create keystore directory
mkdir -p keystore

# Generate release keystore
cd keystore
keytool -genkey -v -keystore be-out-release.keystore -alias be-out -keyalg RSA -keysize 2048 -validity 10000
```

Follow the prompts to enter:
- Keystore password (remember this!)
- Key password (can be same as keystore password)
- Your name and organization details

#### 2. Configure Signing (Automatic)
The signing configuration is automatically set up in the Android build files. The keystore passwords are handled securely by the build script.

#### 3. Build Signed APK
```bash
# Use the secure build script
/home/zen/dev/be-out-apps/client/src-tauri/build-signed-android.sh
```

This script will:
- Prompt for your keystore passwords securely
- Build the signed APK and AAB
- Clean up password files after build

#### Manual Build (Alternative)
If you prefer to build manually:
```bash
cd /home/zen/dev/be-out-apps

# Update keystore.properties with your actual passwords
# Then run the normal build
export VITE_API_URL="https://server.be-out-app.dedibox2.philippezenone.net" && \
export VITE_GOOGLE_CLIENT_ID_DESKTOP="1064619689471-mrna5dje1h4ojt62d9ckmqi3e8q07sjc.apps.googleusercontent.com" && \
export VITE_MAPBOX_ACCESS_TOKEN="pk.eyJ1IjoicGhpbGlwcGV6ZW5vbmUiLCJhIjoiY21jeXQyemdpMHRwazJrc2JkdG9vZzViaCJ9.0h5JWCXgM5nY6hrDtj-vsw" && \
npm run tauri:android:build
```

### Build Output Locations
After a successful signed build, you'll find:
- **Signed APK**: `client/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk`
- **Signed AAB**: `client/src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab`

### Security Notes
- Keep your keystore file (`be-out-release.keystore`) secure and backed up
- Never commit keystore passwords to version control
- The build script automatically cleans up passwords after build
- Use the AAB file for Google Play Store deployment
- Use the APK file for direct installation or testing

---
**Remember**: Use Linux/bash syntax for all commands in WSL environment!
