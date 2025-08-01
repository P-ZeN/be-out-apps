#!/bin/bash
# Fix P12 Certificate Compatibility for Apple Code Signing

set -e

echo "🔧 Fixing P12 Certificate Compatibility for Apple Code Signing"
echo "=============================================================="
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
    echo "❌ Missing required files. Please ensure you have:"
    echo "   - ios_development.cer (from Apple Developer Portal)"
    echo "   - ios_development_private.key (generated with CSR)"
    echo "   - ios_distribution.cer (from Apple Developer Portal)"
    echo "   - ios_distribution_private.key (generated with CSR)"
    exit 1
fi

echo ""
echo "🔄 Creating Mac-compatible P12 certificates..."
echo ""

# Set the password
P12_PASSWORD="zenkeypass2025"

# Convert development certificate
echo "📱 Processing development certificate..."
openssl x509 -inform DER -in ios_development.cer -out ios_development.pem 2>/dev/null || {
    echo "   Certificate is already in PEM format, copying..."
    cp ios_development.cer ios_development.pem
}

# Create development P12 with specific compatibility flags
echo "   Creating development P12 with Apple compatibility..."
openssl pkcs12 -export \
    -inkey ios_development_private.key \
    -in ios_development.pem \
    -out ios_development_new.p12 \
    -name "iOS Development" \
    -passout pass:"$P12_PASSWORD" \
    -macalg sha256 \
    -keypbe PBE-SHA1-3DES \
    -certpbe PBE-SHA1-3DES

# Convert distribution certificate
echo ""
echo "🏪 Processing distribution certificate..."
openssl x509 -inform DER -in ios_distribution.cer -out ios_distribution.pem 2>/dev/null || {
    echo "   Certificate is already in PEM format, copying..."
    cp ios_distribution.cer ios_distribution.pem
}

# Create distribution P12 with specific compatibility flags
echo "   Creating distribution P12 with Apple compatibility..."
openssl pkcs12 -export \
    -inkey ios_distribution_private.key \
    -in ios_distribution.pem \
    -out ios_distribution_new.p12 \
    -name "iOS Distribution" \
    -passout pass:"$P12_PASSWORD" \
    -macalg sha256 \
    -keypbe PBE-SHA1-3DES \
    -certpbe PBE-SHA1-3DES

echo ""
echo "✅ Mac-compatible P12 certificates created!"
echo ""

# Backup old files
echo "📦 Backing up old P12 files..."
if [ -f "ios_development.p12" ]; then
    mv ios_development.p12 ios_development_old.p12
    echo "   Backed up ios_development.p12 → ios_development_old.p12"
fi

if [ -f "ios_distribution.p12" ]; then
    mv ios_distribution.p12 ios_distribution_old.p12
    echo "   Backed up ios_distribution.p12 → ios_distribution_old.p12"
fi

# Replace with new compatible versions
mv ios_development_new.p12 ios_development.p12
mv ios_distribution_new.p12 ios_distribution.p12

echo ""
echo "📋 Updated files:"
ls -la *.p12

echo ""
echo "🔐 Base64 Encoding for GitHub Secrets"
echo "====================================="
echo ""
echo "Password for all certificates: $P12_PASSWORD"
echo ""

echo "1. APPLE_DEVELOPMENT_CERTIFICATE_P12_BASE64:"
echo "---"
base64 -w 0 ios_development.p12
echo ""
echo "---"
echo ""

echo "2. APPLE_DISTRIBUTION_CERTIFICATE_P12_BASE64:"
echo "---"
base64 -w 0 ios_distribution.p12
echo ""
echo "---"
echo ""

echo "3. APPLE_CERTIFICATE_PASSWORD:"
echo "   $P12_PASSWORD"
echo ""

echo "✅ GitHub Secrets Ready!"
echo ""
echo "🚀 Next Steps:"
echo "=============="
echo "1. Update these GitHub Secrets:"
echo "   - APPLE_DEVELOPMENT_CERTIFICATE_P12_BASE64 (use base64 above)"
echo "   - APPLE_DISTRIBUTION_CERTIFICATE_P12_BASE64 (use base64 above)"
echo "   - APPLE_CERTIFICATE_PASSWORD = $P12_PASSWORD"
echo ""
echo "2. Keep your existing provisioning profile secrets"
echo "3. Test the iOS build"
echo ""
echo "💡 The new P12 files use Apple-compatible encryption that should work with macOS security framework."
