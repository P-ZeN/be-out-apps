#!/bin/bash
# Test Certificate Password Script

echo "🔐 Certificate Password Tester"
echo "=============================="
echo ""

CERT_DIR="$HOME/dev/certificates"

# Check if certificates exist
if [ ! -f "$CERT_DIR/ios_development.p12" ]; then
    echo "❌ Certificate not found: $CERT_DIR/ios_development.p12"
    echo "   Please ensure your certificates are in the correct directory."
    exit 1
fi

cd "$CERT_DIR"

echo "This script will help you verify the correct password for your P12 certificates."
echo ""

# Test different common scenarios
echo "Testing common password scenarios:"
echo ""

echo "1️⃣  Testing with EMPTY password..."
# Create a temporary keychain for testing
TEMP_KEYCHAIN="test-cert-$(date +%s).keychain"
security create-keychain -p "temp123" "$TEMP_KEYCHAIN" 2>/dev/null

if security import ios_development.p12 -k "$TEMP_KEYCHAIN" -P "" -T /usr/bin/codesign 2>/dev/null; then
    echo "✅ SUCCESS: Your certificates were created with NO PASSWORD (empty string)"
    echo ""
    echo "🔧 GitHub Secret Fix:"
    echo "   Set APPLE_CERTIFICATE_PASSWORD to an empty string or delete the secret"
    security delete-keychain "$TEMP_KEYCHAIN" 2>/dev/null
    exit 0
fi

echo "❌ Empty password failed"
echo ""

echo "2️⃣  Testing with common passwords..."
COMMON_PASSWORDS=("password" "123456" "admin" "test" "cert" "apple" "ios")

for pwd in "${COMMON_PASSWORDS[@]}"; do
    echo "   Testing: '$pwd'"
    if security import ios_development.p12 -k "$TEMP_KEYCHAIN" -P "$pwd" -T /usr/bin/codesign 2>/dev/null; then
        echo "✅ SUCCESS: Password is '$pwd'"
        echo ""
        echo "🔧 GitHub Secret Fix:"
        echo "   Set APPLE_CERTIFICATE_PASSWORD to: $pwd"
        security delete-keychain "$TEMP_KEYCHAIN" 2>/dev/null
        exit 0
    fi
done

echo "❌ Common passwords failed"
echo ""

echo "3️⃣  Manual password test:"
echo "Please enter the password you think you used (or press Enter for empty):"
read -s USER_PASSWORD

if [ -z "$USER_PASSWORD" ]; then
    USER_PASSWORD=""
    echo "Testing with empty password..."
else
    echo "Testing with your password..."
fi

if security import ios_development.p12 -k "$TEMP_KEYCHAIN" -P "$USER_PASSWORD" -T /usr/bin/codesign 2>/dev/null; then
    echo "✅ SUCCESS: Your password works!"
    echo ""
    echo "🔧 GitHub Secret Fix:"
    if [ -z "$USER_PASSWORD" ]; then
        echo "   Set APPLE_CERTIFICATE_PASSWORD to an empty string"
        echo "   Or delete the APPLE_CERTIFICATE_PASSWORD secret entirely"
    else
        echo "   Set APPLE_CERTIFICATE_PASSWORD to: $USER_PASSWORD"
        echo ""
        echo "   ⚠️  Special characters warning:"
        echo "   If your password contains special characters like $, \", ', etc."
        echo "   they might need to be handled carefully in GitHub secrets."
    fi
else
    echo "❌ Your password didn't work either"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Check if you remember the exact password you used"
    echo "2. Try recreating the P12 certificates with a known password"
    echo "3. Use the generate_ios_certificates.sh script to create new ones"
fi

# Cleanup
security delete-keychain "$TEMP_KEYCHAIN" 2>/dev/null
echo ""
echo "🧹 Cleanup completed"
