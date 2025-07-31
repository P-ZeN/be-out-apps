# Android Code Signing Setup for GitHub Actions

This guide explains how to set up Android code signing for your GitHub Actions workflow without exposing sensitive keystore files in your repository.

## Overview

Your Android keystore and signing credentials are stored securely in GitHub Secrets and decoded during the CI/CD process to sign your APK files.

## Setup Steps

### 1. Prepare Your Keystore

Your keystore is already created locally at:
- **File**: `client/src-tauri/keystore/be-out-release.keystore`
- **Properties**: `client/src-tauri/keystore.properties`

### 2. Encode Keystore for GitHub Secrets

The keystore file has been encoded to base64. You can find the encoded content in:
```bash
# The base64 encoded file (temporary - do not commit)
client/src-tauri/keystore/be-out-release.keystore.base64
```

**Important**: This base64 file is temporary and should not be committed to git. Delete it after copying to GitHub Secrets.

### 3. Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add these secrets:

#### Required Secrets:

1. **ANDROID_KEYSTORE_BASE64**
   - Value: Copy the entire content from `be-out-release.keystore.base64`
   - Description: Base64 encoded Android keystore file

2. **ANDROID_KEYSTORE_PASSWORD**
   - Value: `zenkeypass2025`
   - Description: Keystore password

3. **ANDROID_KEY_ALIAS**
   - Value: `be-out`
   - Description: Key alias name

4. **ANDROID_KEY_PASSWORD**
   - Value: `zenkeypass2025`
   - Description: Key password

### 4. Verify Setup

After adding the secrets, your GitHub Actions workflow will:

1. **Decode the keystore** from base64 during the build
2. **Create the keystore.properties** file with your credentials
3. **Build and sign** the APK automatically
4. **Upload the signed APK** as build artifacts

### 5. Security Considerations

✅ **What's secure:**
- Keystore file is base64 encoded and stored in GitHub Secrets
- Passwords are stored in GitHub Secrets (not in code)
- Keystore files are excluded from git via `.gitignore`
- Temporary files are created only during CI build

❌ **What to avoid:**
- Never commit keystore files to git
- Never put passwords in code or config files
- Don't share the base64 encoded keystore content

### 6. Troubleshooting

#### If builds fail with signing errors:

1. **Check that all 4 secrets are set** in GitHub repository settings
2. **Verify secret names match exactly** (case-sensitive)
3. **Ensure base64 content is complete** (no missing characters)

#### To view build logs:
- Go to Actions tab in your GitHub repository
- Click on the failed build
- Expand the "Setup Android Code Signing" step

#### To test locally:
```bash
# Your local setup should work as normal
cd client
npm run tauri:android:build
```

### 7. Production vs Development

- **GitHub Actions**: Uses secrets-based signing for production builds
- **Local Development**: Uses your local keystore files (not committed to git)
- **Both approaches** produce signed APKs for release

## Files Modified

- `.github/workflows/mobile-build.yml` - Added code signing setup step
- `.gitignore` - Already excludes keystore files
- `docs/ANDROID_CODE_SIGNING_SETUP.md` - This documentation

## Next Steps

1. Add the 4 GitHub Secrets as described above
2. Delete the temporary `be-out-release.keystore.base64` file
3. Test the workflow by pushing a commit or creating a pull request
4. Check the Actions tab to verify signed APK generation

## Support

If you encounter issues:
1. Check the GitHub Actions logs for detailed error messages
2. Verify all secrets are correctly set
3. Ensure your local build still works as a reference
