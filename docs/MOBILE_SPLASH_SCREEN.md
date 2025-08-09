# Mobile App Splash Screen

This document explains the splash screen implementation for the BeOut mobile apps (iOS and Android) built with Tauri.

## Overview

The splash screen displays the app icon centered with a loading animation while the React app is loading. It provides a smooth user experience by showing the app branding immediately when the app launches.

## Implementation

### 1. HTML Structure (`index.html`)
- The splash screen is defined directly in the HTML to ensure it shows immediately
- Uses inline CSS for instant styling without waiting for external CSS files
- Includes accessibility attributes for screen readers
- Has a fallback image in case the primary SVG icon fails to load

### 2. JavaScript Hook (`src/hooks/useSplashScreen.js`)
- `useSplashScreen()`: Provides functions to manually show/hide the splash screen
- `useAutoHideSplashScreen(delay)`: Automatically hides the splash screen after a delay
- Handles body scroll prevention during splash display
- Manages smooth transition and cleanup

### 3. App Integration (`src/App.jsx`)
- Uses `useAutoHideSplashScreen(1200)` to hide splash after 1.2 seconds
- Ensures the app has properly rendered before hiding the splash

## Features

### Visual Design
- **Gradient Background**: Orange gradient matching the app's brand colors (#FF5917 to #FF7A47)
- **Centered Icon**: App icon with subtle shadow and pulse animation
- **App Name**: "Be Out!" text below the icon
- **Loading Dots**: Three animated dots indicating loading progress

### Responsive Design
- Adapts to different screen sizes (desktop, tablet, mobile)
- Handles landscape orientation on mobile devices
- Accounts for mobile safe areas (notches, status bars)
- Different icon sizes for various screen sizes

### Accessibility
- Proper ARIA labels for screen readers
- Role="status" for loading indication
- Descriptive alt text for images
- Prevents image dragging and selection

### Performance
- Inline CSS prevents flash of unstyled content
- Fallback image loading for better reliability
- Prevents body scroll during splash display
- Smooth fade-out transition

## Customization

### Timing
To adjust how long the splash screen shows:
```javascript
// In App.jsx, change the delay parameter (in milliseconds)
useAutoHideSplashScreen(2000); // Show for 2 seconds
```

### Colors
To change the splash screen colors, update the CSS in `index.html`:
```css
/* Background gradient */
background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);

/* Loading dots color */
background-color: rgba(255, 255, 255, 0.8); /* White with transparency */
```

### Icon
To use a different icon:
1. Replace `/be-out_icon_512.svg` in the `src` attribute
2. Update the fallback image in the `onerror` attribute
3. Ensure the icon is available in the `public` folder

### Animation
To modify animations, update the CSS keyframes:
```css
/* Icon pulse animation */
@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

/* Loading dots animation */
@keyframes loading {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
}
```

### Manual Control
For more advanced control, use the hook directly:
```javascript
import { useSplashScreen } from './hooks/useSplashScreen';

const MyComponent = () => {
    const { hideSplashScreen, showSplashScreen } = useSplashScreen();
    
    // Hide splash when some condition is met
    useEffect(() => {
        if (dataLoaded) {
            hideSplashScreen();
        }
    }, [dataLoaded]);
};
```

## Mobile-Specific Considerations

### iOS
- Handles safe areas automatically using CSS `env()` functions
- Compatible with iOS 15.0+ (as specified in Tauri config)
- Works with both portrait and landscape orientations

### Android
- Accounts for different screen densities and sizes
- Handles Android's soft navigation buttons
- Compatible with Android API 24+ (as specified in Tauri config)

### Tauri Integration
- Works seamlessly with Tauri's webview
- No conflicts with Tauri's built-in window management
- Maintains performance during app initialization

## Troubleshooting

### Splash Screen Not Showing
1. Check that the splash screen HTML is in `index.html`
2. Verify the CSS is properly inline
3. Ensure the icon file exists in the `public` folder

### Splash Screen Not Hiding
1. Check that `useAutoHideSplashScreen` is called in your App component
2. Verify there are no JavaScript errors preventing the hook from running
3. Check browser console for any error messages

### Icon Not Loading
1. Verify the icon path is correct (`/be-out_icon_512.svg`)
2. Check that the fallback image exists (`/be-out_logo_orange.png`)
3. Test with different image formats if needed

### Performance Issues
1. Ensure icons are optimized for web (compressed)
2. Consider reducing animation complexity if needed
3. Monitor console for performance warnings

## Testing

### Local Development
```bash
npm run dev
# Open in browser to test splash screen timing
```

### Mobile Preview
```bash
npm run build:mobile
npm run tauri:android:dev  # For Android
npm run tauri:ios:dev      # For iOS
```

### Build Testing
```bash
npm run build:client
# Test that splash screen works with production build
```

The splash screen should appear immediately when the app launches and disappear smoothly once the React app has loaded.
