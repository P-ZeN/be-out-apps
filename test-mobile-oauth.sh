#!/bin/bash

# Android OAuth Testing Script
# This script helps test the Android OAuth implementation

echo "🚀 Starting Android OAuth Testing..."

# Check if server is running
echo "📡 Checking server status..."
curl -s http://localhost:3000/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Please start the server first:"
    echo "   cd server && npm start"
    exit 1
fi

# Check mobile endpoints
echo "🔍 Testing mobile OAuth endpoints..."

echo "Testing /api/oauth/google/mobile-callback endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/oauth/google/mobile-callback \
    -H "Content-Type: application/json" \
    -d '{"idToken": "test"}')

if [ "$response" = "400" ] || [ "$response" = "401" ]; then
    echo "✅ mobile-callback endpoint responds (expected 400/401 for test token)"
else
    echo "❌ mobile-callback endpoint error: HTTP $response"
fi

echo "Testing /api/oauth/google/mobile-profile-callback endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/oauth/google/mobile-profile-callback \
    -H "Content-Type: application/json" \
    -d '{"email": "test@test.com", "displayName": "Test User"}')

if [ "$response" = "400" ] || [ "$response" = "401" ] || [ "$response" = "200" ]; then
    echo "✅ mobile-profile-callback endpoint responds"
else
    echo "❌ mobile-profile-callback endpoint error: HTTP $response"
fi

echo ""
echo "📱 Android Testing Instructions:"
echo "1. Build the Android app: cd client && npm run tauri android build"
echo "2. Install on device: adb install client/src-tauri/gen/android/app/build/outputs/apk/debug/app-debug.apk"
echo "3. Test Google Sign-in button"
echo "4. Check logs with: adb logcat | grep -E '(GoogleAuth|BeOut|Tauri)'"
echo ""
echo "🍎 iOS Testing Instructions:"
echo "1. Build the iOS app: cd client && npm run tauri ios build"
echo "2. Open in Xcode: open client/src-tauri/gen/apple"
echo "3. Test on simulator or device"
echo "4. Check iOS logs in Xcode console"

echo ""
echo "✅ Test script complete!"
