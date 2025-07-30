# Testing Google Sign-In in Tauri

This document explains how to test the Google Sign-in implementation in the Be Out! Tauri app.

## Prerequisites

1. Make sure you have built the app with the latest changes to the Google Sign-in plugin.
2. Ensure your Android environment is set up properly.

## Testing Options

You have two ways to test the Google Sign-in functionality:

### Option 1: Test through the dedicated test page

1. Build and run the app
2. Navigate to `/test-google-signin` in the app (you can enter this URL manually)
3. Click the "Test Google Sign-In" button
4. The test page will show detailed results of the sign-in process

### Option 2: Test through the regular login flow

1. Build and run the app
2. Go to the Login page
3. Click the "Continue with Google" button
4. Complete the Google authentication flow

## Debugging

If you encounter any issues during testing:

1. Check the Android logcat for error messages:
   ```bash
   adb logcat | grep -E 'GoogleSignin|TauriActivity'
   ```

2. Check the Chrome Inspector for the WebView:
   - Navigate to `chrome://inspect` in Chrome
   - You should see your device and the WebView
   - Click "inspect" to see console logs and errors

3. Common issues and solutions:

   - **"Context is not an Activity" error:**
     - This indicates that the plugin couldn't access the Android Activity
     - Make sure the plugin initialization is happening at the right time

   - **"No callback available to handle sign-in result" warning:**
     - This means the callback was lost or not properly registered
     - Check the Rust code that sets up the callback

   - **"Google sign-in failed" error:**
     - Check that your Google Cloud Console project is properly set up
     - Verify that the client ID in the plugin matches your Google Cloud Console project

## Testing New Changes

After making any changes to the plugin code:

1. Rebuild the Tauri app:
   ```bash
   cd /home/zen/dev/be-out-apps/client
   npm run tauri build
   ```

2. Run the app on your device or emulator
3. Navigate to the test page or login page as described above

## Next Steps After Successful Testing

Once you've confirmed that the Google Sign-in is working:

1. Clean up any test code
2. Remove the test page from production builds
3. Consider implementing additional error handling or retry logic

Remember to check both the successful authentication flow and error handling during your tests.
