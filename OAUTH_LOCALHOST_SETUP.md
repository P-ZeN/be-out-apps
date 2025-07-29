# OAuth Localhost Setup for Google Cloud Console

## Important: Google Cloud Console Configuration

The OAuth plugin creates a temporary localhost server on a random port (e.g., `http://localhost:38901/callback`).

### Required Action:

You need to add localhost redirect URIs to your Google Cloud Console OAuth configuration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Click on your OAuth 2.0 Client ID (for Android: `1064619689471-7lr8e71tr6h55as83o8gn4bdnhabavpu.apps.googleusercontent.com`)
4. Add these authorized redirect URIs:

```
http://localhost:8000/callback
http://localhost:8001/callback
http://localhost:8002/callback
http://localhost:8003/callback
http://localhost:8004/callback
http://localhost:8005/callback
http://localhost:8006/callback
http://localhost:8007/callback
http://localhost:8008/callback
http://localhost:8009/callback
```

**Or better yet, configure the OAuth plugin to use fixed ports:**

```javascript
// In your OAuth configuration, specify fixed ports
const port = await invoke('plugin:oauth|start', {
    config: {
        ports: [8000, 8001, 8002, 8003, 8004]
    }
});
```

Then you only need to add these specific ports to Google Cloud Console.

## Current Status

- ✅ OAuth plugin is working and starting server
- ✅ Server generates correct redirect URI (`http://localhost:{port}/callback`)
- ❌ Google Cloud Console needs localhost redirect URIs configured
- ❌ Shell plugin can't open URLs on Android (manual URL opening required)

## Next Steps

1. Configure Google Cloud Console with localhost redirect URIs
2. Test the complete OAuth flow
3. Consider using fixed ports for better control
