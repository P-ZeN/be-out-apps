# Local Mobile Development Guide

## 🎯 Overview

You can develop and test Tauri mobile apps locally without affecting your CI/CD pipeline. This guide shows you how to set up Android development on Windows.

## 📱 Android Development on Windows

### Prerequisites

1. **Enable Windows Developer Mode (REQUIRED)**
   - Open **Settings** (Windows key + I)
   - Navigate to Developer Mode using one of these paths depending on your Windows version:
     - **Windows 11**: Settings → Privacy & security → For developers
     - **Windows 10**: Settings → Update & Security → For developers
     - **Alternative**: Search "Developer settings" in the Start menu
   - Turn on **Developer Mode**
   - Accept any security warnings
   - Restart your computer when prompted
   - This allows Tauri to create symbolic links needed for Android builds

2. **Install Android Studio**
   - Download from [Android Studio](https://developer.android.com/studio)
   - During installation, make sure to install:
     - Android SDK
     - Android SDK Platform-Tools
     - Android NDK (Side by side)

3. **Install Java JDK 17**
   ```powershell
   # Using Chocolatey (recommended)
   choco install openjdk17

   # Or download manually from Oracle/OpenJDK
   ```

3. **Install Rust with Android targets**
   ```powershell
   # Install Rust if not already installed
   winget install Rustlang.Rust.GNU

   # Add Android targets
   rustup target add aarch64-linux-android
   rustup target add armv7-linux-androideabi
   rustup target add x86_64-linux-android
   rustup target add i686-linux-android
   ```

### Environment Setup

**First, install the Android NDK through Android Studio:**

1. **Install Android NDK**
   - Open Android Studio
   - Go to **File** → **Settings** (or **Android Studio** → **Preferences** on Mac)
   - Navigate to **Appearance & Behavior** → **System Settings** → **Android SDK**
   - Click on **SDK Tools** tab
   - Check **NDK (Side by side)** and **CMake**
   - Click **Apply** and **OK** to install

2. **Find your actual Android SDK path**
   ```powershell
   # Check your actual SDK location
   dir "C:\Users\phili\AppData\Local\Android\Sdk"

   # After installing NDK, check for NDK directory
   dir "C:\Users\phili\AppData\Local\Android\Sdk\ndk"
   ```

3. **Set Environment Variables**

   Add these to your Windows environment variables (replace with your actual paths):
   ```
   ANDROID_HOME=C:\Users\phili\AppData\Local\Android\Sdk
   ANDROID_SDK_ROOT=C:\Users\phili\AppData\Local\Android\Sdk
   NDK_HOME=C:\Users\phili\AppData\Local\Android\Sdk\ndk\29.0.13599879
   JAVA_HOME=C:\Program Files\OpenJDK\openjdk-17
   ```

   Add to PATH:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %JAVA_HOME%\bin
   ```

4. **Find your NDK version (after installing NDK)**
   ```powershell
   # After installing NDK through Android Studio, check the version
   dir "C:\Users\phili\AppData\Local\Android\Sdk\ndk"
   # Note the version number and update NDK_HOME accordingly
   # Example: if you see "26.1.10909125", then:
   # NDK_HOME=C:\Users\phili\AppData\Local\Android\Sdk\ndk\26.1.10909125
   ```

### Local Android Development

1. **Initialize Android project locally**
   ```bash
   npm run tauri:android:init
   ```

2. **Check if initialization worked**
   ```bash
   # Should create src-tauri/gen/android/
   ls src-tauri/gen/
   ```

3. **Run in development mode**
   ```bash
   npm run tauri:android
   ```

4. **Build Android APK**
   ```bash
   npm run tauri:android:build
   ```

5. **Install on device/emulator (requires signing)**
   ```bash
   # For development testing, build debug APK instead:
   npm run tauri:android:build -- --debug

   # Or sign the release APK (see APK Signing section below)
   ```

### APK Signing for Testing

The release APK needs to be signed before installation. Here are your options:

**Option 1 - Build Debug APK (Easiest for local testing):**
```bash
# Debug APKs are automatically signed with debug certificate
npm run tauri:android:build -- --debug
```

**Option 2 - Create Debug Certificate for Release APK:**
```bash
# Generate debug keystore (one-time setup)
keytool -genkey -v -keystore debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=Android Debug,O=Android,C=US"

# Sign your existing APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore debug.keystore -storepass android app-universal-release-unsigned.apk androiddebugkey

# Align APK (recommended)
zipalign -v 4 app-universal-release-unsigned.apk app-universal-release-signed.apk
```

**Option 3 - Create Production Certificate (for Google Play Store):**
```bash
# Generate production keystore (KEEP THIS SECURE!)
keytool -genkey -v -keystore release.keystore -alias your-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Follow prompts to enter:
# - Your name and organization details
# - Keystore password (REMEMBER THIS!)
# - Key password

# Configure in tauri.conf.json for automatic signing:
```

Add to your `src-tauri/tauri.conf.json`:
```json
{
  "tauri": {
    "bundle": {
      "android": {
        "minSdkVersion": 24,
        "signing": {
          "keystore": "path/to/release.keystore",
          "keystorePassword": "your-keystore-password",
          "keyAlias": "your-key-alias",
          "keyPassword": "your-key-password"
        }
      }
    }
  }
}
```

**Quick Solution for Your Current APK:**
```bash
# Navigate to where your APK is located
cd "C:\Users\phili\ApkProjects\app-universal-release-unsigned"

# Create debug keystore (if you don't have one)
keytool -genkey -v -keystore debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=Android Debug,O=Android,C=US"

# Sign the APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore debug.keystore -storepass android app-universal-release-unsigned.apk androiddebugkey

# Now you can install it!
```

### Troubleshooting Local Setup

#### If Android init fails:
```bash
# Check environment variables
echo $env:ANDROID_HOME
echo $env:NDK_HOME
echo $env:JAVA_HOME

# Verify tools are accessible
adb version
javac -version
```

#### If build fails:
```bash
# Check if Android targets are installed
rustup target list --installed | grep android

# Check if NDK tools exist
ls "%NDK_HOME%\toolchains\llvm\prebuilt\windows-x86_64\bin\"
```

## 🍎 iOS Development (macOS Only)

### Prerequisites
- macOS with Xcode installed
- Apple Developer account (for device testing)

### Setup
```bash
# Add iOS targets
rustup target add aarch64-apple-ios
rustup target add x86_64-apple-ios
rustup target add aarch64-apple-ios-sim

# Initialize iOS project
npm run tauri:ios:init

# Run in development
npm run tauri:ios

# Build iOS
npm run tauri:ios:build
```

## 🔄 Keeping CI and Local Separate

### What's Safe to Do Locally:

✅ **Initialize projects** - Creates local `src-tauri/gen/` folders
✅ **Modify local configs** - Won't affect CI
✅ **Test builds** - Local APK/IPA generation
✅ **Debug with devices** - Connect real devices for testing

### What Won't Affect CI:

- **Local project initialization** - CI re-initializes fresh each time
- **Local environment variables** - CI uses its own setup
- **Generated files in `src-tauri/gen/`** - These are gitignored
- **Local SDK versions** - CI uses specific versions

### Files That Are Gitignored:
```
src-tauri/gen/          # Generated mobile projects
src-tauri/target/       # Rust build artifacts
*.apk                   # Android packages
*.ipa                   # iOS packages
```

## 🎯 Development Workflow

### Recommended Flow:
1. **Develop frontend** on Windows normally
2. **Test mobile locally** when needed
3. **Push to GitHub** to test CI builds
4. **Deploy** using CI-generated artifacts

### Commands Summary:
```bash
# Frontend development
npm run dev:client

# Mobile initialization (one-time)
npm run tauri:android:init  # Windows
npm run tauri:ios:init      # macOS only

# Mobile development
npm run tauri:android       # Android emulator/device
npm run tauri:ios           # iOS simulator/device (macOS)

# Mobile builds
npm run tauri:android:build # Generate APK
npm run tauri:ios:build     # Generate IPA (macOS)
```

## 📁 Project Structure

After initialization:
```
src-tauri/
├── src/           # Rust source code
├── Cargo.toml     # Rust dependencies
├── tauri.conf.json # Tauri configuration
├── gen/           # Generated mobile projects (gitignored)
│   ├── android/   # Android Studio project
│   └── apple/     # Xcode project (iOS/macOS)
└── target/        # Rust build outputs (gitignored)
```

## 🚀 Benefits of Local Development

- **Faster iteration** - No CI wait times
- **Device testing** - Connect real devices
- **Debug tools** - Use Android Studio/Xcode debuggers
- **Offline development** - Work without internet
- **Custom configurations** - Test different settings locally

## 🛠️ Debugging Tips

### Android Studio Integration:
1. Initialize Android project locally
2. Open `src-tauri/gen/android/` in Android Studio
3. Use full Android debugging tools
4. Test on emulators and real devices

### Common Issues:

- **Symbolic link creation failed**: Enable Windows Developer Mode (see Prerequisites)
- **NDK not found**: Update NDK_HOME path
- **Java version**: Ensure JDK 17 is default
- **Rust targets**: Re-run `rustup target add` commands
- **Permissions**: Run terminal as administrator if needed
- **Antivirus blocking Rust builds**: Add exclusions (see Antivirus Configuration below)

## 🛡️ Antivirus Configuration

**CRITICAL**: Windows antivirus software often blocks Rust compilation. You MUST add these directories to your antivirus exclusions:

### Required Antivirus Exclusions

```text
C:\Users\phili\.cargo\          # Cargo cache and tools
C:\Users\phili\.rustup\         # Rustup toolchains
Y:\be-out\be-out-app\src-tauri\target\  # Project build outputs
```

### How to Add Exclusions

**Windows Defender:**

1. Open **Windows Security** (search in Start menu)
2. Go to **Virus & threat protection**
3. Click **Manage settings** under "Virus & threat protection settings"
4. Scroll down to **Exclusions** and click **Add or remove exclusions**
5. Click **Add an exclusion** → **Folder**
6. Add each of the three directories above

**Other Antivirus Software:**

- Look for "Exclusions", "Whitelist", or "Exceptions" in your antivirus settings
- Add the same three directories as folder exclusions
- Some antivirus may require you to exclude `*.exe` files in these directories

### Symptoms of Antivirus Interference

- `Accès refusé. (os error 5)` - Access denied during build
- `failed to link or copy` errors
- Build processes hanging or timing out
- Random build failures that work on retry

### After Adding Exclusions

```powershell
# Clean previous failed builds
cargo clean

# Try building again
npm run tauri:android:build
```

## 🔗 Windows Developer Mode Setup

If you get the error `Creation symbolic link is not allowed for this system`, you need to enable Developer Mode.

### Easy Ways to Enable Developer Mode

**Method 1 - Search (Recommended):**
1. Press **Windows key**
2. Type **"developer"**
3. Click **"Developer settings"** or **"Use developer features"**
4. Toggle **Developer Mode** to **ON**
5. Restart Windows

**Method 2 - Settings Navigation:**
- **Windows 11**: Settings → Privacy & security → For developers
- **Windows 10**: Settings → Update & Security → For developers
- **Alternative**: Settings → System → About → Related settings → Advanced system settings

**Method 3 - PowerShell (Admin required):**
```powershell
# Run PowerShell as Administrator, then:
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" /v AllowDevelopmentWithoutDevLicense /t REG_DWORD /d 1 /f
```

### Verify Developer Mode is Enabled

```powershell
# Check if enabled (should show "1")
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" /v AllowDevelopmentWithoutDevLicense
```

## 📞 Support

- Local issues don't affect CI pipeline
- CI issues don't affect local development
- Both can coexist perfectly!

## 🏪 Production App Store Setup

### Android - Google Play Store Setup

**1. Create Production Keystore (CRITICAL - Keep Secure!):**
```bash
# Generate production keystore - YOU CANNOT LOSE THIS!
keytool -genkey -v -keystore be-out-release.keystore -alias be-out-key -keyalg RSA -keysize 2048 -validity 25000

# You'll be prompted for:
# - Keystore password (WRITE THIS DOWN!)
# - Key password (WRITE THIS DOWN!)
# - Your name: Be Out Team
# - Organization: Be Out
# - City/State/Country: Your details
```

**2. Configure Tauri for Production Signing:**

The keystore configuration is already set up in `client/src-tauri/tauri.conf.json`. You just need to provide the passwords:

Create `.env.keystore` file in the project root:
```env
ANDROID_KEYSTORE_PASSWORD=your_actual_keystore_password
ANDROID_KEY_PASSWORD=your_actual_key_password
```

**IMPORTANT**: Never commit `.env.keystore` to git! It's already in .gitignore.

**3. Google Play Console Setup:**
- Create account at [Google Play Console](https://play.google.com/console)
- Pay $25 one-time registration fee
- Create new app "Be Out!"
- Upload your signed APK/AAB
- Complete store listing (description, screenshots, etc.)

**4. Build Production APK/AAB:**
```bash
# Build signed release APK
npm run tauri:android:build

# For Google Play Store, build AAB (recommended):
npm run tauri:android:build -- --target aab
```

### iOS - Apple App Store Setup

**1. Apple Developer Account:**
- Sign up at [Apple Developer](https://developer.apple.com)
- Pay $99/year membership fee
- Complete account verification

**2. Create App ID and Certificates:**
```bash
# First, ensure you have Xcode installed
# Then generate certificates through Xcode or Apple Developer Portal

# Add your Apple ID to Xcode:
# Xcode → Preferences → Accounts → Add Apple ID

# Create App ID in Apple Developer Portal:
# - App ID: com.beout.app (matches your tauri.conf.json identifier)
# - Enable capabilities you need (Push Notifications, etc.)
```

**3. Configure iOS Signing in Tauri:**

Update `src-tauri/tauri.conf.json`:
```json
{
  "tauri": {
    "bundle": {
      "identifier": "com.beout.app",
      "iOS": {
        "minimumSystemVersion": "13.0",
        "developmentTeam": "YOUR_TEAM_ID",
        "provisioningProfile": "YOUR_PROVISIONING_PROFILE"
      }
    }
  }
}
```

**4. Build and Submit iOS:**
```bash
# Build iOS app
npm run tauri:ios:build

# Open in Xcode for final submission
open src-tauri/gen/apple/Be\ Out!.xcodeproj

# In Xcode:
# 1. Select "Any iOS Device" as target
# 2. Product → Archive
# 3. Upload to App Store Connect
```

### Production CI/CD Integration

**1. Secure Secrets Management:**

Add to GitHub Secrets:
```
ANDROID_KEYSTORE_PASSWORD=your_keystore_password
ANDROID_KEY_PASSWORD=your_key_password
APPLE_TEAM_ID=your_apple_team_id
APPLE_CERTIFICATE_PASSWORD=your_cert_password
```

**2. Update GitHub Actions:**

Modify `.github/workflows/mobile-build.yml` to use production certificates:
```yaml
- name: Setup Android Signing
  env:
    KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
    KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
  run: |
    echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 --decode > be-out-release.keystore
```

**3. Store Keystore Securely:**
```bash
# Convert keystore to base64 for GitHub Secrets
base64 -i be-out-release.keystore -o keystore.base64

# Add the base64 content to GitHub Secrets as ANDROID_KEYSTORE_BASE64
# NEVER commit the actual keystore file to git!
```

### App Store Submission Checklist

**Android (Google Play):**
- [ ] Production keystore created and backed up
- [ ] App signed with production certificate
- [ ] Play Console account created
- [ ] Store listing completed (title, description, screenshots)
- [ ] Privacy policy URL provided
- [ ] Content rating completed
- [ ] Pricing set (free/paid)
- [ ] Release track selected (internal/alpha/beta/production)

**iOS (Apple App Store):**
- [ ] Apple Developer account active ($99/year)
- [ ] App ID created with correct bundle identifier
- [ ] Distribution certificate created
- [ ] Provisioning profile configured
- [ ] App Store Connect app created
- [ ] App metadata completed
- [ ] Screenshots and app preview uploaded
- [ ] App Review Information provided

### Backup Strategy (CRITICAL!)

**Android Keystore Backup:**
```bash
# Backup your keystore to multiple secure locations:
# 1. Encrypted cloud storage (Google Drive, OneDrive)
# 2. Hardware backup (USB drive in safe)
# 3. Password manager for passwords

# If you lose this keystore, you can NEVER update your app!
```

**iOS Certificate Backup:**
- Export certificates from Keychain Access
- Store in secure locations
- Document Team ID and Apple ID details

This setup ensures you can properly release to both app stores and maintain the apps long-term!
