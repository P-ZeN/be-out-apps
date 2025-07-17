# Mobile App Development Pipeline Setup - Complete Guide

## 🎯 Overview

This guide provides a complete setup for building and deploying your BeOut app as mobile applications for both Android and iOS platforms using Tauri 2.x.

## 📁 Project Structure

```
be-out-app/
├── .github/workflows/mobile-build.yml   # CI/CD pipeline
├── src-tauri/                           # Tauri mobile app configuration
│   ├── Cargo.toml                       # Rust dependencies
│   ├── tauri.conf.json                  # Tauri configuration
│   └── src/                            # Rust source code
├── client/                             # React web app (your main app)
├── scripts/build-mobile.ps1            # Local testing script
└── docs/
    ├── MOBILE_DEVELOPMENT_GUIDE.md     # Detailed development guide
    └── APP_STORE_CONFIG.md             # App store submission guide
```

## 🚀 Quick Start

### 1. Prerequisites Installation

#### Windows (for Android)
```powershell
# Install Android Studio and set environment variables
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
$env:NDK_HOME = "$env:ANDROID_HOME\ndk\25.2.9519653"

# Install Rust
winget install Rustlang.Rustup

# Add Android targets
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
```

#### macOS (for iOS + Android)
```bash
# Install Xcode for iOS development
xcode-select --install

# Install Android Studio for Android development
# Set ANDROID_HOME and NDK_HOME environment variables

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add targets
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
```

### 2. Initialize Mobile Platforms

```powershell
# Initialize Android support
tauri android init

# For iOS (macOS only) - when available in stable Tauri 2.x
# tauri ios init
```

### 3. Local Testing

Use the provided PowerShell script for local testing:

```powershell
# Test Android build
.\scripts\build-mobile.ps1 -Platform android

# Test with connected device
.\scripts\build-mobile.ps1 -Platform android -Device

# Release build
.\scripts\build-mobile.ps1 -Platform android -Release

# Test both platforms (when iOS is available)
.\scripts\build-mobile.ps1 -Platform both
```

## 🏗️ Build Commands

### Development Builds
```powershell
# Desktop development
npm run tauri:dev

# Android development (requires Android emulator or device)
npm run tauri:android

# Manual Android development
tauri android dev
```

### Production Builds
```powershell
# Desktop production
npm run tauri:build

# Android APK/AAB production
npm run tauri:android:build

# Manual Android production
tauri android build
```

## 🤖 CI/CD Pipeline

The GitHub Actions pipeline (`.github/workflows/mobile-build.yml`) automatically:

1. **Tests the client app** on every push/PR
2. **Builds Android APK** on Linux runners
3. **Prepares iOS build** (placeholder for macOS runners)
4. **Creates GitHub releases** with APK files when you tag a version

### Triggering a Release

```bash
# Create and push a version tag
git tag v1.0.1
git push origin v1.0.1

# This will trigger the CI/CD pipeline and create a GitHub release
```

## 📱 App Store Deployment

### Google Play Store

1. **Prepare Release APK/AAB**
   ```powershell
   tauri android build --apk --aab
   ```

2. **Upload to Google Play Console**
   - Use the generated AAB file from `src-tauri/gen/android/app/build/outputs/bundle/`
   - Follow the guidelines in `docs/APP_STORE_CONFIG.md`

### Apple App Store

1. **Prepare Release IPA** (when iOS support is stable)
   ```bash
   tauri ios build --release
   ```

2. **Upload to App Store Connect**
   - Use Xcode or Transporter app
   - Follow the guidelines in `docs/APP_STORE_CONFIG.md`

## 🧪 Testing Strategy

### Local Testing
1. **Desktop testing**: `npm run tauri:dev`
2. **Android emulator**: Start Android emulator, then `tauri android dev`
3. **Physical devices**: Connect via USB with debugging enabled

### Automated Testing
- Unit tests run in CI/CD pipeline
- Integration tests with different Android API levels
- UI tests on various screen sizes

### Beta Testing
- **Android**: Use Google Play Console's Internal Testing
- **iOS**: Use TestFlight for beta distribution

## 📊 Performance Monitoring

### Bundle Size Optimization
- Monitor APK/IPA sizes
- Use Tauri's built-in optimization features
- Implement code splitting for large JavaScript bundles

### Runtime Performance
- Monitor app startup time
- Track memory usage on different devices
- Monitor crash rates and performance metrics

## 🔧 Configuration Files

### Key Files to Customize

1. **`src-tauri/tauri.conf.json`**: App metadata, permissions, bundle settings
2. **`src-tauri/Cargo.toml`**: Rust dependencies and build configuration
3. **`docs/APP_STORE_CONFIG.md`**: App store metadata and marketing materials
4. **`.github/workflows/mobile-build.yml`**: CI/CD pipeline configuration

### App Identity
- **Bundle ID**: `com.beout.mobile`
- **App Name**: BeOut
- **Version**: Synced with root package.json (1.0.1)

## 🔐 Security Considerations

### Code Signing
- **Android**: Use Android Keystore for signing APKs
- **iOS**: Use Apple Developer certificates and provisioning profiles

### API Security
- Implement proper HTTPS communication
- Use secure storage for sensitive data
- Validate all user inputs

### Store Security Requirements
- Follow platform security guidelines
- Implement proper permission handling
- Ensure privacy compliance (GDPR, CCPA)

## 📈 Analytics and Monitoring

### Crash Reporting
- Implement crash reporting (Sentry, Bugsnag)
- Monitor app stability across different devices
- Track performance metrics

### User Analytics
- Track user engagement and feature usage
- Monitor conversion rates for events
- A/B test new features

## 🆘 Troubleshooting

### Common Issues

1. **Android SDK not found**
   ```powershell
   # Verify environment variables
   echo $env:ANDROID_HOME
   echo $env:NDK_HOME
   ```

2. **Build failures**
   ```powershell
   # Clean and rebuild
   tauri android build --clean
   ```

3. **Device not detected**
   ```powershell
   # Restart ADB
   adb kill-server
   adb start-server
   adb devices
   ```

### Getting Help
- Check the [Tauri documentation](https://tauri.app/)
- Review platform-specific guides in `docs/MOBILE_DEVELOPMENT_GUIDE.md`
- Use the test script for debugging: `.\scripts\build-mobile.ps1`

## 🎉 Next Steps

1. **Set up development environment** following the prerequisites
2. **Test local builds** using the provided scripts
3. **Configure CI/CD secrets** for automated builds
4. **Prepare app store assets** using the configuration guide
5. **Submit to app stores** following the deployment guides

Your BeOut app is now ready for mobile deployment! 🚀
