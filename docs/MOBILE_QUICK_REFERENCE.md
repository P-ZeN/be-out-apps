# 🚀 BeOut Mobile App - Quick Reference

## 📋 Quick Commands

### Development
```powershell
# Start desktop development
npm run tauri:dev

# Start Android development (requires emulator/device)
npm run tauri:android

# Test with our script
.\scripts\build-mobile.ps1 -Platform android
```

### Production Builds
```powershell
# Build desktop app
npm run tauri:build

# Build Android APK
npm run tauri:android:build

# Build using our script
.\scripts\build-mobile.ps1 -Platform android -Release
```

## 🔧 Prerequisites Checklist

### ✅ Android Development
- [ ] Android Studio installed
- [ ] Android SDK API 33+ installed
- [ ] Android NDK 25.2.9519653+ installed
- [ ] ANDROID_HOME environment variable set
- [ ] NDK_HOME environment variable set
- [ ] Java JDK 17+ installed
- [ ] Rust installed with Android targets

### ✅ iOS Development (macOS only)
- [ ] Xcode installed
- [ ] Xcode Command Line Tools installed
- [ ] iOS Simulator installed
- [ ] Apple Developer Account (for device testing/App Store)
- [ ] Rust installed with iOS targets

## 📱 Testing Devices

### Android Emulator
```powershell
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd <emulator-name>

# Run app on emulator
tauri android dev
```

### Physical Android Device
```powershell
# Enable USB debugging on device
# Connect device via USB

# Check connected devices
adb devices

# Run app on device
tauri android dev --device <device-id>
```

## 🏗️ Build Outputs

### Desktop
- **Windows**: `src-tauri/target/release/bundle/msi/`
- **macOS**: `src-tauri/target/release/bundle/dmg/`
- **Linux**: `src-tauri/target/release/bundle/deb/`

### Android
- **APK**: `src-tauri/gen/android/app/build/outputs/apk/`
- **AAB**: `src-tauri/gen/android/app/build/outputs/bundle/`

### iOS (when available)
- **IPA**: `src-tauri/gen/ios/build/Build/Products/`

## 🔧 Troubleshooting

### Common Issues
1. **SDK not found**: Check ANDROID_HOME and NDK_HOME
2. **Device not detected**: Restart ADB (`adb kill-server && adb start-server`)
3. **Build errors**: Try clean build (`tauri android build --clean`)
4. **Permission denied**: Enable USB debugging on device

### Debug Commands
```powershell
# Check environment
echo $env:ANDROID_HOME
echo $env:NDK_HOME

# Check devices
adb devices

# Check Tauri info
tauri info

# Check Rust targets
rustup target list --installed
```

## 📦 App Store Deployment

### Google Play Store
1. Build signed AAB: `tauri android build --aab`
2. Upload to Google Play Console
3. Complete store listing (see `docs/APP_STORE_CONFIG.md`)
4. Submit for review

### Apple App Store
1. Build signed IPA: `tauri ios build --release` (when available)
2. Upload to App Store Connect
3. Complete app information
4. Submit for review

## 🔐 Code Signing

### Android
- Generate keystore: `keytool -genkey -v -keystore my-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-alias`
- Configure in `src-tauri/gen/android/app/build.gradle`

### iOS
- Apple Developer Account required
- Configure signing certificates in Xcode
- Set up provisioning profiles

## 📊 Performance Tips

### Bundle Size
- Monitor APK/IPA sizes
- Use `tauri info` to check bundle configuration
- Optimize JavaScript bundle with code splitting

### Runtime Performance
- Test on low-end devices
- Monitor memory usage
- Use performance profiling tools

## 🆘 Getting Help

- **Documentation**: See `docs/MOBILE_DEVELOPMENT_GUIDE.md`
- **Tauri Docs**: https://tauri.app/
- **GitHub Issues**: Check repository issues
- **Community**: Tauri Discord server

## 🎯 Next Steps

1. ✅ Set up development environment
2. ✅ Test local builds
3. ⏳ Configure CI/CD pipeline
4. ⏳ Prepare app store assets
5. ⏳ Submit to app stores

---

**Project**: BeOut Event Discovery Platform
**Bundle ID**: com.beout.mobile
**Version**: 1.0.1
