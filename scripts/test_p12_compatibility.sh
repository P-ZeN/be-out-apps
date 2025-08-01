#!/bin/bash
# Test P12 Certificate Compatibility with GitHub Actions Simulation

set -e

echo "🧪 Testing P12 Certificate Compatibility"
echo "========================================"
echo ""

CERT_DIR="$HOME/dev/certificates"

if [ ! -d "$CERT_DIR" ]; then
    echo "❌ Certificate directory not found: $CERT_DIR"
    exit 1
fi

cd "$CERT_DIR"

echo "📁 Working in: $CERT_DIR"
echo ""

# Check if P12 files exist
if [ ! -f "ios_development.p12" ]; then
    echo "❌ ios_development.p12 not found"
    echo "   Please run fix_p12_compatibility.sh first"
    exit 1
fi

echo "🔍 Testing P12 files exactly as GitHub Actions would..."
echo ""

# Test password
P12_PASSWORD="zenkeypass2025"

# Create test keychain (like GitHub Actions does)
KEYCHAIN_PASSWORD=$(openssl rand -base64 32)
TEST_KEYCHAIN="test-github-$(date +%s).keychain"

echo "🔑 Creating test keychain: $TEST_KEYCHAIN"
security create-keychain -p "$KEYCHAIN_PASSWORD" "$TEST_KEYCHAIN"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$TEST_KEYCHAIN"
security set-keychain-settings -t 3600 -u "$TEST_KEYCHAIN"

echo ""
echo "📱 Testing development certificate..."

# Simulate GitHub Actions Base64 encoding/decoding
echo "   1. Encoding to Base64 (simulating GitHub secret storage)..."
DEV_CERT_BASE64=$(base64 -w 0 ios_development.p12)

echo "   2. Decoding from Base64 (simulating GitHub Actions)..."
echo "$DEV_CERT_BASE64" | base64 --decode > test_development_certificate.p12

echo "   3. Testing import with password..."
if security import test_development_certificate.p12 -k "$TEST_KEYCHAIN" -P "$P12_PASSWORD" -T /usr/bin/codesign 2>/dev/null; then
    echo "   ✅ Development certificate import SUCCESSFUL"
    DEV_SUCCESS=true
else
    echo "   ❌ Development certificate import FAILED"
    DEV_SUCCESS=false
fi

echo ""
echo "🏪 Testing distribution certificate..."

# Test distribution certificate
if [ -f "ios_distribution.p12" ]; then
    echo "   1. Encoding to Base64 (simulating GitHub secret storage)..."
    DIST_CERT_BASE64=$(base64 -w 0 ios_distribution.p12)

    echo "   2. Decoding from Base64 (simulating GitHub Actions)..."
    echo "$DIST_CERT_BASE64" | base64 --decode > test_distribution_certificate.p12

    echo "   3. Testing import with password..."
    if security import test_distribution_certificate.p12 -k "$TEST_KEYCHAIN" -P "$P12_PASSWORD" -T /usr/bin/codesign 2>/dev/null; then
        echo "   ✅ Distribution certificate import SUCCESSFUL"
        DIST_SUCCESS=true
    else
        echo "   ❌ Distribution certificate import FAILED"
        DIST_SUCCESS=false
    fi
else
    echo "   ⚠️  Distribution certificate not found, skipping test"
    DIST_SUCCESS="skipped"
fi

echo ""
echo "🔍 Testing certificate verification..."
if [ "$DEV_SUCCESS" = true ] || [ "$DIST_SUCCESS" = true ]; then
    echo "Checking imported certificates..."
    security find-identity -v -p codesigning "$TEST_KEYCHAIN" | head -5
fi

echo ""
echo "🧹 Cleaning up test files..."
rm -f test_development_certificate.p12 test_distribution_certificate.p12
security delete-keychain "$TEST_KEYCHAIN" 2>/dev/null || echo "Test keychain already deleted"

echo ""
echo "📊 Test Results Summary:"
echo "======================="
if [ "$DEV_SUCCESS" = true ]; then
    echo "✅ Development certificate: COMPATIBLE"
else
    echo "❌ Development certificate: INCOMPATIBLE"
fi

if [ "$DIST_SUCCESS" = true ]; then
    echo "✅ Distribution certificate: COMPATIBLE"
elif [ "$DIST_SUCCESS" = "skipped" ]; then
    echo "⚠️  Distribution certificate: SKIPPED"
else
    echo "❌ Distribution certificate: INCOMPATIBLE"
fi

echo ""
if [ "$DEV_SUCCESS" = true ] && ([ "$DIST_SUCCESS" = true ] || [ "$DIST_SUCCESS" = "skipped" ]); then
    echo "🎉 SUCCESS: Certificates should work in GitHub Actions!"
    echo ""
    echo "📋 GitHub Secrets to update:"
    echo "============================"
    echo ""
    echo "Secret: APPLE_CERTIFICATE_PASSWORD"
    echo "Value: $P12_PASSWORD"
    echo ""
    echo "Secret: APPLE_DEVELOPMENT_CERTIFICATE_P12_BASE64"
    echo "Value: $DEV_CERT_BASE64"
    echo ""
    if [ "$DIST_SUCCESS" = true ]; then
        echo "Secret: APPLE_DISTRIBUTION_CERTIFICATE_P12_BASE64"
        echo "Value: $DIST_CERT_BASE64"
    fi
    echo ""
    echo "🚀 Ready to test in GitHub Actions!"
else
    echo "❌ FAILURE: Certificates still have compatibility issues"
    echo ""
    echo "🔧 Troubleshooting suggestions:"
    echo "1. Double-check that certificates were downloaded correctly from Apple"
    echo "2. Verify private keys match the certificates"
    echo "3. Try regenerating certificates from Apple Developer Portal"
    echo "4. Check if certificates have expired"
fi
