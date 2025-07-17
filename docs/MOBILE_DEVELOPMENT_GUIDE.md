# Mobile App Development Setup Guide

This guide will help you set up the development environment for building mobile apps (Android and iOS) using Tauri.

## Prerequisites

### For Android Development

1. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK API 33 or later
   - Install Android NDK (version 25.2.9519653 recommended)

2. **Set Environment Variables**
   ```powershell
   # Add these to your system environment variables
   ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
   NDK_HOME=%ANDROID_HOME%\ndk\25.2.9519653
   
   # Add to PATH
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   %ANDROID_HOME%\platform-tools
   ```

3. **Install Java Development Kit (JDK)**
   - Install JDK 17 or later
   - Set JAVA_HOME environment variable

### For iOS Development (macOS only)

1. **Install Xcode**
   - Download from Mac App Store
   - Install Xcode Command Line Tools: `xcode-select --install`

2. **Install iOS Simulator**
   - Open Xcode → Preferences → Components
   - Install desired iOS simulator versions

3. **Apple Developer Account**
   - Required for device testing and App Store submission
   - Configure signing certificates and provisioning profiles

## Development Environment Setup

### 1. Install Rust
```powershell
# Install Rust
winget install Rustlang.Rustup

# Add mobile targets
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
```

### 2. Install Tauri CLI
```powershell
# Global installation
npm install -g @tauri-apps/cli@latest

# Or use the local version
npm install
```

### 3. Initialize Mobile Platforms

#### Android
```powershell
# Initialize Android support
tauri android init

# This will create:
# - src-tauri/gen/android/ directory
# - Android project files
# - Gradle configuration
```

#### iOS (macOS only)
```powershell
# Note: iOS support in Tauri 2.x is still in development
# Check official documentation for latest updates
```

## Building the Apps

### Development Mode

#### Desktop
```powershell
npm run tauri:dev
```

#### Android
```powershell
# Run on Android emulator/device
npm run tauri:android
# or
tauri android dev

# Specify target device
tauri android dev --device <device-id>
```

#### iOS (macOS only)
```powershell
# Note: iOS dev commands will be available when support is stable
npm run tauri:ios
```

### Production Builds

#### Desktop
```powershell
npm run tauri:build
```

#### Android APK/AAB
```powershell
# Build APK for testing
npm run tauri:android:build
# or
tauri android build

# Build AAB for Google Play Store
tauri android build --apk --aab
```

#### iOS IPA (macOS only)
```powershell
npm run tauri:ios:build
```

## Testing

### Android Testing

1. **Emulator Testing**
   ```powershell
   # List available emulators
   emulator -list-avds
   
   # Start emulator
   emulator -avd <avd-name>
   
   # Run app on emulator
   tauri android dev
   ```

2. **Physical Device Testing**
   ```powershell
   # Enable USB debugging on device
   # Connect device via USB
   
   # Check connected devices
   adb devices
   
   # Run app on device
   tauri android dev --device <device-id>
   ```

### iOS Testing (macOS only)

1. **Simulator Testing**
   ```bash
   # List available simulators
   xcrun simctl list devices
   
   # Run app on simulator
   tauri ios dev
   ```

2. **Physical Device Testing**
   - Requires Apple Developer Account
   - Configure signing certificates
   - Add device UDID to provisioning profile

## App Store Deployment

### Google Play Store (Android)

1. **Prepare Release Build**
   ```powershell
   # Build signed AAB
   tauri android build --aab
   ```

2. **App Store Requirements**
   - App signing key (store in secure location)
   - App metadata and descriptions
   - Screenshots for different device sizes
   - Privacy policy URL
   - Content rating

3. **Upload to Play Console**
   - Create app listing in Google Play Console
   - Upload AAB file
   - Complete store listing
   - Set pricing and distribution
   - Submit for review

### Apple App Store (iOS)

1. **Prepare Release Build**
   ```bash
   # Build for App Store
   tauri ios build --release
   ```

2. **App Store Requirements**
   - Apple Developer Program membership ($99/year)
   - App Store distribution certificate
   - App Store provisioning profile
   - App metadata and screenshots
   - App review guidelines compliance

3. **Upload to App Store Connect**
   - Use Xcode or Application Loader
   - Complete app information
   - Submit for review

## Troubleshooting

### Common Android Issues

1. **SDK/NDK Path Issues**
   ```powershell
   # Verify paths
   echo $ANDROID_HOME
   echo $NDK_HOME
   
   # Reinstall SDK components if needed
   ```

2. **Build Failures**
   ```powershell
   # Clean build
   tauri android build --clean
   
   # Update Rust targets
   rustup update
   rustup target add aarch64-linux-android
   ```

3. **Device Connection Issues**
   ```powershell
   # Restart ADB
   adb kill-server
   adb start-server
   
   # Check USB debugging
   adb devices
   ```

### Common iOS Issues

1. **Signing Issues**
   - Verify developer certificates
   - Check provisioning profiles
   - Ensure bundle ID matches

2. **Simulator Issues**
   ```bash
   # Reset simulator
   xcrun simctl erase all
   
   # Restart simulator
   xcrun simctl shutdown all
   ```

## Performance Optimization

### Bundle Size Optimization

1. **Minimize Dependencies**
   - Review and remove unused npm packages
   - Use tree-shaking for JavaScript bundles

2. **Optimize Assets**
   - Compress images
   - Use appropriate image formats (WebP, AVIF)
   - Minimize CSS and JavaScript

3. **Rust Binary Optimization**
   ```toml
   # In src-tauri/Cargo.toml
   [profile.release]
   opt-level = "s"
   lto = true
   codegen-units = 1
   panic = "abort"
   strip = true
   ```

### Runtime Performance

1. **Memory Management**
   - Monitor memory usage on devices
   - Optimize large data structures
   - Use lazy loading for heavy components

2. **UI Responsiveness**
   - Minimize main thread blocking
   - Use web workers for heavy computations
   - Optimize animations and transitions

## Security Considerations

### Mobile-Specific Security

1. **API Security**
   - Use HTTPS for all network requests
   - Implement proper authentication
   - Validate all user inputs

2. **Data Storage**
   - Encrypt sensitive data
   - Use secure storage APIs
   - Follow platform security guidelines

3. **Permissions**
   - Request minimal required permissions
   - Explain permission usage to users
   - Handle permission denials gracefully

## Resources

- [Tauri Documentation](https://tauri.app/)
- [Android Developer Documentation](https://developer.android.com/)
- [iOS Developer Documentation](https://developer.apple.com/documentation/)
- [Google Play Console](https://play.google.com/console/)
- [App Store Connect](https://appstoreconnect.apple.com/)
