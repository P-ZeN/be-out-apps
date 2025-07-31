#!/bin/bash

# Script to fix Tauri Android icons and rebuild the app

echo "🔧 Fixing Tauri Android icons..."

# Navigate to client directory
cd "$(dirname "$0")"

echo "📁 Current directory: $(pwd)"

# Verify icons exist
if [ ! -f "src-tauri/icons/android-icon-48.png" ]; then
    echo "❌ Android icons not found in src-tauri/icons/"
    exit 1
fi

echo "✅ Icons found, copying to Android resource directories..."

# Ensure directories exist
mkdir -p src-tauri/res/android/mipmap-mdpi
mkdir -p src-tauri/res/android/mipmap-hdpi
mkdir -p src-tauri/res/android/mipmap-xhdpi
mkdir -p src-tauri/res/android/mipmap-xxhdpi
mkdir -p src-tauri/res/android/mipmap-xxxhdpi

# Copy icons to proper Android mipmap directories
cp src-tauri/icons/android-icon-48.png src-tauri/res/android/mipmap-mdpi/ic_launcher.png
cp src-tauri/icons/android-icon-48.png src-tauri/res/android/mipmap-mdpi/ic_launcher_round.png

cp src-tauri/icons/android-icon-72.png src-tauri/res/android/mipmap-hdpi/ic_launcher.png
cp src-tauri/icons/android-icon-72.png src-tauri/res/android/mipmap-hdpi/ic_launcher_round.png

cp src-tauri/icons/android-icon-96.png src-tauri/res/android/mipmap-xhdpi/ic_launcher.png
cp src-tauri/icons/android-icon-96.png src-tauri/res/android/mipmap-xhdpi/ic_launcher_round.png

cp src-tauri/icons/android-icon-144.png src-tauri/res/android/mipmap-xxhdpi/ic_launcher.png
cp src-tauri/icons/android-icon-144.png src-tauri/res/android/mipmap-xxhdpi/ic_launcher_round.png

cp src-tauri/icons/android-icon-192.png src-tauri/res/android/mipmap-xxxhdpi/ic_launcher.png
cp src-tauri/icons/android-icon-192.png src-tauri/res/android/mipmap-xxxhdpi/ic_launcher_round.png

echo "✅ Icons copied successfully!"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf src-tauri/gen/android/app/build/
rm -rf build/

# Clean Rust build cache to avoid plugin issues
echo "🧹 Cleaning Rust cache..."
cd src-tauri && cargo clean && cd ..

# Build the web assets
echo "🏗️ Building web assets..."
npm run build

# Build the Tauri app
echo "📱 Building Tauri Android app..."
cd src-tauri
cargo tauri android build --apk

echo "🎉 Build complete! Check the APK in src-tauri/gen/android/app/build/outputs/apk/"
echo "🔍 Install with: adb install -r gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk"
