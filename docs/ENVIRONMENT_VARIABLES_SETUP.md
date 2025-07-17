# Environment Variables Setup Guide

This guide explains how to set up the required environment variables for the BeOut application.

## Required Environment Files

### 1. Root Level `.env` (for server)
Create a `.env` file in the root directory (`y:\be-out\be-out-app\.env`):

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/beout_db

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Configuration (SendGrid)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
DEFAULT_FROM_EMAIL=noreply@beout.app

# File Upload Configuration
UPLOAD_PATH=./uploads
PUBLIC_FILES_URL=http://localhost:3000/uploads

# Client URL
CLIENT_URL=http://localhost:5173

# Translations Path
TRANSLATIONS_PATH=./translations

# Environment
NODE_ENV=development
```

### 2. Client `.env` (for frontend)
Create a `.env` file in the client directory (`y:\be-out\be-out-app\client\.env`):

```bash
# API Configuration
VITE_API_URL=http://localhost:3000

# Mapbox Configuration
VITE_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_public_token_here
```

## Setting Up Environment Variables

### Option 1: Local Development Files
1. Copy the example files above
2. Replace placeholder values with your actual credentials
3. Never commit these files to git (they're already in .gitignore)

### Option 2: GitHub Actions Secrets (for CI/CD)
Add the following secrets in your GitHub repository:
- Go to Settings → Secrets and variables → Actions
- Add New repository secret for each variable

### Option 3: System Environment Variables (Alternative)
For local development, you can also set system environment variables instead of using .env files.

#### Windows PowerShell:
```powershell
$env:JWT_SECRET = "your-jwt-secret"
$env:VITE_API_URL = "http://localhost:3000"
$env:VITE_MAPBOX_ACCESS_TOKEN = "your-mapbox-token"
```

#### Windows Command Prompt:
```cmd
set JWT_SECRET=your-jwt-secret
set VITE_API_URL=http://localhost:3000
set VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

## Where to Get API Keys

### 1. Mapbox Token
- Go to [mapbox.com](https://mapbox.com)
- Create an account and get a public access token
- Use this for `VITE_MAPBOX_ACCESS_TOKEN`

### 2. Stripe Keys
- Go to [stripe.com](https://stripe.com)
- Create an account
- Get your test keys from the dashboard
- Use secret key for `STRIPE_SECRET_KEY`
- Set up webhooks and get `STRIPE_WEBHOOK_SECRET`

### 3. SendGrid API Key
- Go to [sendgrid.com](https://sendgrid.com)
- Create an account
- Generate an API key for `SENDGRID_API_KEY`

### 4. JWT Secret
- Generate a secure random string (32+ characters)
- You can use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Tauri Mobile App Considerations

For mobile builds, environment variables are bundled at build time. Make sure to:

1. Set environment variables before building
2. For CI/CD, use GitHub Actions secrets
3. For local mobile testing, ensure .env files exist before running mobile builds

## Quick Setup Commands

Run these commands to create template files:

```powershell
# Create server .env template
@"
JWT_SECRET=change-me-to-secure-random-string
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
SENDGRID_API_KEY=SG.your_sendgrid_key
DEFAULT_FROM_EMAIL=noreply@beout.app
UPLOAD_PATH=./uploads
PUBLIC_FILES_URL=http://localhost:3000/uploads
CLIENT_URL=http://localhost:5173
NODE_ENV=development
"@ | Out-File -FilePath ".env" -Encoding UTF8

# Create client .env template
@"
VITE_API_URL=http://localhost:3000
VITE_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token
"@ | Out-File -FilePath "client\.env" -Encoding UTF8
```

## Verification

To verify your environment variables are loaded correctly:

### Server verification:
```javascript
console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
console.log('STRIPE_SECRET_KEY loaded:', !!process.env.STRIPE_SECRET_KEY);
```

### Client verification:
```javascript
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Mapbox token loaded:', !!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN);
```
