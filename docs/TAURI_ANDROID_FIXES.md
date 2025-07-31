# Tauri Android Fixes Summary

## Issues Fixed

### 1. Android App Icon Issue ✅

**Problem**: The installed app on Android Studio emulator was using the default Tauri icon instead of custom icons.

**Root Cause**: In Tauri 2.0, Android apps require icons to be placed in the proper Android resource directories (`res/android/mipmap-*`), not just configured in `tauri.conf.json`.

**Solution Applied**:
- Created proper Android resource directories:
  - `src-tauri/res/android/mipmap-mdpi/` (48x48)
  - `src-tauri/res/android/mipmap-hdpi/` (72x72)
  - `src-tauri/res/android/mipmap-xhdpi/` (96x96)
  - `src-tauri/res/android/mipmap-xxhdpi/` (144x144)
  - `src-tauri/res/android/mipmap-xxxhdpi/` (192x192)

- Copied appropriate Android icons to each directory:
  ```bash
  android-icon-48.png  → mipmap-mdpi/ic_launcher.png & ic_launcher_round.png
  android-icon-72.png  → mipmap-hdpi/ic_launcher.png & ic_launcher_round.png
  android-icon-96.png  → mipmap-xhdpi/ic_launcher.png & ic_launcher_round.png
  android-icon-144.png → mipmap-xxhdpi/ic_launcher.png & ic_launcher_round.png
  android-icon-192.png → mipmap-xxxhdpi/ic_launcher.png & ic_launcher_round.png
  ```

### 2. Mapbox "Wrong Token" Error on Tauri ⚠️ (Simplified Fix)

**Problem**: Map component displayed "wrong token" error in Tauri bundled version, despite using the same token as the working web app.

**Root Cause**:
- Tauri apps run with `tauri://localhost` origin instead of standard web origins
- Different WebView environment requires simpler CSP approach

**Solution Applied**:

#### A. Enhanced Token Detection
- Added Tauri environment detection in `MapComponent.jsx`
- Improved debug logging for Tauri-specific information
- Simplified API testing approach

#### B. Updated Tauri Configuration (`tauri.conf.json`)
- Fixed Content Security Policy to allow Mapbox Web Workers and blob URLs:
  ```json
  "security": {
      "csp": "default-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; worker-src 'self' blob:; connect-src 'self' https: wss: data: blob:; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' data:; font-src 'self' data: https:;"
  }
  ```

**Key CSP Changes for Mapbox**:
- Added `worker-src 'self' blob:` to allow Web Workers
- Added `blob:` to `script-src` for worker scripts
- Added `blob:` to `connect-src` and `img-src` for data URLs

**Note**: The initial HTTP plugin approach caused startup crashes, so we've reverted to a simpler CSP-based solution that should work with the existing Tauri WebView.

## Files Modified

1. **src-tauri/tauri.conf.json**: Simplified CSP for Mapbox compatibility
2. **src/components/MapComponent.jsx**: Enhanced Tauri detection and simplified API testing
3. **src-tauri/res/android/mipmap-**/**: Created proper Android icon directories

## Additional Files Created

1. **fix-android-icons.sh**: Build script to automate icon setup and rebuilding

## How to Apply Fixes

### For Icons:
```bash
cd client
./fix-android-icons.sh
```

### For Manual Build:
```bash
cd client
npm run build
cd src-tauri
cargo clean  # Important: clean to avoid plugin conflicts
cargo tauri android build --apk
```

## Testing the Fixes

1. **Icon Fix**: Install the new APK and verify your custom icon appears in the app launcher
2. **Mapbox Fix**: Open the app and navigate to the map view. The simplified CSP should allow Mapbox to load properly.

## Environment Variables

Make sure your `.env` file contains:
```
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoicGhpbGlwcGV6ZW5vbmUiLCJhIjoiY21jeXQyemdpMHRwazJrc2JkdG9vZzViaCJ9.0h5JWCXgM5nY6hrDtj-vsw
```

## Important Notes

- **Startup Crash Fix**: Removed HTTP plugin dependencies that were causing the app to crash on startup
- **Simplified Approach**: Using CSP-based solution instead of complex plugin architecture
- **Clean Builds**: Always run `cargo clean` before rebuilding to avoid cached plugin conflicts

## Debug Information

The MapComponent logs extensive debug information including:
- Environment detection (Tauri vs web)
- Token validation and source
- Origin and protocol information

Check the browser/webview console for detailed debug output.

## Troubleshooting

If the app still crashes:
1. Run `cargo clean` in the `src-tauri` directory
2. Remove `src-tauri/gen` directory completely
3. Rebuild with the fixed configuration

### 2. Mapbox "Wrong Token" Error on Tauri ✅

**Problem**: Map component displayed "wrong token" error in Tauri bundled version, despite using the same token as the working web app.

**Root Cause**:
- Tauri apps run with `tauri://localhost` origin instead of standard web origins
- Missing Content Security Policy (CSP) and HTTP permissions for Mapbox API access
- Environment variable handling differences between web and Tauri builds

**Solution Applied**:

#### A. Enhanced Token Detection
- Added Tauri environment detection in `MapComponent.jsx`
- Improved debug logging for Tauri-specific information
- Enhanced API testing with proper origin headers

#### B. Updated Tauri Configuration (`tauri.conf.json`)
- Added HTTP plugin with Mapbox domain permissions:
  ```json
  "http": {
      "all": true,
      "request": true,
      "scope": [
          "https://api.mapbox.com/**",
          "https://*.tiles.mapbox.com/**",
          "https://events.mapbox.com/**"
      ]
  }
  ```

- Added Content Security Policy for Mapbox:
  ```json
  "security": {
      "csp": "default-src 'self'; connect-src 'self' https://api.mapbox.com https://*.tiles.mapbox.com https://events.mapbox.com wss://events.mapbox.com; img-src 'self' data: https://*.tiles.mapbox.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval';"
  }
  ```

#### C. Added HTTP Plugin Dependencies
- Updated `Cargo.toml` with `tauri-plugin-http = "2.3.1"`
- Added plugin initialization in `src/lib.rs`

## Files Modified

1. **src-tauri/tauri.conf.json**: Added HTTP permissions and CSP
2. **src-tauri/Cargo.toml**: Added HTTP plugin dependency
3. **src-tauri/src/lib.rs**: Added HTTP plugin initialization
4. **src/components/MapComponent.jsx**: Enhanced Tauri detection and error handling
5. **src-tauri/res/android/mipmap-**/**: Created proper Android icon directories

## Additional Files Created

1. **fix-android-icons.sh**: Build script to automate icon setup and rebuilding

## How to Apply Fixes

### For Icons:
```bash
cd client
./fix-android-icons.sh
```

### For Manual Build:
```bash
cd client
npm run build
cd src-tauri
cargo tauri android build --apk
```

## Testing the Fixes

1. **Icon Fix**: Install the new APK and verify your custom icon appears in the app launcher
2. **Mapbox Fix**: Open the app and navigate to the map view - it should load without "wrong token" errors

## Environment Variables

Make sure your `.env` file contains:
```
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoicGhpbGlwcGV6ZW5vbmUiLCJhIjoiY21jeXQyemdpMHRwazJsc2JkdG9vZzViaCJ9.0h5JWCXgM5nY6hrDtj-vsw
```

The enhanced MapComponent now has multiple fallback strategies for token detection in different environments.

## Debug Information

The MapComponent now logs extensive debug information to help troubleshoot any remaining issues:
- Environment detection (Tauri vs web)
- Token validation and source
- API connectivity tests
- Origin and protocol information

Check the browser/webview console for detailed debug output.
