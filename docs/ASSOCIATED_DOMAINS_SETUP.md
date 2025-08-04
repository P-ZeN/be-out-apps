# Associated Domains Setup for iOS Deep Links

## Overview
To enable deep-link functionality for your iOS app, you need to set up Associated Domains. This allows iOS to trust your domain and properly handle deep links to your app.

**IMPORTANT**: For Google OAuth on iOS, you should use the native iOS Google Sign-In SDK through tauri-plugin-google-auth (just like Android), NOT web-based OAuth redirects.

## Required Steps

### 1. Apple App Site Association (AASA) File
The AASA file is now automatically served from your server's public directory.

**File location on your server:**
```
https://server.be-out-app.dedibox2.philippezenone.net/.well-known/apple-app-site-association
```

**File content:** (already configured with your Team ID: FAC78H56RB)
- The file is served with `Content-Type: application/json`
- No file extension needed
- Must be accessible via HTTPS

### 2. Server Configuration (Already Done)
Your server now serves static files from the `public` directory, which includes the AASA file.

### 3. Verification
Test the AASA file is properly served:
```bash
curl -I https://server.be-out-app.dedibox2.philippezenone.net/.well-known/apple-app-site-association
```

Should return:
- Status: 200 OK
- Content-Type: application/json

### 4. Google OAuth Configuration for iOS
For iOS, you need to create a separate iOS OAuth client in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Create OAuth 2.0 Client ID
4. **Choose "iOS application"**
5. Set Bundle ID: `com.beout.app`
6. Set App Store ID: (your App Store ID when you have one)

**Key difference**: iOS OAuth clients don't use redirect URIs - they use bundle ID + Apple Team ID for verification.

### 5. iOS Entitlements
The iOS app will automatically get the Associated Domains entitlement:
```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:server.be-out-app.dedibox2.philippezenone.net</string>
</array>
```

## How iOS Google OAuth Works (Native SDK)

1. User taps Google Sign-In in your iOS app
2. tauri-plugin-google-auth uses iOS Google Sign-In SDK
3. Google SDK handles authentication natively (no web redirects)
4. Plugin receives ID token and sends it to your server for validation
5. Server validates token and returns your app's JWT
6. App stores JWT for authenticated requests

This is the SAME pattern you use for Android - no web redirects needed!

## Testing

1. Build and install the iOS app with proper code signing
2. Test the Google OAuth flow
3. Verify deep links work for other app features
4. Use Apple's validation tool: https://search.developer.apple.com/appsearch-validation-tool/

## Important Notes

- AASA file must be served over HTTPS
- Changes to AASA file can take up to 24 hours to propagate
- iOS caches AASA files, so you may need to reinstall the app during development
- The domain must be accessible from Apple's servers for validation
- For Google OAuth, use iOS native SDK (like Android) - don't use web redirects!
