# Platform-Aware Landing Page Implementation

This implementation creates a platform-aware landing page that shows different content based on whether the app is viewed as a webpage or in the bundled Tauri app.

## How It Works

### Web Browser Experience
When users visit the app through a web browser, they see:
- A beautiful landing page introducing the concept
- Links to iOS and Android app stores
- Feature highlights and app screenshots
- Call-to-action buttons for app downloads

### Bundled App Experience
When users open the Tauri-bundled app, they see:
- The normal events home page
- Full app functionality without landing page interference

## Key Components

### 1. Platform Detection (`src/utils/platformDetection.js`)
Detects whether the app is running in:
- **Tauri environment**: Bundled desktop/mobile app
- **Web browser**: Regular web experience

Detection methods:
- Checks for Tauri API objects (`window.__TAURI__`, `window.__TAURI_IPC__`, etc.)
- Examines user agent for Tauri signatures
- Looks for file:// or tauri:// protocols
- Fallback: assumes web browser if none detected

### 2. HomeWrapper Component (`src/components/HomeWrapper.jsx`)
Smart wrapper that:
- Renders `LandingPage` for web browsers
- Renders `Home` (events page) for Tauri apps
- Handles platform detection on component mount

### 3. Landing Page (`src/components/LandingPage.jsx`)
Beautiful marketing page featuring:
- Hero section with app description
- App store download buttons (iOS/Android)
- Feature highlights with icons
- Responsive design with Material-UI
- "Coming Soon" indicators

### 4. Debug Component (`src/components/PlatformDebug.jsx`)
Development helper that shows:
- Current platform detection status
- Browser protocol and user agent info
- Only visible in development mode

## Development Commands

```bash
# Regular web development
npm run dev

# Tauri development (opens bundled app)
npm run tauri:dev

# Build for web
npm run build

# Build Tauri app for desktop/mobile
npm run tauri:build
```

## Testing the Implementation

### Web Browser Test
1. Run `npm run dev`
2. Open http://localhost:3000
3. Should see the landing page with app store buttons

### Tauri App Test
1. Run `npm run tauri:dev`
2. Tauri window opens with the app
3. Should see the events home page directly

### Debug Information
In development mode, a debug panel appears in the top-right corner showing:
- Platform type (web/tauri)
- Detection results
- Browser information

## Configuration

### App Store Links
Update the href attributes in `LandingPage.jsx`:
```jsx
// iOS App Store
href="https://apps.apple.com/app/your-app-id"

// Google Play Store
href="https://play.google.com/store/apps/details?id=com.beout.app"
```

### App Bundle Settings
Tauri configuration in `src-tauri/tauri.conf.json`:
- App identifier: `com.beout.app`
- Category: `Lifestyle`
- Version: `1.0.0`

## Mobile App Store Submission

The Tauri configuration is set up for mobile app store submission:

### iOS App Store
- Proper bundle identifier
- Lifestyle category
- App icons configured
- Proper entitlements (update as needed)

### Google Play Store
- Android target configuration
- Proper package name
- App metadata configured

## File Structure
```
src/
├── components/
│   ├── HomeWrapper.jsx      # Platform-aware router
│   ├── LandingPage.jsx      # Web landing page
│   ├── PlatformDebug.jsx    # Development helper
│   └── AppRoutes.jsx        # Updated to use HomeWrapper
├── utils/
│   └── platformDetection.js # Platform detection logic
└── pages/
    └── Home.jsx            # Original events page
```

## Notes

- The platform detection is cached after first run for performance
- Debug component automatically hides in production builds
- Vite configuration optimized for both web and Tauri builds
- Landing page uses responsive design for all screen sizes
- App store buttons include proper styling and hover effects

## Future Enhancements

1. Add actual app screenshots to landing page
2. Implement email signup for launch notifications
3. Add analytics tracking for web vs app usage
4. Create dynamic content based on detected mobile OS
5. Add progressive web app (PWA) features for web users
