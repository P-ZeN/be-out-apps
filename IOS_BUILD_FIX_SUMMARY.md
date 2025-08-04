# iOS Build Fix for tauri-plugin-google-auth

## Problem
The iOS build was failing with the error:
```
tauri-plugin: package.links field in the Cargo manifest is not set, it should be set to the same as package.name
```

## Root Cause Analysis
After researching the official Tauri plugins repository, I discovered that:

1. **No official Tauri plugins use a `links` field** in their Cargo.toml
2. **Mobile-compatible plugins use `try_build()`** instead of `build()` in their build scripts
3. **The `links` field is for native system libraries**, not for Tauri plugins
4. **Mobile plugins need special error handling** for documentation builds

## Solution Applied

### 1. Removed `links` field from Cargo.toml
The `links` field was incorrect for a Tauri plugin and was causing the build system to look for a native library that doesn't exist.

### 2. Updated build.rs to use mobile-compatible pattern
Changed from:
```rust
tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .ios_path("ios")
    .build();
```

To:
```rust
let result = tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .ios_path("ios")
    .try_build();

// Handle documentation builds gracefully
if !(cfg!(docsrs) && (std::env::var("TARGET").unwrap_or_default().contains("android") || std::env::var("TARGET").unwrap_or_default().contains("ios"))) {
    result.unwrap();
}
```

### 3. Pattern Source
This pattern is taken directly from official Tauri plugins like:
- `tauri-plugin-dialog`
- `tauri-plugin-clipboard-manager`
- Other mobile-compatible plugins

## Expected Result
The iOS build should now succeed without the "package.links field" error. The plugin will build correctly for both iOS and Android platforms while maintaining compatibility with documentation builds.

## Next Steps
1. Test the iOS build in CI to confirm the fix
2. If successful, the plugin will have proper iOS support
3. The Android implementation remains unchanged and functional

## Technical Notes
- The local Linux development environment cannot test this due to GTK dependencies
- This fix is specific to the Tauri plugin system requirements
- The error was misleading - it suggested adding `links` when the solution was to remove it
- Official Tauri plugins serve as the authoritative reference for correct patterns
