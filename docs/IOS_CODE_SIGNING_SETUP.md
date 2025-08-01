# iOS Code Signing Setup Guide

This guide will walk you through setting up iOS code signing for your Tauri app, from Apple Developer Program setup to CI/CD integration.

## Prerequisites

- ✅ Apple Developer Program membership (active)
- ✅ macOS with Xcode installed (for local development)
- ✅ Access to your GitHub repository settings

## Part 1: Apple Developer Portal Setup

### 1.1 Create App Identifier

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** (Add new)
4. Select **App IDs** → **App**
5. Configure your App ID:
   - **Description**: `Be Out! Mobile App`
   - **Bundle ID**: `com.beout.app` (matches your tauri.conf.json)
   - **Capabilities**: Enable any capabilities your app needs:
     - Push Notifications (if needed)
     - Sign in with Apple (if needed)
     - Associated Domains (for deep linking)
6. Click **Continue** → **Register**

### 1.2 Create Development Certificate

1. In **Certificates, Identifiers & Profiles**
2. Click **Certificates** → **+** (Add new)
3. Select **iOS App Development**
4. Click **Continue**
5. **Generate Certificate Signing Request (CSR)**:
   - On your Mac, open **Keychain Access**
   - Go to **Keychain Access** → **Certificate Assistant** → **Request a Certificate from a Certificate Authority**
   - Fill in:
     - **User Email Address**: Your email
     - **Common Name**: Your name or company
     - **CA Email Address**: Leave empty
     - **Request is**: Select "Saved to disk"
   - Save the CSR file
6. Upload the CSR file to Apple Developer Portal
7. Download the certificate and double-click to install in Keychain

### 1.3 Create Distribution Certificate

1. Repeat the same process but select **iOS Distribution** instead
2. This certificate is used for App Store releases

### 1.4 Create Development Provisioning Profile

1. Click **Profiles** → **+** (Add new)
2. Select **iOS App Development**
3. Choose your App ID: `com.beout.app`
4. Select your Development Certificate
5. Select test devices (add your iPhone/iPad UDIDs)
6. Profile Name: `Be Out Development Profile`
7. Download the profile

### 1.5 Create Distribution Provisioning Profile

1. Click **Profiles** → **+** (Add new)
2. Select **App Store** (for App Store distribution)
3. Choose your App ID: `com.beout.app`
4. Select your Distribution Certificate
5. Profile Name: `Be Out Distribution Profile`
6. Download the profile

## Part 2: Export Certificates for CI/CD

### 2.1 Export Development Certificate

1. Open **Keychain Access** on your Mac
2. Find your iOS Development certificate
3. Right-click → **Export "iPhone Developer: Your Name"**
4. Save as: `ios_development.p12`
5. Set a password (remember this - you'll need it for GitHub Secrets)

### 2.2 Export Distribution Certificate

1. Find your iOS Distribution certificate in Keychain
2. Right-click → **Export "iPhone Distribution: Your Name"**
3. Save as: `ios_distribution.p12`
4. Set a password (can be the same as development)

### 2.3 Convert to Base64

```bash
# Convert certificates to base64 for GitHub Secrets
base64 -i ios_development.p12 | pbcopy
# Paste this into APPLE_DEVELOPMENT_CERTIFICATE_P12_BASE64 secret

base64 -i ios_distribution.p12 | pbcopy
# Paste this into APPLE_DISTRIBUTION_CERTIFICATE_P12_BASE64 secret

# Convert provisioning profiles to base64
base64 -i "Be Out Development Profile.mobileprovision" | pbcopy
# Paste this into APPLE_DEVELOPMENT_PROVISIONING_PROFILE_BASE64 secret

base64 -i "Be Out Distribution Profile.mobileprovision" | pbcopy
# Paste this into APPLE_DISTRIBUTION_PROVISIONING_PROFILE_BASE64 secret
```

## Part 3: GitHub Secrets Configuration

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

### Required Secrets

| Secret Name | Description | Value |
|-------------|-------------|-------|
| `APPLE_DEVELOPMENT_TEAM` | Your Team ID | Found in Apple Developer Portal → Membership |
| `APPLE_DEVELOPMENT_CERTIFICATE_P12_BASE64` | Development cert | Base64 encoded .p12 file |
| `APPLE_DISTRIBUTION_CERTIFICATE_P12_BASE64` | Distribution cert | Base64 encoded .p12 file |
| `APPLE_DEVELOPMENT_PROVISIONING_PROFILE_BASE64` | Dev profile | Base64 encoded .mobileprovision |
| `APPLE_DISTRIBUTION_PROVISIONING_PROFILE_BASE64` | Dist profile | Base64 encoded .mobileprovision |
| `APPLE_CERTIFICATE_PASSWORD` | P12 password | Password you set for the .p12 files |

### Find Your Team ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Click on your name/organization in the top right
3. Your **Team ID** is displayed (10-character alphanumeric string)

## Part 4: Update Tauri Configuration

Your `tauri.conf.json` already has the correct bundle identifier. We need to add iOS-specific signing configuration:

```json
{
  "bundle": {
    "iOS": {
      "minimumSystemVersion": "13.0",
      "developmentTeam": "$APPLE_DEVELOPMENT_TEAM",
      "provisioningProfiles": {
        "com.beout.app": "$DEVELOPMENT_PROVISIONING_PROFILE_UUID"
      }
    }
  }
}
```

## Part 5: Update GitHub Actions Workflow

The workflow needs to be updated to handle certificates and provisioning profiles. Here's what needs to be added:

### Certificate Installation Step

```yaml
- name: Install Apple Certificates
  run: |
    # Create keychain
    security create-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
    security default-keychain -s build.keychain
    security unlock-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
    security set-keychain-settings -t 3600 -u build.keychain

    # Import certificates
    echo "$APPLE_DEVELOPMENT_CERTIFICATE_P12_BASE64" | base64 --decode > development_certificate.p12
    echo "$APPLE_DISTRIBUTION_CERTIFICATE_P12_BASE64" | base64 --decode > distribution_certificate.p12

    security import development_certificate.p12 -k build.keychain -P "$APPLE_CERTIFICATE_PASSWORD" -T /usr/bin/codesign
    security import distribution_certificate.p12 -k build.keychain -P "$APPLE_CERTIFICATE_PASSWORD" -T /usr/bin/codesign

    # Install provisioning profiles
    mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
    echo "$APPLE_DEVELOPMENT_PROVISIONING_PROFILE_BASE64" | base64 --decode > ~/Library/MobileDevice/Provisioning\ Profiles/development.mobileprovision
    echo "$APPLE_DISTRIBUTION_PROVISIONING_PROFILE_BASE64" | base64 --decode > ~/Library/MobileDevice/Provisioning\ Profiles/distribution.mobileprovision

    # Set partition list to avoid permission issues
    security set-key-partition-list -S apple-tool:,apple: -s -k "$KEYCHAIN_PASSWORD" build.keychain
  env:
    APPLE_DEVELOPMENT_CERTIFICATE_P12_BASE64: ${{ secrets.APPLE_DEVELOPMENT_CERTIFICATE_P12_BASE64 }}
    APPLE_DISTRIBUTION_CERTIFICATE_P12_BASE64: ${{ secrets.APPLE_DISTRIBUTION_CERTIFICATE_P12_BASE64 }}
    APPLE_DEVELOPMENT_PROVISIONING_PROFILE_BASE64: ${{ secrets.APPLE_DEVELOPMENT_PROVISIONING_PROFILE_BASE64 }}
    APPLE_DISTRIBUTION_PROVISIONING_PROFILE_BASE64: ${{ secrets.APPLE_DISTRIBUTION_PROVISIONING_PROFILE_BASE64 }}
    APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
    KEYCHAIN_PASSWORD: ${{ secrets.KEYCHAIN_PASSWORD }}
```

## Part 6: Local Development Setup

For local development, install the certificates and profiles on your Mac:

1. Double-click the downloaded certificates to install in Keychain
2. Double-click the provisioning profiles to install
3. In Xcode, ensure your Team is selected in project settings

## Part 7: Testing the Setup

### 7.1 Local Test

```bash
cd client
npm run tauri ios build
```

### 7.2 CI Test

Push to your repository and check the GitHub Actions workflow.

## Part 8: Troubleshooting

### Common Issues

1. **"No matching provisioning profiles found"**
   - Ensure bundle ID matches exactly
   - Check that certificates are properly installed
   - Verify provisioning profile includes the correct devices

2. **"Code signing identity not found"**
   - Check certificate installation in keychain
   - Verify Team ID is correct
   - Ensure certificates haven't expired

3. **"Provisioning profile doesn't include signing certificate"**
   - Regenerate provisioning profile with the correct certificate

### Debug Commands

```bash
# List available code signing identities
security find-identity -v -p codesigning

# List installed provisioning profiles
ls -la ~/Library/MobileDevice/Provisioning\ Profiles/

# Check certificate details
security dump-keychain -d build.keychain
```

## Next Steps

1. **Complete the Apple Developer Portal setup** (Steps 1-2)
2. **Configure GitHub Secrets** (Step 3)
3. **Update the GitHub Actions workflow** (I'll help you with this)
4. **Test the complete pipeline**

Once you've completed the Apple Developer Portal setup and have your certificates/profiles ready, let me know and I'll help you update the GitHub Actions workflow with the proper iOS code signing configuration.

## Additional Resources

- [Apple Developer Documentation - Code Signing](https://developer.apple.com/documentation/xcode/code-signing)
- [Tauri iOS Guide](https://v2.tauri.app/guides/distribution/app-stores/ios/)
- [GitHub Actions + iOS Signing](https://docs.github.com/en/actions/deployment/deploying-xcode-applications/installing-an-apple-certificate-on-macos-runners-for-xcode-development)
