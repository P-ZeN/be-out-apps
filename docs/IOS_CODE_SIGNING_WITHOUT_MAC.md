# iOS Code Signing Without Mac - Complete Guide

This guide shows how to set up iOS code signing entirely without a Mac, using OpenSSL and CI/CD processes.

## Method 1: Generate CSR with OpenSSL (Linux/Windows)

### Step 1: Install OpenSSL

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install openssl
```

**On Windows:**
- Download from https://slproweb.com/products/Win32OpenSSL.html
- Or use WSL with Ubuntu

**On macOS (if available later):**
```bash
# OpenSSL is usually pre-installed
openssl version
```

### Step 2: Generate Private Key and CSR

```bash
# Create a directory for your certificates
mkdir -p ~/ios-certificates
cd ~/ios-certificates

# Generate private key for development certificate
openssl genrsa -out ios_development_private.key 2048

# Generate Certificate Signing Request (CSR) for development
openssl req -new -key ios_development_private.key -out ios_development.csr -subj "/C=US/ST=YourState/L=YourCity/O=YourOrganization/OU=YourUnit/CN=iOS Development: YourName/emailAddress=your.email@example.com"

# Generate private key for distribution certificate
openssl genrsa -out ios_distribution_private.key 2048

# Generate CSR for distribution
openssl req -new -key ios_distribution_private.key -out ios_distribution.csr -subj "/C=US/ST=YourState/L=YourCity/O=YourOrganization/OU=YourUnit/CN=iOS Distribution: YourName/emailAddress=your.email@example.com"
```

**Important**: Replace the subject fields with your actual information:
- `C=US` → Your country code
- `ST=YourState` → Your state/province
- `L=YourCity` → Your city
- `O=YourOrganization` → Your organization name
- `CN=iOS Development: YourName` → Your name (keep the "iOS Development:" prefix)
- `emailAddress=your.email@example.com` → Your email

### Step 3: Upload CSR to Apple Developer Portal

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Certificates** → **+** (Add new)
4. Select **iOS App Development**
5. Upload your `ios_development.csr` file
6. Download the certificate (`.cer` file)
7. Repeat for **iOS Distribution** certificate with `ios_distribution.csr`

### Step 4: Convert Certificates to P12 Format

```bash
# Convert development certificate to P12
# First, convert the .cer to .pem
openssl x509 -inform DER -in ios_development.cer -out ios_development.pem

# Then combine with private key to create P12
openssl pkcs12 -export -inkey ios_development_private.key -in ios_development.pem -out ios_development.p12 -name "iOS Development"

# Convert distribution certificate to P12
openssl x509 -inform DER -in ios_distribution.cer -out ios_distribution.pem
openssl pkcs12 -export -inkey ios_distribution_private.key -in ios_distribution.pem -out ios_distribution.p12 -name "iOS Distribution"
```

When prompted, set a password for the P12 files (remember this for GitHub Secrets).

### Step 5: Create Provisioning Profiles

1. In Apple Developer Portal, go to **Profiles** → **+**
2. Select **iOS App Development**
3. Choose your App ID: `com.beout.app`
4. Select your **Development Certificate**
5. Select your test devices (you can add device UDIDs later)
6. Download the `.mobileprovision` file
7. Repeat for **App Store** distribution profile

## Method 2: Use GitHub Actions to Generate Certificates

Alternatively, you can generate everything in CI using a special workflow:

```yaml
name: Generate iOS Certificates

on:
  workflow_dispatch:  # Manual trigger only

jobs:
  generate-certificates:
    runs-on: ubuntu-latest
    steps:
    - name: Generate iOS Certificates
      run: |
        # Generate development certificate
        openssl genrsa -out ios_development_private.key 2048
        openssl req -new -key ios_development_private.key -out ios_development.csr \
          -subj "/C=US/ST=California/L=San Francisco/O=Be Out/OU=Development/CN=iOS Development: Be Out/emailAddress=your-email@example.com"
        
        # Generate distribution certificate
        openssl genrsa -out ios_distribution_private.key 2048
        openssl req -new -key ios_distribution_private.key -out ios_distribution.csr \
          -subj "/C=US/ST=California/L=San Francisco/O=Be Out/OU=Development/CN=iOS Distribution: Be Out/emailAddress=your-email@example.com"
        
        echo "CSR files generated. Download them from the artifacts and upload to Apple Developer Portal."
        
    - name: Upload CSR files
      uses: actions/upload-artifact@v4
      with:
        name: ios-csr-files
        path: |
          ios_development.csr
          ios_distribution.csr
          ios_development_private.key
          ios_distribution_private.key
```

## Method 3: Alternative - Use Existing CI Infrastructure

Since you already have a sophisticated CI setup, you can also:

1. **Generate everything in CI** and store securely
2. **Use Apple's Developer API** to automate certificate creation
3. **Use Fastlane Match** for certificate management

## Recommended Approach for Your Setup

Given your current CI infrastructure, I recommend **Method 1** (OpenSSL on your local Linux machine):

### Quick Setup Script

```bash
#!/bin/bash
# save as generate_ios_certs.sh

set -e

echo "🔐 Generating iOS certificates for Be Out app..."

# Create directory
mkdir -p ~/ios-certificates
cd ~/ios-certificates

# Get user info
read -p "Enter your full name: " FULL_NAME
read -p "Enter your email: " EMAIL
read -p "Enter your organization: " ORG
read -p "Enter your country code (e.g., US): " COUNTRY

# Generate development certificate
echo "📱 Generating development certificate..."
openssl genrsa -out ios_development_private.key 2048
openssl req -new -key ios_development_private.key -out ios_development.csr \
  -subj "/C=$COUNTRY/O=$ORG/CN=iOS Development: $FULL_NAME/emailAddress=$EMAIL"

# Generate distribution certificate
echo "🏪 Generating distribution certificate..."
openssl genrsa -out ios_distribution_private.key 2048
openssl req -new -key ios_distribution_private.key -out ios_distribution.csr \
  -subj "/C=$COUNTRY/O=$ORG/CN=iOS Distribution: $FULL_NAME/emailAddress=$EMAIL"

echo "✅ CSR files generated successfully!"
echo ""
echo "Next steps:"
echo "1. Upload ios_development.csr to Apple Developer Portal (iOS App Development)"
echo "2. Upload ios_distribution.csr to Apple Developer Portal (iOS Distribution)"
echo "3. Download the .cer files from Apple"
echo "4. Run the conversion script to create P12 files"

ls -la *.csr *.key
```

### Conversion Script (after downloading .cer files from Apple)

```bash
#!/bin/bash
# save as convert_to_p12.sh

set -e

echo "🔄 Converting certificates to P12 format..."

# Check if .cer files exist
if [ ! -f "ios_development.cer" ] || [ ! -f "ios_distribution.cer" ]; then
  echo "❌ Please download ios_development.cer and ios_distribution.cer from Apple Developer Portal first"
  exit 1
fi

# Convert development certificate
echo "📱 Converting development certificate..."
openssl x509 -inform DER -in ios_development.cer -out ios_development.pem
openssl pkcs12 -export -inkey ios_development_private.key -in ios_development.pem -out ios_development.p12 -name "iOS Development"

# Convert distribution certificate
echo "🏪 Converting distribution certificate..."
openssl x509 -inform DER -in ios_distribution.cer -out ios_distribution.pem
openssl pkcs12 -export -inkey ios_distribution_private.key -in ios_distribution.pem -out ios_distribution.p12 -name "iOS Distribution"

echo "✅ P12 certificates generated successfully!"
echo ""
echo "Final steps:"
echo "1. Convert to Base64: base64 -w 0 ios_development.p12"
echo "2. Convert to Base64: base64 -w 0 ios_distribution.p12"
echo "3. Add these to GitHub Secrets"

ls -la *.p12
```

## Complete Workflow Without Mac

1. **Run the generation script** on your Linux machine
2. **Upload CSR files** to Apple Developer Portal
3. **Download .cer files** from Apple
4. **Run conversion script** to create P12 files
5. **Create provisioning profiles** in Apple Developer Portal
6. **Convert everything to Base64** and add to GitHub Secrets

This approach completely bypasses the need for a Mac and integrates perfectly with your existing CI/CD pipeline!

Would you like me to help you set up the scripts, or do you have any questions about this Mac-free approach?
