# Mobile App Web Installer

This workflow creates a web-based installer for your mobile apps (iOS and Android).

## 🚀 How to Run

### Automatic Trigger
- The workflow automatically runs when the "Mobile App Build and Release" workflow completes successfully on the `mobile-build` branch

### Manual Trigger
1. Go to **Actions** tab in your GitHub repository
2. Select **"Mobile App Web Installer"** from the left sidebar
3. Click **"Run workflow"** button (top right)
4. Optionally specify a specific workflow run ID to download artifacts from
5. Click **"Run workflow"**

## 📱 Accessing the Installer

After the workflow completes, your web installer will be available at:
```
https://p-zen.github.io/be-out-apps/mobile-installer/
```

## 🔧 Setup Requirements

1. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: "GitHub Actions"

2. **For iOS installation:**
   - Device UDID must be in your provisioning profile
   - Only works in Safari on iOS devices

3. **For Android installation:**
   - Enable "Unknown sources" in Android settings
   - Works with any browser

## 🐛 Troubleshooting

### Web Installer Workflow Not Triggering

1. **Check workflow name match:**
   ```bash
   # Verify your mobile build workflow name
   grep "^name:" .github/workflows/mobile-build.yml
   ```
   Should output: `name: Mobile App Build and Release`

2. **Check branch:**
   - Workflow only triggers on `mobile-build` branch
   - Make sure your mobile build completed on this branch

3. **Manual trigger:**
   - Use the manual trigger option in GitHub Actions UI
   - Specify the run ID from a successful mobile build

### No Artifacts Found

- Check if your mobile build workflow actually produced artifacts
- Artifacts expire after 90 days by default
- Use a recent successful build run ID

### iOS Installation Issues

- Verify device UDID is in provisioning profile
- Use Safari browser only (not Chrome/Firefox)
- Trust developer certificate in iOS Settings

### Android Installation Issues

- Enable "Unknown sources" for your browser
- Allow installation from unknown apps
- Some antivirus apps may block installation

## 📋 Build Information

The web installer shows:
- Build number and commit SHA
- Branch name and build date
- Available app files (IPA/APK)
- Platform-specific installation instructions
