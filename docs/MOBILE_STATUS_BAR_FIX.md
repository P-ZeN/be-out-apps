# Mobile Status Bar Fix for Tauri Apps

## Problem Description

The mobile Tauri apps had issues with the status bar (utilities bar) handling:

### Android
- The AppBar was appearing under the phone's status bar (time, networks, etc.)
- Content was not properly positioned relative to the status bar

### iOS  
- The AppBar correctly displayed below the status bar
- However, when scrolling, content became visible under the status bar above the AppBar

## Solution Implemented

### 1. HTML Viewport Meta Tag (`client/index.html`)
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```
- Added `viewport-fit=cover` to enable safe area support

### 2. CSS Safe Area Support (`client/src/App.css`)

#### Body-level Safe Area Handling
```css
body.tauri-mobile {
    /* Prevent content from appearing behind status bar */
    padding-top: env(safe-area-inset-top, 0px);
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

#### Content Area Adjustments
```css
body.tauri-mobile .main-content {
    /* AppBar height without safe area (handled separately) */
    padding-top: 72px; 
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
}
```

### 3. AppBar Positioning (`client/src/components/MainMenu.jsx`)
```jsx
sx={{
    // Handle mobile status bar for Tauri apps
    ...(isTauriApp && {
        // Position AppBar below status bar on mobile
        top: 'env(safe-area-inset-top, 0px)',
        zIndex: 1300,
    }),
}}
```

### 4. Platform Detection (`client/src/App.jsx`)
```jsx
useEffect(() => {
    const isTauriApp = getIsTauriApp();
    if (isTauriApp) {
        document.body.classList.add('tauri-mobile');
    }
    
    return () => {
        document.body.classList.remove('tauri-mobile');
    };
}, []);
```

## How It Works

### Android Tauri Apps
1. **Status Bar**: Preserved at the top
2. **AppBar**: Positioned just below status bar using `top: env(safe-area-inset-top)`
3. **Content**: Starts below AppBar with proper padding
4. **Safe Areas**: Left/right notches and bottom gestures handled

### iOS Tauri Apps  
1. **Status Bar**: Preserved at the top
2. **AppBar**: Positioned below status bar
3. **Content**: Cannot scroll under status bar due to body padding
4. **Safe Areas**: Notch, home indicator, and side bezels handled

### Web Apps
- No changes to existing behavior
- Safe area CSS is ignored (fallback to 0px)
- AppBar positioning remains unchanged

## CSS Environment Variables Used

- `env(safe-area-inset-top)` - Status bar height
- `env(safe-area-inset-left)` - Left notch/bezel
- `env(safe-area-inset-right)` - Right notch/bezel  
- `env(safe-area-inset-bottom)` - Home indicator/gesture area

## Testing

### Android Testing
```bash
cd client
npm run build
cd src-tauri
cargo tauri android dev
```

### iOS Testing (when available)
```bash
cd client
npm run build
cd src-tauri
cargo tauri ios dev
```

### Web Testing (verify no regression)
```bash
cd client
npm run dev
```

## Files Modified

1. `client/index.html` - Added viewport-fit=cover
2. `client/src/App.css` - Safe area CSS rules
3. `client/src/App.jsx` - Platform detection and body class
4. `client/src/components/MainMenu.jsx` - AppBar positioning
5. `docs/MOBILE_STATUS_BAR_FIX.md` - This documentation

## Compatibility

- **Android**: API level 24+ (as per Tauri config)
- **iOS**: 15.0+ (as per Tauri config)  
- **Web browsers**: Backward compatible (safe area ignored)
- **Desktop Tauri**: No impact

## Notes

- The solution uses CSS environment variables which are supported by WebView on both platforms
- Fallback values ensure compatibility with browsers that don't support safe areas
- The approach separates concerns: body handles safe areas, components handle their own positioning
- Platform detection ensures mobile-specific code only runs when needed
