# Debugging Unsigned APK in GitHub Actions

## What to Check in GitHub Actions Logs

### 1. Setup Android Code Signing Step
Look for these messages:
```
✅ Android keystore found in secrets
✅ Android code signing configured
```

**If you see instead:**
```
⚠️  No Android keystore found in secrets - building unsigned APK
```
**Then:** The GitHub Secrets are not set up correctly.

### 2. Build Android APK Step
Look for signing-related messages:
```
> Task :app:packageRelease
> Task :app:assembleRelease
```

**Check for errors like:**
```
keystore.properties (No such file or directory)
Failed to read key from keystore
```

### 3. APK Location Check
The signed APK should be in:
```
client/src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk
```

**Unsigned APK would be in:**
```
client/src-tauri/gen/android/app/build/outputs/apk/debug/app-debug.apk
```

## How to Verify APK Signing Locally

You can check if your downloaded APK is signed:

```bash
# Install apksigner (part of Android SDK build-tools)
# Then check the APK
apksigner verify --verbose your-downloaded-app.apk

# Or use jarsigner
jarsigner -verify -verbose -certs your-downloaded-app.apk
```

## Common Issues and Solutions

### Issue 1: GitHub Secrets Not Set
**Symptoms:** Logs show "No Android keystore found in secrets"
**Solution:** Add the 4 required secrets to your GitHub repository

### Issue 2: Wrong Secret Names
**Symptoms:** Secrets exist but still show as "not found"
**Solution:** Verify exact secret names (case-sensitive):
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

### Issue 3: Corrupted Base64 Keystore
**Symptoms:** Keystore found but signing fails
**Solution:** Re-encode the keystore file

### Issue 4: Wrong Build Configuration
**Symptoms:** Debug APK built instead of release APK
**Solution:** Check Tauri build configuration

## Debug Commands to Add to Workflow

Add this step before the build to debug:

```yaml
- name: Debug Signing Setup
  working-directory: ./client
  run: |
    echo "=== Checking signing setup ==="
    if [ -f "src-tauri/keystore.properties" ]; then
      echo "✅ keystore.properties exists"
      echo "Contents (passwords hidden):"
      sed 's/Password=.*/Password=***HIDDEN***/g' src-tauri/keystore.properties
    else
      echo "❌ keystore.properties not found"
    fi
    
    if [ -f "src-tauri/keystore/be-out-release.keystore" ]; then
      echo "✅ Keystore file exists"
      ls -la src-tauri/keystore/be-out-release.keystore
    else
      echo "❌ Keystore file not found"
      ls -la src-tauri/keystore/ || echo "Keystore directory not found"
    fi
```
