# GitHub Actions Workflow Setup

This repository uses a two-tier GitHub Actions approach to optimize CI/CD resources and build times.

## Workflows

### 1. Client Test and Build (`client-build.yml`)
**Triggers:**
- Push to `staging` branch
- Pull requests to `staging` branch
- Only when client-related files change

**What it does:**
- ✅ Fast web-only client testing and building
- ⚡ Lightweight - completes in ~2-3 minutes
- 🌐 Builds client for web deployment
- 📦 Uploads web build artifacts

**Use for:** Regular development, quick feedback on client changes

### 2. Mobile App Build and Release (`mobile-build.yml`)
**Triggers:**
- Push to `mobile-build` branch
- Version tags (`v*`)
- Manual trigger via GitHub UI
- Only when mobile-related files change

**What it does:**
- 🤖 Full Android APK build with signing
- 📱 iOS IPA build (with Xcode compatibility checks)
- 🏗️ Heavy build process - takes ~15-20 minutes
- 📦 Creates GitHub releases for tagged versions

**Use for:** Mobile app releases, testing mobile builds

## Usage Guide

### For Regular Development
```bash
# Work normally on main/develop - triggers lightweight client builds
git checkout main
git add .
git commit -m "Update client features"
git push origin main
# → Triggers client-build.yml (fast)
```

### For Mobile App Testing/Release
```bash
# Create and push to mobile-build branch for full mobile builds
git checkout -b mobile-build
# Make your changes...
git add .
git commit -m "Prepare mobile build"
git push origin mobile-build
# → Triggers mobile-build.yml (heavy)
```

### For Manual Mobile Builds
1. Go to your repository on GitHub
2. Click "Actions" tab
3. Select "Mobile App Build and Release"
4. Click "Run workflow"
5. Choose branch and click "Run workflow"

### For Production Releases
```bash
# Tag a version to trigger mobile builds and GitHub releases
git tag v1.0.0
git push origin v1.0.0
# → Triggers mobile-build.yml + creates GitHub release
```

## Path Filters

Both workflows only run when relevant files change:

**Client paths:**
- `client/**` - Any client source code
- `package.json` - Root dependencies
- `package-lock.json` - Lock file changes
- `.github/workflows/*.yml` - Workflow changes

This means changes to `server/`, `docs/`, `admin-client/`, etc. won't trigger unnecessary builds.

## Benefits

1. **💰 Resource Efficient**: Heavy mobile builds only run when needed
2. **⚡ Fast Feedback**: Regular development gets quick feedback
3. **🎯 Targeted**: Builds only run when relevant files change
4. **🔄 Flexible**: Manual triggering available for mobile builds
5. **📋 Clear Separation**: Web vs mobile development workflows

## Android Code Signing

Mobile builds require these GitHub Secrets for signed APKs:
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

See `docs/ANDROID_CODE_SIGNING_SETUP.md` for detailed setup instructions.

## iOS Code Signing

iOS builds will fail at signing without Apple Developer certificates (expected in CI). The build validates project generation and compilation.

For production iOS builds, add:
- `APPLE_DEVELOPMENT_TEAM` secret with your Apple Developer Team ID

## Troubleshooting

- **No builds triggered?** Check that your changes affect the path filters
- **Mobile build not running?** Ensure you're pushing to `mobile-build` branch
- **Unsigned APK?** Check Android code signing secrets are properly set
- **iOS format errors?** Verify Xcode version compatibility in logs
