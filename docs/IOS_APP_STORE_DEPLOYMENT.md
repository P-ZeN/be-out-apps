# iOS App Store Deployment Guide

## 🎉 Current Status: iOS Build Pipeline Ready!

Your iOS build pipeline is **working perfectly**! The CI successfully:
- ✅ Builds the React client
- ✅ Compiles all Rust code for iOS
- ✅ Generates Xcode project
- ✅ Processes through Xcode build system
- ⚠️ Fails only at code signing (expected without certificates)

## 📱 To Deploy to App Store

### Step 1: Apple Developer Account
1. Sign up for [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Note your **Team ID** from the membership details

### Step 2: Create Certificates
1. In Apple Developer Console:
   - Go to "Certificates, Identifiers & Profiles"
   - Create an **iOS Distribution Certificate**
   - Download the `.p12` file with private key

### Step 3: Add GitHub Secrets
In your repository settings → Secrets and variables → Actions, add:

```
APPLE_DEVELOPMENT_TEAM=YOUR_TEAM_ID_HERE
APPLE_CERTIFICATE_P12=base64_encoded_certificate_content
APPLE_CERTIFICATE_PASSWORD=your_certificate_password
```

To encode certificate:
```bash
base64 -i your_certificate.p12 | pbcopy
```

### Step 4: App Store Connect Setup
1. Create app in [App Store Connect](https://appstoreconnect.apple.com)
2. Set bundle identifier to match `tauri.conf.json`: `com.beout.mobile`
3. Configure app metadata, screenshots, etc.

### Step 5: Deploy
1. Push code to trigger CI build
2. Download IPA from GitHub Actions artifacts
3. Upload IPA to App Store Connect using Xcode or Transporter
4. Submit for review

## 🔧 Build Configuration

### Current Tauri Configuration
- **Bundle ID**: `com.beout.mobile`
- **App Name**: BeOut
- **Category**: Social Networking
- **Version**: 1.0.1

### Supported iOS Targets
- iPhone (arm64)
- iPhone Simulator (x86_64, aarch64)

## 🚀 Automation Ready

The CI pipeline will automatically:
1. Build iOS app on every push to `main`/`develop`
2. Create releases on git tags (`v*`)
3. Upload IPA artifacts for download
4. Generate App Store ready builds (with certificates)

## 📋 Pre-Submission Checklist

- [ ] Apple Developer Account active
- [ ] Certificates configured in GitHub Secrets
- [ ] App created in App Store Connect
- [ ] App icons in all required sizes
- [ ] App Store screenshots prepared
- [ ] Privacy policy URL ready
- [ ] App description and metadata complete

## 🔍 Testing Without Certificates

Current setup allows testing everything except final IPA generation:
- ✅ React app development on Windows
- ✅ CI builds verify iOS compatibility
- ✅ Xcode project generation works
- ⚠️ Final IPA requires Apple certificates

## 📞 Support

- **Tauri iOS Guide**: https://tauri.app/v2/guides/building/ios/
- **Apple Developer**: https://developer.apple.com/support/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
