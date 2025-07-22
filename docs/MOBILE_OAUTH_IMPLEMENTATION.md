# Mobile OAuth Implementation Guide

## Overview

This document outlines the OAuth implementation for the Be Out mobile app using Tauri. The implementation supports both Google OAuth and Apple Sign In for mobile devices.

## Architecture

### OAuth Flow Types
1. **Desktop OAuth**: Uses local HTTP server for callback (existing implementation)
2. **Mobile OAuth**: Uses deep links and system browser for enhanced security
3. **Apple Sign In**: Native iOS implementation with web fallback

### Key Components
- `desktopAuthService.js`: Handles all OAuth flows
- `lib.rs`: Rust backend with deep link handling
- `desktopAuth.js`: Server-side token exchange
- OAuth callback pages for manual code entry

## Configuration

### Environment Variables

#### Client (.env)
```bash
VITE_GOOGLE_CLIENT_ID_DESKTOP=your_desktop_client_id
VITE_API_URL=http://localhost:3000
```

#### Server (.env)
```bash
GOOGLE_CLIENT_ID_DESKTOP=your_desktop_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
APPLE_CLIENT_ID=com.beout.app
JWT_SECRET=your_jwt_secret
```

### Google OAuth Setup

1. **Create Desktop Application Client**:
   - Go to Google Cloud Console
   - Create new OAuth 2.0 Client ID
   - Application type: "Desktop application"
   - Add redirect URIs:
     - `urn:ietf:wg:oauth:2.0:oob`
     - `com.beout.app://oauth`

2. **Important**: Use Desktop client ID, not Web client ID, for mobile apps
   - Web client IDs are restricted by Google for packaged apps
   - Desktop client IDs allow PKCE flow which is more secure for mobile

### Apple Sign In Setup

1. **Apple Developer Account**:
   - Enable Sign in with Apple capability
   - Configure App ID with Sign in with Apple
   - Set up Service ID for web authentication

2. **App Configuration**:
   - Client ID: `com.beout.app`
   - Redirect URI: `com.beout.app://oauth`

## Deep Link Configuration

### Tauri Configuration (tauri.conf.json)
```json
{
  "bundle": {
    "android": {
      "allowlist": {
        "urlScheme": "com.beout.app"
      }
    }
  },
  "plugins": {
    "deep-link": {
      "schemes": ["com.beout.app"]
    }
  }
}
```

### Android Manifest
The Tauri build process automatically adds the required intent filters:
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.beout.app" />
</intent-filter>
```

### iOS Configuration
Add URL scheme to Info.plist (handled by Tauri):
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.beout.app</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.beout.app</string>
        </array>
    </dict>
</array>
```

## OAuth Flow Details

### Google OAuth (Mobile)

1. **PKCE Generation**: Generate code verifier and challenge
2. **Authorization URL**: Open system browser with OAuth URL
3. **User Authentication**: User signs in with Google
4. **Deep Link Callback**: Google redirects to `com.beout.app://oauth?code=...`
5. **Token Exchange**: Exchange authorization code for access token
6. **User Creation**: Create or update user in database

### Apple Sign In (iOS)

1. **Authorization URL**: Open Apple ID authentication
2. **User Authentication**: User signs in with Apple ID
3. **Token Response**: Receive identity token
4. **Token Verification**: Verify and decode identity token
5. **User Creation**: Create or update user in database

### Fallback Flow (Desktop/Manual)

1. **OAuth Window**: Open popup window with manual code entry
2. **System Browser**: User completes OAuth in default browser
3. **Manual Entry**: User copies authorization code to app
4. **Token Exchange**: Exchange code for tokens

## Security Considerations

### PKCE (Proof Key for Code Exchange)
- **Code Verifier**: Random 256-bit string
- **Code Challenge**: SHA256 hash of code verifier
- **Prevents**: Authorization code interception attacks

### Deep Link Security
- **URL Scheme Validation**: Verify incoming deep links
- **State Parameter**: Include state for CSRF protection
- **Timeout Handling**: Implement reasonable timeouts

### Token Storage
- **Secure Storage**: Use platform-specific secure storage
- **Token Rotation**: Implement refresh token rotation
- **Expiration**: Respect token expiration times

## Error Handling

### Common Error Scenarios
1. **Network Connectivity**: Handle offline scenarios
2. **User Cancellation**: Graceful handling of user cancellation
3. **Invalid Tokens**: Proper error messages for invalid tokens
4. **Deep Link Failures**: Fallback to manual entry

### Error Recovery
- **Retry Logic**: Implement exponential backoff
- **User Guidance**: Clear error messages and next steps
- **Logging**: Comprehensive error logging for debugging

## Testing

### Development Testing
```bash
# Test deep link handling
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "com.beout.app://oauth?code=test_code" \
  com.beout.app
```

### Production Testing
1. Test on physical devices
2. Verify deep link registration
3. Test with real OAuth providers
4. Validate token exchange

## Troubleshooting

### Common Issues

1. **Deep Links Not Working**:
   - Verify URL scheme registration
   - Check Android intent filters
   - Validate iOS URL schemes

2. **OAuth Failures**:
   - Verify client ID configuration
   - Check redirect URI registration
   - Validate PKCE implementation

3. **Token Exchange Errors**:
   - Verify server endpoint configuration
   - Check client secret configuration
   - Validate request parameters

### Debug Tips
- Enable verbose logging in development
- Use browser developer tools for web testing
- Monitor server logs for token exchange
- Test with OAuth playground tools

## Deployment Checklist

### Pre-deployment
- [ ] Configure production OAuth clients
- [ ] Update environment variables
- [ ] Test on physical devices
- [ ] Verify deep link registration
- [ ] Test token exchange endpoints

### Post-deployment
- [ ] Monitor OAuth success rates
- [ ] Check error logs
- [ ] Verify user creation flow
- [ ] Test account linking scenarios

## References

- [Google OAuth 2.0 for Mobile & Desktop Apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Apple Sign In Documentation](https://developer.apple.com/documentation/sign_in_with_apple)
- [Tauri Mobile Guide](https://tauri.app/v1/guides/getting-started/setup/mobile)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
