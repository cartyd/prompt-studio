# Azure AD Email Setup for Microsoft 365

This guide explains how to configure Azure AD app registration to enable email sending through Microsoft Graph API using your Microsoft 365 shared mailbox.

## Prerequisites

- Access to Azure Portal (https://portal.azure.com)
- Microsoft 365 tenant admin access
- Shared mailbox configured (e.g., pfs-noreply@yourdomain.com)

## Step 1: Create Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure the registration:
   - **Name**: `Prompt Framework Studio Email Service`
   - **Supported account types**: `Accounts in this organizational directory only (Single tenant)`
   - **Redirect URI**: Leave blank (not needed for backend service)
5. Click **Register**

## Step 2: Note Your App Credentials

After registration, you'll see the app overview page. Note the following values:

- **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

You'll need these for your `.env` file.

## Step 3: Choose Authentication Method

You have two options for authenticating with Azure AD. **Certificate-based authentication is strongly recommended for production.**

### Option A: Certificate-Based Authentication (Recommended)

**Why certificates?**
- ✅ More secure (uses public/private key cryptography)
- ✅ Private key never leaves your server
- ✅ Can't be accidentally logged or exposed
- ✅ Microsoft's recommended best practice
- ✅ Better for compliance and auditing

#### Step 3a: Generate Certificate

**Quick method** (recommended): Use our helper script:

```bash
# From your project root
./scripts/generate-azure-certificate.sh

# Or specify a custom directory:
./scripts/generate-azure-certificate.sh --dir /path/to/certs
```

The script will generate all necessary files and provide next-step instructions.

**Manual method**: If you prefer to generate manually:

```bash
# Create directory for certificates
mkdir -p ~/certs/prompt-studio
cd ~/certs/prompt-studio

# Generate self-signed certificate (valid for 2 years)
# This creates both public certificate and private key in one file
openssl req -x509 -newkey rsa:4096 -keyout private-key.pem -out certificate.pem -days 730 -nodes \
  -subj "/CN=Prompt Framework Studio Email Service/O=Your Organization/C=US"

# Combine into single PEM file (required for Azure SDK)
cat private-key.pem certificate.pem > azure-cert.pem

# Set secure permissions
chmod 600 azure-cert.pem private-key.pem
chmod 644 certificate.pem
```

**Outputs:**
- `certificate.pem` - Public certificate only (upload to Azure AD)
- `private-key.pem` - Private key only (keep secret)
- `azure-cert.pem` - Combined file (use in your app)

#### Step 3b: Upload Certificate to Azure AD

1. In your app registration, go to **Certificates & secrets**
2. Click **Certificates** tab
3. Click **Upload certificate**
4. Select the **`certificate.pem`** file (public certificate only)
5. Add a description: `Production Email Service Certificate`
6. Click **Add**

**IMPORTANT**: Never upload the private key or combined file to Azure!

#### Step 3c: Secure the Private Key

```bash
# Move to secure location (not in your project directory)
mv azure-cert.pem ~/certs/prompt-studio/

# Ensure it's never committed to git
echo "~/certs/" >> ~/.gitignore_global

# For production: use environment-specific paths
# Dev: ~/certs/prompt-studio/azure-cert.pem
# Prod: /etc/ssl/private/prompt-studio-azure-cert.pem
```

### Option B: Client Secret (Simpler, Less Secure)

**Use for**: Development, testing, quick setup

**Why not for production?**
- ❌ Less secure (string-based credential)
- ❌ Can be accidentally logged
- ❌ Requires manual rotation

#### If using client secret:

1. In your app registration, go to **Certificates & secrets**
2. Click **Client secrets** tab
3. Click **New client secret**
4. Add a description: `Email Service Secret`
5. Choose an expiration period (recommended: 24 months)
6. Click **Add**
7. **IMPORTANT**: Copy the **Value** immediately - it will only be shown once!
   - This is your `AZURE_CLIENT_SECRET`

## Step 4: Grant API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Choose **Microsoft Graph**
4. Choose **Application permissions** (not Delegated)
5. Search for and select: `Mail.Send`
6. Click **Add permissions**
7. **IMPORTANT**: Click **Grant admin consent for [Your Organization]**
   - You need admin privileges for this step
   - Wait for the green checkmark to appear

Your permissions should show:
- ✅ Mail.Send (Application) - Status: Granted for [Your Organization]

## Step 5: Grant Send As Permission to Shared Mailbox

The app needs permission to send emails from your shared mailbox. Run this PowerShell command:

### Option A: Using Exchange Online PowerShell

```powershell
# Install module if needed
Install-Module -Name ExchangeOnlineManagement

# Connect to Exchange Online
Connect-ExchangeOnline -UserPrincipalName your-admin@yourdomain.com

# Grant Send As permission to the app
Add-RecipientPermission -Identity "pfs-noreply@yourdomain.com" -Trustee "Prompt Framework Studio Email Service" -AccessRights SendAs -Confirm:$false

# Disconnect
Disconnect-ExchangeOnline
```

### Option B: Using Microsoft 365 Admin Center

1. Go to [Microsoft 365 Admin Center](https://admin.microsoft.com)
2. Navigate to **Teams & groups** > **Shared mailboxes**
3. Select your shared mailbox (pfs-noreply)
4. Go to **Mailbox permissions** > **Send as**
5. Click **Add permissions**
6. Add the service principal/app: `Prompt Framework Studio Email Service`
7. Save changes

**Note**: It may take 15-30 minutes for permissions to propagate.

## Step 6: Configure Environment Variables

### If using Certificate Authentication (Recommended):

Add to your `.env` file:

```bash
# Azure AD / Microsoft 365 Email Configuration
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CERTIFICATE_PATH=/Users/yourusername/certs/prompt-studio/azure-cert.pem
EMAIL_FROM=pfs-noreply@yourdomain.com
APP_URL=http://localhost:3000
```

**Important**: Use absolute paths for the certificate file.

### If using Client Secret:

Add to your `.env` file:

```bash
# Azure AD / Microsoft 365 Email Configuration
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here
EMAIL_FROM=pfs-noreply@yourdomain.com
APP_URL=http://localhost:3000
```

**Note**: The app automatically detects which authentication method to use based on which credentials are provided. Certificate is preferred if both are present.

## Step 7: Test the Configuration

You can test the email configuration by:

1. Starting your application
2. Registering a new user account
3. Check that the verification email is sent successfully

Monitor the application logs for any email sending errors.

## Troubleshooting

### Error: "Insufficient privileges to complete the operation"
- Ensure you've granted admin consent for the `Mail.Send` permission
- Wait 15-30 minutes after granting permissions for them to propagate

### Error: "Mailbox not found"
- Verify the email address in `EMAIL_FROM` matches your shared mailbox exactly
- Ensure the shared mailbox exists and is active

### Error: "Client secret has expired"
- Client secrets expire after the period you selected (up to 24 months)
- Create a new client secret and update your `.env` file
- **Solution**: Switch to certificate-based auth to avoid this issue

### Error: "Certificate file not found" or "Failed to load certificate"
- Verify the path in `AZURE_CERTIFICATE_PATH` is correct and absolute
- Ensure the certificate file has proper permissions (readable by app)
- Check that the certificate hasn't expired: `openssl x509 -in certificate.pem -noout -dates`
- Regenerate certificate if expired (certificates generated with the command above are valid for 2 years)

### Error: "The specified object was not found in the store"
- The service principal needs "Send As" permission on the mailbox
- Follow Step 5 again and wait 15-30 minutes

### Emails not sending
- Check application logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure the app has internet connectivity to reach graph.microsoft.com
- Test with `curl -v https://graph.microsoft.com/v1.0/` to verify connectivity

## Security Best Practices

1. **Use certificates in production**: Certificate-based auth is more secure than client secrets
2. **Secure certificate storage**: 
   - Store private keys outside your project directory
   - Use proper file permissions (chmod 600)
   - Never commit certificates to version control
   - Consider Azure Key Vault for production
3. **Certificate rotation**: Certificates generated with our command expire in 2 years
   - Set a reminder to regenerate before expiration
   - Can be rotated without app downtime (upload new cert to Azure first)
4. **Use least privilege**: The app only has `Mail.Send` permission, not read access
5. **Secure your .env file**: Never commit `.env` to version control
6. **Monitor usage**: Check Azure AD sign-in logs periodically for unusual activity
7. **For client secrets** (if you must use them):
   - Rotate regularly before expiration
   - Use maximum allowed expiration (24 months)
   - Store in Azure Key Vault or similar secrets manager

## Additional Resources

- [Microsoft Graph Mail API Documentation](https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview)
- [Microsoft Graph Permissions Reference](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Azure AD App Registration Best Practices](https://learn.microsoft.com/en-us/azure/active-directory/develop/app-objects-and-service-principals)

## Support

If you encounter issues not covered in this guide, please check:
- Azure AD audit logs in the Azure Portal
- Application logs for detailed error messages
- Microsoft Graph API status: https://status.dev.microsoft.com/
