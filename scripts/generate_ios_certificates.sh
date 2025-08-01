#!/bin/bash
# iOS Certificate Generation Script (No Mac Required)
# This script generates Certificate Signing Requests (CSR) using OpenSSL

set -e

echo "🔐 iOS Certificate Generation for Be Out App"
echo "=============================================="
echo ""
echo "This script will generate Certificate Signing Requests (CSR) that you can"
echo "upload to Apple Developer Portal to get your iOS certificates."
echo ""

# Create directory
CERT_DIR="$HOME/ios-certificates"
mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

echo "📁 Working directory: $CERT_DIR"
echo ""

# Get user information
echo "Please provide the following information for your certificates:"
echo ""
read -p "Full Name (e.g., John Doe): " FULL_NAME
read -p "Email Address: " EMAIL
read -p "Organization Name (e.g., Be Out, LLC): " ORG
read -p "Country Code (e.g., US, FR, DE): " COUNTRY
read -p "State/Province (e.g., California): " STATE
read -p "City (e.g., San Francisco): " CITY

echo ""
echo "📝 Certificate Information:"
echo "   Name: $FULL_NAME"
echo "   Email: $EMAIL"
echo "   Organization: $ORG"
echo "   Country: $COUNTRY"
echo "   State: $STATE"
echo "   City: $CITY"
echo ""

read -p "Is this information correct? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled. Please run the script again with correct information."
    exit 1
fi

echo ""
echo "🔑 Generating private keys and CSR files..."

# Generate development certificate
echo "📱 Generating iOS Development certificate request..."
openssl genrsa -out ios_development_private.key 2048
openssl req -new -key ios_development_private.key -out ios_development.csr \
  -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/CN=iOS Development: $FULL_NAME/emailAddress=$EMAIL"

# Generate distribution certificate
echo "🏪 Generating iOS Distribution certificate request..."
openssl genrsa -out ios_distribution_private.key 2048
openssl req -new -key ios_distribution_private.key -out ios_distribution.csr \
  -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/CN=iOS Distribution: $FULL_NAME/emailAddress=$EMAIL"

echo ""
echo "✅ Certificate signing requests generated successfully!"
echo ""
echo "📋 Generated files:"
ls -la *.csr *.key

echo ""
echo "🚀 Next Steps:"
echo "=============="
echo ""
echo "1. Go to Apple Developer Portal: https://developer.apple.com/account/"
echo "2. Navigate to: Certificates, Identifiers & Profiles > Certificates"
echo ""
echo "3. Create iOS App Development certificate:"
echo "   - Click '+' to add new certificate"
echo "   - Select 'iOS App Development'"
echo "   - Upload: ios_development.csr"
echo "   - Download the resulting .cer file to this directory"
echo ""
echo "4. Create iOS Distribution certificate:"
echo "   - Click '+' to add new certificate"
echo "   - Select 'iOS Distribution'"
echo "   - Upload: ios_distribution.csr"
echo "   - Download the resulting .cer file to this directory"
echo ""
echo "5. After downloading both .cer files, run:"
echo "   ./convert_to_p12.sh"
echo ""
echo "📁 Certificate files are saved in: $CERT_DIR"

# Create the conversion script
cat > convert_to_p12.sh << 'EOF'
#!/bin/bash
# Certificate conversion script (run after downloading .cer files from Apple)

set -e

echo "🔄 Converting Apple certificates to P12 format..."
echo ""

# Check if we're in the right directory
if [ ! -f "ios_development_private.key" ] || [ ! -f "ios_distribution_private.key" ]; then
    echo "❌ Private key files not found. Please run this script from the ios-certificates directory."
    exit 1
fi

# Check if .cer files exist
missing_files=()
if [ ! -f "ios_development.cer" ]; then
    missing_files+=("ios_development.cer")
fi
if [ ! -f "ios_distribution.cer" ]; then
    missing_files+=("ios_distribution.cer")
fi

if [ ${#missing_files[@]} -gt 0 ]; then
    echo "❌ Missing certificate files from Apple Developer Portal:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "Please download these files from Apple Developer Portal and save them in:"
    echo "$(pwd)"
    echo ""
    echo "Steps to download:"
    echo "1. Go to https://developer.apple.com/account/"
    echo "2. Navigate to Certificates, Identifiers & Profiles > Certificates"
    echo "3. Find your certificates and click 'Download'"
    echo "4. Save the .cer files in this directory"
    exit 1
fi

echo "📱 Converting development certificate..."
openssl x509 -inform DER -in ios_development.cer -out ios_development.pem
echo "Enter a password for the development P12 file (remember this for GitHub Secrets):"
openssl pkcs12 -export -inkey ios_development_private.key -in ios_development.pem -out ios_development.p12 -name "iOS Development"

echo ""
echo "🏪 Converting distribution certificate..."
openssl x509 -inform DER -in ios_distribution.cer -out ios_distribution.pem
echo "Enter a password for the distribution P12 file (can be the same as above):"
openssl pkcs12 -export -inkey ios_distribution_private.key -in ios_distribution.pem -out ios_distribution.p12 -name "iOS Distribution"

echo ""
echo "✅ P12 certificates generated successfully!"
echo ""
echo "📋 Generated P12 files:"
ls -la *.p12

echo ""
echo "🔐 Convert to Base64 for GitHub Secrets:"
echo "========================================"
echo ""
echo "Run these commands to get Base64 values for GitHub Secrets:"
echo ""
echo "# Development certificate (copy output to APPLE_DEVELOPMENT_CERTIFICATE_P12_BASE64):"
echo "base64 -w 0 ios_development.p12"
echo ""
echo "# Distribution certificate (copy output to APPLE_DISTRIBUTION_CERTIFICATE_P12_BASE64):"
echo "base64 -w 0 ios_distribution.p12"
echo ""
echo "🚀 Final Steps:"
echo "==============="
echo ""
echo "1. Create provisioning profiles in Apple Developer Portal"
echo "2. Convert profiles to Base64 and add to GitHub Secrets"
echo "3. Add certificate password to GitHub Secrets (APPLE_CERTIFICATE_PASSWORD)"
echo "4. Add your Team ID to GitHub Secrets (APPLE_DEVELOPMENT_TEAM)"
echo ""
echo "See docs/IOS_GITHUB_SECRETS_REFERENCE.md for complete setup."

EOF

# Make the conversion script executable
chmod +x convert_to_p12.sh

echo ""
echo "💡 Tip: The convert_to_p12.sh script has been created for the next step."
