# iOS Code Signing - GitHub Secrets Quick Reference

This file contains the exact GitHub Secrets you need to configure for iOS code signing.

## Required GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 1. APPLE_DEVELOPMENT_TEAM
- **Description**: Your Apple Developer Team ID
- **Value**: 10-character alphanumeric Team ID from Apple Developer Portal
- **Example**: `ABCD123456`
- **How to find**: Apple Developer Portal → Account → Membership → Team ID

### 2. APPLE_DEVELOPMENT_CERTIFICATE_P12_BASE64
- **Description**: Base64-encoded development certificate (.p12 file)
- **Value**: Base64 string of your exported development certificate
- **Generate with**: `base64 -i ios_development.p12 | pbcopy`

### 3. APPLE_DISTRIBUTION_CERTIFICATE_P12_BASE64
- **Description**: Base64-encoded distribution certificate (.p12 file)
- **Value**: Base64 string of your exported distribution certificate
- **Generate with**: `base64 -i ios_distribution.p12 | pbcopy`

### 4. APPLE_DEVELOPMENT_PROVISIONING_PROFILE_BASE64
- **Description**: Base64-encoded development provisioning profile
- **Value**: Base64 string of your .mobileprovision file
- **Generate with**: `base64 -i "Be Out Development Profile.mobileprovision" | pbcopy`

### 5. APPLE_DISTRIBUTION_PROVISIONING_PROFILE_BASE64
- **Description**: Base64-encoded distribution provisioning profile
- **Value**: Base64 string of your .mobileprovision file
- **Generate with**: `base64 -i "Be Out Distribution Profile.mobileprovision" | pbcopy`

### 6. APPLE_CERTIFICATE_PASSWORD
- **Description**: Password for the .p12 certificate files
- **Value**: The password you set when exporting certificates from Keychain
- **Note**: Can be the same for both development and distribution certificates

## Optional Secrets (for enhanced builds)

### 7. KEYCHAIN_PASSWORD
- **Description**: Password for temporary CI keychain
- **Value**: Any secure password (auto-generated if not provided)
- **Note**: Used internally by the CI pipeline

## Verification Checklist

After adding all secrets, verify:

- [ ] All 6 required secrets are added to GitHub
- [ ] Base64 values don't contain newlines or extra characters
- [ ] Certificate password matches what you used during export
- [ ] Team ID is exactly 10 characters
- [ ] Bundle ID in provisioning profiles matches `com.beout.app`

## Quick Setup Commands

Run these on your Mac after exporting certificates and profiles:

```bash
# Navigate to where you saved the files
cd ~/Downloads

# Convert development certificate
base64 -i ios_development.p12 | pbcopy
echo "✅ Development certificate copied to clipboard - paste into APPLE_DEVELOPMENT_CERTIFICATE_P12_BASE64"

# Convert distribution certificate
base64 -i ios_distribution.p12 | pbcopy
echo "✅ Distribution certificate copied to clipboard - paste into APPLE_DISTRIBUTION_CERTIFICATE_P12_BASE64"

# Convert development provisioning profile
base64 -i "Be Out Development Profile.mobileprovision" | pbcopy
echo "✅ Development profile copied to clipboard - paste into APPLE_DEVELOPMENT_PROVISIONING_PROFILE_BASE64"

# Convert distribution provisioning profile
base64 -i "Be Out Distribution Profile.mobileprovision" | pbcopy
echo "✅ Distribution profile copied to clipboard - paste into APPLE_DISTRIBUTION_PROVISIONING_PROFILE_BASE64"
```

## Troubleshooting

### "Invalid base64" errors
- Make sure there are no newlines in the base64 string
- Use `base64 -i file | tr -d '\n'` to remove newlines

### "Certificate not found" errors
- Verify the certificate password is correct
- Check that the .p12 file was exported correctly from Keychain

### "Provisioning profile" errors
- Ensure the bundle ID matches exactly: `com.beout.app`
- Verify the profile includes your certificates
- Check that the profile hasn't expired

## Security Notes

- These secrets contain sensitive cryptographic material
- Never commit certificates or provisioning profiles to git
- Rotate certificates annually (Apple requirement)
- Use different certificates for development vs distribution
- Consider using separate Apple IDs for CI vs personal development
