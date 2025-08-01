#!/bin/bash
# Create Apple-Compatible P12 Certificates using Apple's exact method

set -e

echo "🔧 Creating Apple-Compatible P12 Certificates"
echo "============================================="
echo ""

CERT_DIR="$HOME/dev/certificates"

if [ ! -d "$CERT_DIR" ]; then
    echo "❌ Certificate directory not found: $CERT_DIR"
    exit 1
fi

cd "$CERT_DIR"

echo "📁 Working in: $CERT_DIR"
echo ""

# Check for required files
REQUIRED_FILES=("ios_development.cer" "ios_development_private.key" "ios_distribution.cer" "ios_distribution_private.key")

echo "🔍 Checking for required files..."
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        MISSING_FILES=true
    fi
done

if [ "$MISSING_FILES" = true ]; then
    echo ""
    echo "❌ Missing required files."
    exit 1
fi

echo ""
echo "🔄 Creating P12 certificates using Apple's native method..."
echo ""

# Set the password
P12_PASSWORD="zenkeypass2025"

# Method 1: Use the most basic PKCS12 format that Apple accepts
echo "📱 Creating development certificate with minimal options..."

# Convert certificate to PEM if needed
openssl x509 -inform DER -in ios_development.cer -out ios_development.pem 2>/dev/null || cp ios_development.cer ios_development.pem

# Create P12 with the most basic options that Apple accepts
openssl pkcs12 -export \
    -inkey ios_development_private.key \
    -in ios_development.pem \
    -out ios_development_apple.p12 \
    -passout pass:"$P12_PASSWORD" \
    -legacy

echo ""
echo "🏪 Creating distribution certificate with minimal options..."

# Convert certificate to PEM if needed  
openssl x509 -inform DER -in ios_distribution.cer -out ios_distribution.pem 2>/dev/null || cp ios_distribution.cer ios_distribution.pem

# Create P12 with the most basic options that Apple accepts
openssl pkcs12 -export \
    -inkey ios_distribution_private.key \
    -in ios_distribution.pem \
    -out ios_distribution_apple.p12 \
    -passout pass:"$P12_PASSWORD" \
    -legacy

echo ""
echo "✅ Apple-compatible P12 certificates created!"
echo ""

# Backup and replace
echo "📦 Backing up and replacing certificates..."
if [ -f "ios_development.p12" ]; then
    mv ios_development.p12 ios_development_openssl.p12.bak
fi
if [ -f "ios_distribution.p12" ]; then
    mv ios_distribution.p12 ios_distribution_openssl.p12.bak
fi

mv ios_development_apple.p12 ios_development.p12
mv ios_distribution_apple.p12 ios_distribution.p12

echo ""
echo "📋 New certificates:"
ls -la *.p12

echo ""
echo "🔐 Base64 Encoding for GitHub Secrets"
echo "====================================="
echo ""
echo "Password: $P12_PASSWORD"
echo ""

echo "APPLE_DEVELOPMENT_CERTIFICATE_P12_BASE64:"
echo "---"
base64 -w 0 ios_development.p12
echo ""
echo "---"
echo ""

echo "APPLE_DISTRIBUTION_CERTIFICATE_P12_BASE64:"
echo "---"
base64 -w 0 ios_distribution.p12
echo ""
echo "---"
echo ""

echo "✅ NEW P12 Files Ready!"
echo ""
echo "🚀 Key Differences from Previous Attempt:"
echo "=========================================="
echo "- Used -legacy flag for maximum compatibility"
echo "- Removed all modern encryption options"
echo "- Uses OpenSSL's default (legacy) PKCS12 format"
echo "- This should be compatible with macOS security framework"
echo ""
echo "📋 Next Steps:"
echo "1. Update GitHub Secrets with the NEW base64 values above"
echo "2. Keep the password as: $P12_PASSWORD"
echo "3. Test the iOS build again"
