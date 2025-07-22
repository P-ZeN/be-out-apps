# OAuth Implementation Setup - Complete Guide

## What We've Implemented

### ✅ Fixed Issues
1. **Google OAuth for Mobile**: Now uses proper desktop OAuth client with PKCE flow
2. **Apple Sign In**: Added native iOS support with web fallback
3. **Deep Link Handling**: Proper URL scheme registration and handling
4. **WebView Overlay**: Preserved external link handling
5. **Platform Detection**: Maintained proper home page routing

### ✅ Key Components Updated

#### Frontend Changes
- **`src-tauri/tauri.conf.json`**: Added deep link configuration
- **`src-tauri/Cargo.toml`**: Added deep link plugin dependency
- **`src-tauri/src/lib.rs`**: Enhanced OAuth handling with deep links
- **`src/services/desktopAuthService.js`**: Complete rewrite with proper OAuth flows
- **`src/components/Login.jsx`**: Simplified OAuth handling
- **`src/components/Register.jsx`**: Improved OAuth integration
- **`package.json`**: Added deep link plugin

#### Backend Changes
- **`server/src/routes/desktopAuth.js`**: Enhanced Apple OAuth and improved Google OAuth
- **Server environment variables**: Maintained proper client ID configuration

## Environment Configuration

### Required Environment Variables

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

**CRITICAL**: You must use a **Desktop Application** OAuth client, not a Web client:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Create OAuth 2.0 Client ID
4. **Choose "Desktop application"** (not Web application)
5. Add authorized redirect URIs:
   - `urn:ietf:wg:oauth:2.0:oob`
   - `com.beout.app://oauth`

**Why Desktop Client?**: Google restricts web OAuth clients from being used in packaged applications. Desktop clients with PKCE provide the proper security for mobile apps.

## OAuth Flow Details

### Mobile OAuth Flow (Google & Apple)

1. **User Clicks OAuth Button**
2. **PKCE Generation**: App generates code verifier and challenge
3. **System Browser**: Opens OAuth URL in device's default browser
4. **User Authentication**: User signs in with provider
5. **Deep Link Callback**: Provider redirects to `com.beout.app://oauth?code=...`
6. **Token Exchange**: App exchanges authorization code for access token
7. **User Login**: App logs in user with received token

### Desktop OAuth Flow (Google)

1. **User Clicks OAuth Button**
2. **Local Server**: App starts local HTTP server
3. **System Browser**: Opens OAuth URL in default browser
4. **User Authentication**: User signs in with Google
5. **Local Callback**: Google redirects to local server
6. **Token Exchange**: App exchanges code for token
7. **User Login**: App logs in user

## Security Features

### PKCE (Proof Key for Code Exchange)
- **Protection**: Prevents authorization code interception
- **Implementation**: SHA256 code challenge/verifier pair
- **Standard**: RFC 7636 compliant

### Deep Link Security
- **URL Scheme**: `com.beout.app://oauth`
- **Validation**: Server validates all tokens
- **Timeout**: 5-minute OAuth timeout

## Installation Steps

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Build Tauri App
```bash
cd client
npm run tauri build
```

### 3. Configure OAuth Providers

#### Google Setup
1. Create Desktop OAuth client in Google Cloud Console
2. Add redirect URIs as specified above
3. Update environment variables with client ID and secret

#### Apple Setup (iOS only)
1. Enable "Sign in with Apple" in Apple Developer Portal
2. Configure App ID with Sign in with Apple capability
3. Create Service ID for web authentication

### 4. Testing

#### Development Testing
```bash
# Start development server
cd client
npm run tauri dev

# Test OAuth flows in the app
```

#### Deep Link Testing (Android)
```bash
# Test deep link manually
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "com.beout.app://oauth?code=test_code" \
  com.beout.app
```

## Deployment Checklist

### Pre-deployment
- [ ] Configure production OAuth clients
- [ ] Update environment variables for production
- [ ] Test on physical devices (Android/iOS)
- [ ] Verify deep link registration
- [ ] Test with real OAuth providers

### Mobile App Store Deployment
- [ ] Configure app store OAuth settings
- [ ] Add OAuth privacy policy URLs
- [ ] Test OAuth flows on production builds
- [ ] Verify deep link handling

## Troubleshooting

### Common Issues

**1. "OAuth error: invalid_client"**
- **Cause**: Wrong client ID or using web client instead of desktop
- **Fix**: Verify using desktop OAuth client ID

**2. "Deep link not working"**
- **Cause**: URL scheme not registered properly
- **Fix**: Check `tauri.conf.json` and rebuild app

**3. "Token exchange failed"**
- **Cause**: Server configuration or network issues
- **Fix**: Check server logs and environment variables

**4. "OAuth timeout"**
- **Cause**: User didn't complete OAuth within 5 minutes
- **Fix**: User should retry OAuth process

### Debug Tips

1. **Enable Console Logging**:
   ```javascript
   // The OAuth service has comprehensive logging
   // Check browser console for detailed flow information
   ```

2. **Check Server Logs**:
   ```bash
   # Monitor server logs during OAuth
   tail -f server/logs/app.log
   ```

3. **Test OAuth URLs**:
   ```bash
   # Manually test OAuth URLs in browser
   # Check if they redirect correctly
   ```

## What's Preserved

### ✅ Existing Features Maintained
- **HomeWrapper**: Web shows landing page, mobile shows events
- **WebView Overlay**: External links open in overlay with back button
- **Platform Detection**: Proper Tauri vs web detection
- **User Onboarding**: OAuth users still go through onboarding
- **Multiple Home Pages**: Landing page vs events page routing

### ✅ External Link Handling
The WebView overlay system is preserved:
- External links in mobile app open in overlay
- Back/close button prevents users getting stuck
- Web behavior unchanged (opens in new tab)

## Next Steps

### Phase 1: Testing
1. Test OAuth flows thoroughly
2. Verify deep link handling
3. Test on physical devices

### Phase 2: Production Deployment
1. Configure production OAuth clients
2. Deploy to app stores
3. Monitor OAuth success rates

### Phase 3: Enhancements
1. Add refresh token rotation
2. Implement biometric authentication
3. Add OAuth provider management

## Support

For issues with this implementation:
1. Check the console logs for detailed error information
2. Verify environment variable configuration
3. Test OAuth URLs manually in browser
4. Check server logs for token exchange errors

The implementation follows OAuth 2.0 best practices and should work reliably across all platforms while maintaining the existing user experience.
