#!/bin/bash

# Azure AD Certificate Generator for Prompt Framework Studio
# This script generates a self-signed certificate for Azure AD authentication

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Azure AD Certificate Generator${NC}"
echo "================================"
echo ""

# Default values
CERT_DIR="$HOME/certs/prompt-studio"
DAYS_VALID=730  # 2 years
KEY_SIZE=4096

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dir)
      CERT_DIR="$2"
      shift 2
      ;;
    --days)
      DAYS_VALID="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo "Certificate directory: $CERT_DIR"
echo "Valid for: $DAYS_VALID days ($(($DAYS_VALID / 365)) years)"
echo ""

# Create directory if it doesn't exist
if [ ! -d "$CERT_DIR" ]; then
  echo "Creating directory: $CERT_DIR"
  mkdir -p "$CERT_DIR"
fi

cd "$CERT_DIR"

# Check if certificates already exist
if [ -f "azure-cert.pem" ]; then
  echo -e "${YELLOW}Warning: Certificates already exist in this directory!${NC}"
  read -p "Do you want to overwrite them? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
  fi
  echo ""
fi

echo "Generating certificate..."
echo ""

# Generate private key and certificate
openssl req -x509 -newkey rsa:$KEY_SIZE \
  -keyout private-key.pem \
  -out certificate.pem \
  -days $DAYS_VALID \
  -nodes \
  -subj "/CN=Prompt Framework Studio Email Service/O=Your Organization/C=US"

# Combine into single file for Azure SDK
cat private-key.pem certificate.pem > azure-cert.pem

# Set proper permissions
chmod 600 azure-cert.pem private-key.pem
chmod 644 certificate.pem

echo -e "${GREEN}✓ Certificate generated successfully!${NC}"
echo ""
echo "Files created:"
echo "  - certificate.pem       (public certificate - upload to Azure AD)"
echo "  - private-key.pem       (private key - keep secret!)"
echo "  - azure-cert.pem        (combined - use in your app)"
echo ""

# Display certificate info
echo "Certificate details:"
openssl x509 -in certificate.pem -noout -subject -dates -fingerprint
echo ""

# Get the absolute path for env configuration
ABSOLUTE_PATH="$(cd "$(dirname "$CERT_DIR")"; pwd)/$(basename "$CERT_DIR")/azure-cert.pem"

echo -e "${GREEN}Next steps:${NC}"
echo ""
echo "1. Upload certificate.pem to Azure AD:"
echo "   - Go to Azure Portal > App Registration > Certificates & secrets"
echo "   - Upload: $CERT_DIR/certificate.pem"
echo ""
echo "2. Add to your .env file:"
echo "   AZURE_CERTIFICATE_PATH=$ABSOLUTE_PATH"
echo ""
echo "3. IMPORTANT: Never commit these files to version control!"
echo "   The private key must remain secret."
echo ""
echo -e "${YELLOW}Certificate expires on:${NC}"
openssl x509 -in certificate.pem -noout -enddate | sed 's/notAfter=//'
echo ""
echo "Set a reminder to regenerate before this date."
echo ""
echo -e "${GREEN}Done!${NC}"
