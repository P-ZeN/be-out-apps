# Google Sign-In Android Integration Guide

This document describes how to integrate Google Sign-In functionality into your Tauri Android app.

## Current Issue and Status

We have successfully implemented the Google Sign-In plugin, but we're encountering a build integration issue where the Tauri-generated MainActivity.kt file expects to import `com.plugin.googlesignin.GoogleSignInHelper`, but this class isn't available in the build classpath.

## Issue Analysis

The root problem is that when Tauri generates the Android project, it creates a MainActivity.kt that tries to import our plugin classes, but the build system doesn't know where to find them. This is because:

1. Our plugin is structured as a separate Android library
2. The main app's build.gradle doesn't include our plugin as a dependency
3. The Tauri build process doesn't automatically integrate custom plugins

## Current Plugin Structure

```
plugins/tauri-plugin-google-signin/
├── android/
│   ├── src/main/java/com/plugin/googlesignin/
│   │   ├── GoogleSignInHelper.java
│   │   └── GoogleSigninPlugin.kt
│   ├── build.gradle
│   └── AndroidManifest.xml
├── src/
│   ├── lib.rs
│   ├── commands.rs
│   ├── models.rs
│   └── mobile.rs
└── Cargo.toml
```

## Solutions to Consider

### Option 1: Proper Android Library Integration
- Build the plugin as an Android Archive (AAR)
- Configure the main app to include this AAR as a dependency
- Ensure the plugin is properly registered in the build system

### Option 2: Source Integration
- Copy the plugin's Java/Kotlin sources directly into the main app
- Modify the build configuration to include these sources
- This would be a simpler but less modular approach

### Option 3: Tauri Plugin System Enhancement
- Investigate if there's a proper way to register Android plugins with Tauri
- This might require updates to the Tauri configuration or build process

## Recommended Next Steps

1. **Research Tauri's Android plugin architecture**: Check the official Tauri documentation for Android plugin integration
2. **Build the plugin as a standalone AAR**: Create a proper Android library build
3. **Manual integration**: Copy the required classes directly into the generated Android project (temporary solution)
4. **Community consultation**: Check with the Tauri community for best practices

## Temporary Workaround

As a temporary solution, you could manually copy the GoogleSignInHelper.java and GoogleSigninPlugin.kt files into the generated Android project after each build, but this is not a sustainable long-term solution.

## Files and Dependencies

The plugin requires:
- Google Play Services Auth: `com.google.android.gms:play-services-auth:20.6.0`
- Proper Android permissions for internet access
- Correct OAuth2 client configuration

### 3. Ensure the Client ID is Correct

The client ID in the GoogleSigninPlugin.kt file should match your Google Cloud Console project's client ID:

```kotlin
GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
        .requestIdToken("YOUR_CLIENT_ID_HERE")
        .requestEmail()
        .requestProfile()
        .build();
```

### 4. Add the plugin to your project

Make sure your client/src-tauri/Cargo.toml includes:

```toml
[dependencies]
tauri-plugin-google-signin = { path = "../../plugins/tauri-plugin-google-signin" }
```

### 5. Initialize the plugin in your Tauri application:

In your Tauri application's lib.rs:

```rust
.plugin(tauri_plugin_google_signin::init())
```

### 6. Use the plugin in your JavaScript:

```javascript
import { invoke } from '@tauri-apps/api/tauri';

async function signInWithGoogle() {
  const result = await invoke('plugin:google-signin|google_sign_in', {
    nonce: 'your-nonce-here'
  });

  console.log(result);
}
```

## Troubleshooting

- If you encounter "Context is not an Activity" errors, ensure your plugin is initialized correctly and has access to the Android activity context.
- For "Failed to find GoogleSigninPlugin class" errors, ensure the plugin is properly compiled and included in the Android build.
- For Google OAuth errors, check that your client ID is correct and the OAuth consent screen is properly configured.
