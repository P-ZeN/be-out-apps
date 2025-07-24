#!/bin/bash

# Script to build signed Android APK
# This script will prompt for keystore passwords securely

echo "🔑 Android APK Signing Configuration"
echo "====================================="

# Check if keystore exists
KEYSTORE_PATH="/home/zen/dev/be-out-apps/client/src-tauri/keystore/be-out-release.keystore"
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "❌ Keystore not found at: $KEYSTORE_PATH"
    echo "Please run the keystore generation first!"
    exit 1
fi

# Prompt for passwords securely
echo "Please enter your keystore password:"
read -s KEYSTORE_PASSWORD
echo

echo "Please enter your key password (or press Enter if same as keystore password):"
read -s KEY_PASSWORD
echo

# Use keystore password for key password if not provided
if [ -z "$KEY_PASSWORD" ]; then
    KEY_PASSWORD="$KEYSTORE_PASSWORD"
fi

# Create temporary keystore.properties with actual passwords
KEYSTORE_PROPS="/home/zen/dev/be-out-apps/client/src-tauri/keystore.properties"
cat > "$KEYSTORE_PROPS" << EOF
storeFile=keystore/be-out-release.keystore
storePassword=$KEYSTORE_PASSWORD
keyAlias=be-out
keyPassword=$KEY_PASSWORD
EOF

echo "🏗️  Building signed Android APK..."
echo "=================================="

# Navigate to project root and build
cd /home/zen/dev/be-out-apps

# Set environment variables and build
export VITE_API_URL="https://server.be-out-app.dedibox2.philippezenone.net"
export VITE_GOOGLE_CLIENT_ID_DESKTOP="1064619689471-mrna5dje1h4ojt62d9ckmqi3e8q07sjc.apps.googleusercontent.com"
export VITE_MAPBOX_ACCESS_TOKEN="pk.eyJ1IjoicGhpbGlwcGV6ZW5vbmUiLCJhIjoiY21jeXQyemdpMHRwazJrc2JkdG9vZzViaCJ9.0h5JWCXgM5nY6hrDtj-vsw"

npm run tauri:android:build

# Clean up - remove passwords from file
cat > "$KEYSTORE_PROPS" << EOF
storeFile=keystore/be-out-release.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=be-out
keyPassword=YOUR_KEY_PASSWORD
EOF

echo ""
echo "🎉 Build completed!"
echo "=================="
echo "Signed APK location:"
echo "/home/zen/dev/be-out-apps/client/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk"
echo ""
echo "Signed AAB location:"
echo "/home/zen/dev/be-out-apps/client/src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab"
