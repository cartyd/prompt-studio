# Certificate-Based Authentication Update

## Summary

The email service has been updated to support **certificate-based authentication** with Azure AD, which is now the **recommended approach for production**. Client secret authentication is still supported as a fallback for development/testing.

## What Changed

### 1. Updated Email Service (`src/utils/email.ts`)

The service now:
- ✅ **Automatically detects** which authentication method to use
- ✅ **Prefers certificate** if `AZURE_CERTIFICATE_PATH` is provided
- ✅ **Falls back to client secret** if certificate is not available
- ✅ Logs which method is being used for transparency
- ✅ Validates that at least one authentication method is configured

### 2. Environment Configuration

**New variable added:**
- `AZURE_CERTIFICATE_PATH` - Path to combined PEM file (certificate + private key)

**Updated `.env.example`** with:
- Certificate configuration (recommended)
- Client secret configuration (alternative)
- Clear comments explaining each method

### 3. Comprehensive Documentation

**Updated `docs/AZURE_AD_EMAIL_SETUP.md`**:
- Certificate-based auth is now the primary recommendation
- Step-by-step certificate generation instructions
- Security comparison: certificate vs client secret
- Windows/Mac/Linux certificate generation commands
- Azure AD upload instructions
- Certificate rotation guidance

### 4. Helper Script

**Created `scripts/generate-azure-certificate.sh`**:
- Automated certificate generation
- Proper file permissions
- Helpful next-step instructions
- Certificate expiration warnings
- Custom directory support

## Why Certificate Authentication?

### Security Advantages

| Feature | Certificate | Client Secret |
|---------|------------|--------------|
| **Security** | ✅ Public/private key crypto | ❌ String-based |
| **Exposure risk** | ✅ Can't be logged | ❌ Can leak in logs |
| **Key location** | ✅ Never leaves server | ❌ Stored as string |
| **Industry standard** | ✅ Best practice | ⚠️ Acceptable |
| **Compliance** | ✅ Better audit trail | ⚠️ Adequate |
| **Microsoft recommendation** | ✅ Preferred | ⚠️ Allowed |

### Why Both Methods Are Supported

**Certificate** (Production):
- More secure for business email accounts
- Required for compliance in many organizations
- Better for long-term maintenance

**Client Secret** (Development):
- Faster setup for testing
- Easier to get started
- Good for proof-of-concept

## How to Use

### For New Installations

**Step 1**: Generate certificate
```bash
./scripts/generate-azure-certificate.sh
```

**Step 2**: Upload `certificate.pem` to Azure AD

**Step 3**: Configure `.env`:
```bash
AZURE_CERTIFICATE_PATH=/Users/yourusername/certs/prompt-studio/azure-cert.pem
```

### For Existing Installations (Using Client Secret)

**You don't need to change anything!** The client secret method still works.

**To upgrade to certificate auth**:
1. Run `./scripts/generate-azure-certificate.sh`
2. Upload certificate to Azure AD
3. Add `AZURE_CERTIFICATE_PATH` to your `.env`
4. Remove or comment out `AZURE_CLIENT_SECRET`
5. Restart your application

The app will automatically use the certificate.

### Testing Both Methods

```bash
# Test with certificate
AZURE_CERTIFICATE_PATH=/path/to/cert.pem npm run dev

# Test with client secret  
AZURE_CLIENT_SECRET=your-secret npm run dev

# If both are present, certificate takes precedence
```

## Certificate Management

### Generation
```bash
# Default (2 year validity)
./scripts/generate-azure-certificate.sh

# Custom validity period (3 years)
./scripts/generate-azure-certificate.sh --days 1095

# Custom directory
./scripts/generate-azure-certificate.sh --dir /etc/ssl/private/
```

### Checking Expiration
```bash
openssl x509 -in ~/certs/prompt-studio/certificate.pem -noout -dates
```

### Rotation (Before Expiration)
1. Generate new certificate (keep old one)
2. Upload new certificate to Azure AD
3. Update `AZURE_CERTIFICATE_PATH` in `.env`
4. Restart application
5. Delete old certificate after confirming new one works

**No downtime** - both certificates work during transition.

### Security Best Practices

1. **Never commit certificates to git**:
   ```bash
   # Add to .gitignore
   *.pem
   certs/
   ```

2. **Secure file permissions**:
   ```bash
   chmod 600 azure-cert.pem private-key.pem
   chmod 644 certificate.pem  # Public cert only
   ```

3. **Store outside project directory**:
   ```bash
   # Good
   ~/certs/prompt-studio/azure-cert.pem
   /etc/ssl/private/prompt-studio-cert.pem
   
   # Bad (in project)
   ./certs/azure-cert.pem
   ./azure-cert.pem
   ```

4. **Use absolute paths in .env**:
   ```bash
   # Good
   AZURE_CERTIFICATE_PATH=/Users/gideon/certs/prompt-studio/azure-cert.pem
   
   # Bad (relative path may break)
   AZURE_CERTIFICATE_PATH=~/certs/azure-cert.pem
   ```

5. **Set expiration reminders**:
   - Certificates expire after 2 years (730 days)
   - Set calendar reminder 1 month before expiration
   - Generate and upload new cert before old one expires

## Troubleshooting

### "Certificate file not found"
- Verify path is absolute, not relative
- Check file exists: `ls -la /path/to/azure-cert.pem`
- Ensure proper permissions: `chmod 600 /path/to/azure-cert.pem`

### "Failed to load certificate"
- Verify file contains both private key and certificate
- Check file format is PEM (not DER or PFX)
- Regenerate if corrupted: `./scripts/generate-azure-certificate.sh`

### "Authentication failed"
- Ensure certificate was uploaded to Azure AD
- Wait 5-10 minutes after uploading for propagation
- Verify tenant ID and client ID are correct
- Check certificate hasn't expired

### Still using client secret?
If both are configured, certificate takes precedence. To force client secret:
```bash
# Temporarily disable certificate
mv ~/.env ~/.env.backup
# Edit .env to remove AZURE_CERTIFICATE_PATH
# Or comment it out
```

## Migration Path

### From Client Secret to Certificate

```bash
# 1. Generate certificate
./scripts/generate-azure-certificate.sh

# 2. Note the output path
# AZURE_CERTIFICATE_PATH=/Users/gideon/certs/prompt-studio/azure-cert.pem

# 3. Upload certificate.pem to Azure AD
#    Portal > App Registration > Certificates & secrets > Upload

# 4. Update .env
echo "AZURE_CERTIFICATE_PATH=/Users/gideon/certs/prompt-studio/azure-cert.pem" >> .env

# 5. Test
npm run dev

# 6. Once confirmed working, remove client secret
# (Optional - certificate takes precedence anyway)
```

### For Production Deployment

```bash
# 1. Generate certificate on production server
ssh production-server
cd /opt/prompt-studio
./scripts/generate-azure-certificate.sh --dir /etc/ssl/private/prompt-studio

# 2. Upload certificate to Azure AD from your local machine
# Download certificate.pem and upload via Azure Portal

# 3. Update production .env
echo "AZURE_CERTIFICATE_PATH=/etc/ssl/private/prompt-studio/azure-cert.pem" >> .env

# 4. Restart application
pm2 restart prompt-studio
```

## Additional Resources

- **Main Documentation**: `docs/AZURE_AD_EMAIL_SETUP.md`
- **Quick Start Guide**: `docs/QUICK_START.md`
- **Full Summary**: `docs/EMAIL_VERIFICATION_SUMMARY.md`
- **Helper Script**: `scripts/generate-azure-certificate.sh`

## Questions?

### Should I use certificate or client secret?

- **Production/Business**: Use certificate
- **Development/Testing**: Either is fine (client secret is simpler)
- **Compliance required**: Use certificate
- **Quick prototype**: Use client secret

### Can I use both?

Yes, but certificate takes precedence. This is useful during migration - you can have both configured for zero-downtime transitions.

### What if my certificate expires?

Generate a new one and upload it to Azure AD before the old one expires. Both will work during the transition period.

### Is Let's Encrypt supported?

No - Let's Encrypt is for TLS/SSL certificates (websites). Azure AD uses client authentication certificates, which are different. Use self-signed certificates (fully supported by Azure AD).
