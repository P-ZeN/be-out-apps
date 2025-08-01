#!/bin/bash
# Regenerate P12 Certificates with Known Password

echo "🔄 Regenerating P12 Certificates with Known Password"
echo "==================================================="
echo ""

CERT_DIR="$HOME/dev/certificates"
NEW_PASSWORD="zenkeypass2025"

if [ ! -d "$CERT_DIR" ]; then
    echo "❌ Certificate directory not found: $CERT_DIR"
    exit 1
fi

cd "$CERT_DIR"

echo "📁 Working in: $CERT_DIR"
echo "🔐 Using password: $NEW_PASSWORD"
echo ""

# Backup existing P12 files
echo "📦 Creating backup of existing P12 files..."
if [ -f "ios_development.p12" ]; then
    mv "ios_development.p12" "ios_development.p12.backup"
    echo "✅ Backed up ios_development.p12"
fi

if [ -f "ios_distribution.p12" ]; then
    mv "ios_distribution.p12" "ios_distribution.p12.backup"
    echo "✅ Backed up ios_distribution.p12"
fi

echo ""

# Check if we have certificate files that we can work with
echo "🔍 Looking for certificate files to regenerate P12..."

# Method 1: Try to extract from existing keychain
echo ""
echo "Method 1: Extracting from system keychain..."

# Find development certificate
DEV_CERT_NAME="Apple Development"
DIST_CERT_NAME="Apple Distribution"

# List available certificates
echo "Available certificates in keychain:"
security find-identity -v -p codesigning | grep -E "(Apple Development|Apple Distribution)" || echo "No Apple certificates found in keychain"

echo ""
echo "Attempting to export certificates from keychain..."

# Try to export development certificate
if security find-identity -v -p codesigning | grep -q "Apple Development"; then
    echo "📱 Found Apple Development certificate, attempting export..."

    # Get the certificate hash
    DEV_HASH=$(security find-identity -v -p codesigning | grep "Apple Development" | head -1 | awk '{print $2}')

    if [ -n "$DEV_HASH" ]; then
        echo "Certificate hash: $DEV_HASH"

        # Export the certificate with private key
        if security export -k login.keychain -t identities -f pkcs12 -P "$NEW_PASSWORD" -o "ios_development_new.p12" "$DEV_HASH" 2>/dev/null; then
            mv "ios_development_new.p12" "ios_development.p12"
            echo "✅ Successfully exported development certificate"
            DEV_SUCCESS=true
        else
            echo "❌ Failed to export development certificate (may require authentication)"
            DEV_SUCCESS=false
        fi
    else
        echo "❌ Could not get certificate hash"
        DEV_SUCCESS=false
    fi
else
    echo "❌ No Apple Development certificate found in keychain"
    DEV_SUCCESS=false
fi

# Try to export distribution certificate
if security find-identity -v -p codesigning | grep -q "Apple Distribution"; then
    echo "🏪 Found Apple Distribution certificate, attempting export..."

    # Get the certificate hash
    DIST_HASH=$(security find-identity -v -p codesigning | grep "Apple Distribution" | head -1 | awk '{print $2}')

    if [ -n "$DIST_HASH" ]; then
        echo "Certificate hash: $DIST_HASH"

        # Export the certificate with private key
        if security export -k login.keychain -t identities -f pkcs12 -P "$NEW_PASSWORD" -o "ios_distribution_new.p12" "$DIST_HASH" 2>/dev/null; then
            mv "ios_distribution_new.p12" "ios_distribution.p12"
            echo "✅ Successfully exported distribution certificate"
            DIST_SUCCESS=true
        else
            echo "❌ Failed to export distribution certificate (may require authentication)"
            DIST_SUCCESS=false
        fi
    else
        echo "❌ Could not get certificate hash"
        DIST_SUCCESS=false
    fi
else
    echo "❌ No Apple Distribution certificate found in keychain"
    DIST_SUCCESS=false
fi

# Method 2: If keychain export failed, try to recreate from existing files
if [ "$DEV_SUCCESS" != true ] || [ "$DIST_SUCCESS" != true ]; then
    echo ""
    echo "Method 2: Attempting to recreate from existing certificate files..."

    # Look for .cer and .p12 files
    echo "Available files:"
    ls -la *.cer *.p12 *.key 2>/dev/null || echo "No certificate files found"

    # Try to find certificate files
    if [ -f "ios_development.cer" ] || [ -f "development.cer" ]; then
        echo "Found development certificate file, but need private key to create P12"
        echo "This requires the original private key that was used to create the certificate"
    fi

    if [ -f "ios_distribution.cer" ] || [ -f "distribution.cer" ]; then
        echo "Found distribution certificate file, but need private key to create P12"
        echo "This requires the original private key that was used to create the certificate"
    fi
fi

echo ""
echo "🧪 Testing new P12 files..."

# Test the new P12 files
TEMP_KEYCHAIN="test-new-p12-$(date +%s).keychain"
security create-keychain -p "temp123" "$TEMP_KEYCHAIN" 2>/dev/null

if [ -f "ios_development.p12" ]; then
    if security import ios_development.p12 -k "$TEMP_KEYCHAIN" -P "$NEW_PASSWORD" -T /usr/bin/codesign 2>/dev/null; then
        echo "✅ Development P12 password test: SUCCESS"
        DEV_P12_OK=true
    else
        echo "❌ Development P12 password test: FAILED"
        DEV_P12_OK=false
    fi
fi

if [ -f "ios_distribution.p12" ]; then
    if security import ios_distribution.p12 -k "$TEMP_KEYCHAIN" -P "$NEW_PASSWORD" -T /usr/bin/codesign 2>/dev/null; then
        echo "✅ Distribution P12 password test: SUCCESS"
        DIST_P12_OK=true
    else
        echo "❌ Distribution P12 password test: FAILED"
        DIST_P12_OK=false
    fi
fi

# Cleanup test keychain
security delete-keychain "$TEMP_KEYCHAIN" 2>/dev/null

echo ""
echo "📊 Results Summary:"
echo "==================="

if [ "$DEV_P12_OK" = true ]; then
    echo "✅ ios_development.p12 - Ready with password: $NEW_PASSWORD"
else
    echo "❌ ios_development.p12 - Failed to create or test"
fi

if [ "$DIST_P12_OK" = true ]; then
    echo "✅ ios_distribution.p12 - Ready with password: $NEW_PASSWORD"
else
    echo "❌ ios_distribution.p12 - Failed to create or test"
fi

echo ""

if [ "$DEV_P12_OK" = true ] || [ "$DIST_P12_OK" = true ]; then
    echo "🎉 SUCCESS! At least one P12 file was created successfully."
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Update your GitHub secret APPLE_CERTIFICATE_PASSWORD to: $NEW_PASSWORD"
    echo "2. If needed, regenerate and upload the new Base64 certificates:"
    echo "   Run: ./setup_ios_github_secrets.sh"
    echo "3. Test your iOS build in GitHub Actions"
    echo ""
    echo "🔑 GitHub Secret Update:"
    echo "   Secret Name: APPLE_CERTIFICATE_PASSWORD"
    echo "   Secret Value: $NEW_PASSWORD"
else
    echo "❌ FAILED: Could not create any working P12 files."
    echo ""
    echo "🔧 Alternative Solutions:"
    echo "1. Generate completely new certificates using: ./generate_ios_certificates.sh"
    echo "2. Download certificates from Apple Developer Portal and import them"
    echo "3. Check if certificates are properly installed in your keychain"
    echo ""
    echo "💡 Troubleshooting:"
    echo "- Make sure you have access to the private keys for your certificates"
    echo "- Check if certificates are installed in your macOS keychain"
    echo "- Verify you have proper access to export certificates"
fi

echo ""
echo "📋 Current certificate files:"
ls -la *.p12 *.mobileprovision 2>/dev/null || echo "No certificate files found"
