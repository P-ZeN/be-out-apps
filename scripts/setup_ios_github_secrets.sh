#!/bin/bash
# iOS Certificate Setup for GitHub Secrets

echo "🔐 iOS Certificate Setup for GitHub Secrets"
echo "============================================"
echo ""

CERT_DIR="$HOME/dev/certificates"

if [ ! -d "$CERT_DIR" ]; then
    echo "❌ Certificate directory not found: $CERT_DIR"
    echo "Please ensure your certificates are in the correct directory."
    exit 1
fi

cd "$CERT_DIR"

echo "📁 Working with certificates in: $CERT_DIR"
echo ""

# Check for required files
REQUIRED_FILES=(
    "ios_development.p12"
    "ios_distribution.p12"
    "Developpement_provisionning.mobileprovision"
    "Distribution_provisionning.mobileprovision"
)

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
    echo "❌ Some required files are missing. Please ensure all files are present."
    exit 1
fi

echo ""
echo "🚀 All files found! Generating GitHub Secrets..."
echo ""

# Generate GitHub Secrets
echo "📋 GitHub Secrets to Add:"
echo "========================="
echo ""

echo "1. APPLE_DEVELOPMENT_CERTIFICATE_P12_BASE64:"
echo "   (Copy the entire base64 string below)"
echo "---"
base64 -w 0 ios_development.p12
echo ""
echo "---"
echo ""

echo "2. APPLE_DISTRIBUTION_CERTIFICATE_P12_BASE64:"
echo "   (Copy the entire base64 string below)"
echo "---" 
base64 -w 0 ios_distribution.p12
echo ""
echo "---"
echo ""

echo "3. APPLE_DEVELOPMENT_PROVISIONING_PROFILE_BASE64:"
echo "   (Copy the entire base64 string below)"
echo "---"
base64 -w 0 Developpement_provisionning.mobileprovision
echo ""
echo "---"
echo ""

echo "4. APPLE_DISTRIBUTION_PROVISIONING_PROFILE_BASE64:"
echo "   (Copy the entire base64 string below)"
echo "---"
base64 -w 0 Distribution_provisionning.mobileprovision
echo ""
echo "---"
echo ""

echo "5. APPLE_DEVELOPMENT_TEAM:"
echo "   Your Apple Developer Team ID (10-character string)"
echo "   Find this in Apple Developer Portal → Account → Membership"
echo ""

echo "6. APPLE_CERTIFICATE_PASSWORD:"
echo "   The password you used when creating the .p12 files"
echo ""

echo "✅ Setup Complete!"
echo ""
echo "🔗 Next Steps:"
echo "1. Go to your GitHub repository → Settings → Secrets and variables → Actions"
echo "2. Add each secret using the names and values above"
echo "3. Test your iOS build by pushing to the mobile-build branch"
echo ""
echo "📖 For detailed instructions, see:"
echo "   - docs/IOS_GITHUB_SECRETS_REFERENCE.md"
echo "   - docs/IOS_CODE_SIGNING_SETUP.md"
