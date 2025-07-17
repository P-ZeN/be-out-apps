# GitHub Actions Environment Variables Setup

This guide explains how to configure environment variables for the automated Tauri mobile builds via GitHub Actions.

## 🔐 GitHub Repository Secrets

Since `.env` files are gitignored (for security), you need to set up **GitHub Secrets** for CI/CD builds.

### Step-by-Step Setup

1. **Navigate to Repository Settings**
   - Go to: `https://github.com/P-ZeN/be-out-apps`
   - Click **Settings** (top menu bar)
   - In left sidebar: **Secrets and variables** → **Actions**

2. **Add Required Secrets**
   Click **New repository secret** for each of these:

#### ✅ **Required for Mobile Builds**
```
Name: VITE_API_URL
Value: https://your-production-api-url.com
(or http://localhost:3000 for testing)

Name: VITE_MAPBOX_ACCESS_TOKEN  
Value: pk.your_actual_mapbox_token_here
```

#### 🔧 **Optional (if needed for build process)**
```
Name: JWT_SECRET
Value: your-secure-jwt-secret

Name: STRIPE_SECRET_KEY
Value: sk_live_your_stripe_key (or sk_test_)

Name: CLIENT_URL
Value: https://your-app-domain.com
```

### Security Benefits

✅ **Secure**: Secrets are encrypted and not visible in logs  
✅ **Access Control**: Only maintainers can view/edit secrets  
✅ **Audit Trail**: GitHub logs when secrets are accessed  
✅ **No Exposure**: Values never appear in repository code  

## 🚀 How It Works in CI/CD

The GitHub workflow (`.github/workflows/mobile-build.yml`) automatically:

1. **Pulls secrets** from repository settings
2. **Sets environment variables** during build steps
3. **Builds client** with proper API URLs and tokens
4. **Compiles Tauri app** with bundled environment variables
5. **Generates APK** ready for distribution

## 🔍 Verification

After setting up secrets, the next commit/push will:
- Use the configured environment variables
- Build successfully without "undefined" values
- Generate a working mobile APK

## 📱 Production vs Development

- **GitHub Actions**: Uses repository secrets (production values)
- **Local Development**: Uses your local `.env` files
- **Separation**: Keeps production secrets secure while allowing local development

## 🛠️ Troubleshooting

If builds fail with environment variable issues:

1. **Check secret names** match exactly (case-sensitive)
2. **Verify values** don't have extra spaces or quotes
3. **Review workflow logs** for missing variable warnings
4. **Test locally** with same values to verify they work

## 🔄 Updating Secrets

To update an existing secret:
1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click on the secret name
3. Click **Update** 
4. Enter new value and save

Changes take effect immediately for new workflow runs.
