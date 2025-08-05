# iOS Google Sign-In Configuration Setup

## Overview
This guide explains how to properly configure Google Sign-In for iOS using environment variables and GitHub Actions secrets.

## ⚠️ Security Notice
**NEVER commit GoogleService-Info.plist or any files containing API keys to the repository!**

## Setup Methods

### Method 1: GitHub Actions Secrets (Recommended)

For CI/CD builds, the configuration is automatically generated from GitHub secrets.

#### Required GitHub Secrets:
1. Go to your repository Settings > Secrets and variables > Actions
2. Add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `IOS_GOOGLE_API_KEY` | iOS API key from Google Cloud Console | `AIzaSyB...` |
| `GOOGLE_PROJECT_ID` | Google project ID | `be-out-app` |
| `GOOGLE_STORAGE_BUCKET` | Firebase storage bucket | `be-out-app.appspot.com` |
| `IOS_GOOGLE_APP_ID` | iOS app ID from Google | `1:1064619689471:ios:beout` |

#### How it works:
- The GitHub Actions workflow automatically runs `scripts/setup-ios-config.sh`
- This script generates `GoogleService-Info.plist` from the secrets
- The file is created during build and never committed to the repository

### Method 2: Local Development

For local development, you have two options:

#### Option A: Environment Variables (Recommended)
1. Create a `.env` file in the project root:
   ```bash
   IOS_GOOGLE_API_KEY=your_api_key_here
   GOOGLE_PROJECT_ID=be-out-app
   GOOGLE_STORAGE_BUCKET=be-out-app.appspot.com
   IOS_GOOGLE_APP_ID=1:1064619689471:ios:beout
   ```

2. Run the setup script:
   ```bash
   ./scripts/setup-ios-config.sh
   ```

#### Option B: Manual Template Setup (Fallback)
1. Copy the template:
   ```bash
   cp client/src-tauri/GoogleService-Info.plist.template client/src-tauri/GoogleService-Info.plist
   ```

2. Edit the file and replace `YOUR_IOS_API_KEY_HERE` with your actual API key

### 3. Verify Configuration
The generated file should contain:
- `CLIENT_ID`: Your iOS client ID (automatically set)
- `API_KEY`: Your iOS API key (from environment/secrets)
- `BUNDLE_ID`: `com.beout.app` (automatically set)
- Other Google service configurations (automatically set)

## How to Get the Required Values

### Getting your iOS API Key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your "be-out-app" project
3. Navigate to "APIs & Services" > "Credentials"
4. Find your iOS API Key (not the client ID)
5. Copy the API key value

### Other values:
- Most other values have sensible defaults in the setup script
- Only the API key is typically required to be configured

## Build Integration

### GitHub Actions:
- The setup is automatically run during iOS builds
- No manual intervention required if secrets are configured

### Local Builds:
- Run `./scripts/setup-ios-config.sh` before building
- Or set up your environment variables and the script runs automatically

### 4. Build Configuration
The iOS build process will automatically use this file when building the application.

## Important Notes

### Security
- ✅ `GoogleService-Info.plist.template` is safe to commit (contains placeholders)
- ❌ `GoogleService-Info.plist` should NEVER be committed (contains real API keys)
- ✅ The file is already added to `.gitignore`

### Client IDs
The following client IDs are public and safe to expose:
- iOS Client ID: `1064619689471-mrna5dje1h4ojt62d9ckmqi3e8q07sjc.apps.googleusercontent.com`
- Android Client ID: `1064619689471-7lr8e71tr6h55as83o8gn4bdnhabavpu.apps.googleusercontent.com`

The API keys, however, should be kept private.

## Troubleshooting

### If iOS authentication fails:
1. Verify the GoogleService-Info.plist file exists in `client/src-tauri/`
2. Check that the API_KEY field is not `YOUR_IOS_API_KEY_HERE`
3. Ensure the bundle ID matches: `com.beout.app`
4. Verify the client ID matches your Google Console configuration

### Build Errors:
If you see build errors related to missing GoogleService-Info.plist:
1. Make sure you created the file from the template
2. Verify the file is properly formatted XML
3. Check that all required fields are filled in
