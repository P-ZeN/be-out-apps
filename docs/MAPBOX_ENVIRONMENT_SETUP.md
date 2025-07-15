# Environment Variables Setup for Dockploy

## Problem
The Mapbox map wasn't showing in the deployed version because Vite environment variables need to be available at build time, not just runtime.

## Solution
We've implemented a hybrid approach that supports both build-time and runtime environment variables.

## How to Configure in Dockploy

### 1. Build-time Variables (Recommended)
In Dockploy, go to your app settings:
- Navigate to **"Environment"** tab
- In the **"Build-time Variables"** section, add:
  ```
  VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
  VITE_API_URL=your_api_url_here
  VITE_API_BASE_URL=your_api_base_url_here
  ```

### 2. Runtime Variables (Fallback)
In the **"Environment Settings"** box, add the same variables:
```
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
VITE_API_URL=your_api_url_here
VITE_API_BASE_URL=your_api_base_url_here
```

## How the Code Works

The MapComponent now uses a `getMapboxToken()` function that tries multiple strategies:

1. **Build-time Vite variable**: `import.meta.env.VITE_MAPBOX_ACCESS_TOKEN`
2. **Runtime window variable**: `window.ENV.VITE_MAPBOX_ACCESS_TOKEN`
3. **Meta tag**: `<meta name="mapbox-token" content="...">`
4. **Fallback token**: Your hardcoded token

## Docker Changes

1. **docker-entrypoint.sh**: Replaces placeholder values in HTML/JS files at container startup
2. **Dockerfile**: Includes build-time ARG declarations for the Mapbox token
3. **index.html**: Contains placeholders that get replaced at runtime

## Testing

After deployment:
1. Check browser console for any map-related errors
2. Verify the Mapbox token is properly loaded in the Network tab
3. The map should display correctly on the `/map` page

## Fallback
If environment variables fail to load, the app will still work using the hardcoded token as a fallback.
