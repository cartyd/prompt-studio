# Quick Start Guide - Email Verification

## Testing Without Azure AD (Development Mode)

If you want to test the flow without setting up Azure AD first, you can run the app in test mode:

### Option 1: Test Mode (No Real Emails)

1. **Update your .env file**:
```bash
NODE_ENV=test
APP_URL=http://localhost:3000
```

2. **Start the app**:
```bash
npm run dev
```

3. **Test the flow**:
   - Go to http://localhost:3000/auth/register
   - Register a new user
   - Check the console logs - you'll see the email content and verification link
   - Copy the verification token from the logs
   - Visit: `http://localhost:3000/auth/verify-email?token=YOUR_TOKEN_HERE`
   - Try logging in - it should work now

**Note**: In test mode, emails are logged to console instead of being sent.

### Option 2: Mock Azure AD Credentials (For Testing)

If you want to test without real emails but with production-like code paths:

1. **Add dummy credentials to .env** (using client secret for simplicity):
```bash
NODE_ENV=development
APP_URL=http://localhost:3000
AZURE_TENANT_ID=00000000-0000-0000-0000-000000000000
AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
AZURE_CLIENT_SECRET=dummy_secret_for_testing
EMAIL_FROM=test@example.com
```

2. **Start the app**:
```bash
npm run dev
```

The app will attempt to send emails but fail gracefully, logging errors while still creating users and tokens.

## Testing With Azure AD (Production-Like)

For full functionality with real email sending:

1. **Complete Azure AD Setup**:
   - Follow the complete guide in `docs/AZURE_AD_EMAIL_SETUP.md`
   - This takes about 30 minutes including permission propagation

2. **Configure .env with real credentials**:

**Using Certificate (Recommended)**:
```bash
NODE_ENV=development
APP_URL=http://localhost:3000
AZURE_TENANT_ID=your-real-tenant-id
AZURE_CLIENT_ID=your-real-client-id
AZURE_CERTIFICATE_PATH=/Users/yourusername/certs/prompt-studio/azure-cert.pem
EMAIL_FROM=pfs-noreply@yourdomain.com
```

**Or using Client Secret** (easier setup):
```bash
NODE_ENV=development
APP_URL=http://localhost:3000
AZURE_TENANT_ID=your-real-tenant-id
AZURE_CLIENT_ID=your-real-client-id
AZURE_CLIENT_SECRET=your-real-client-secret
EMAIL_FROM=pfs-noreply@yourdomain.com
```

3. **Start the app**:
```bash
npm run dev
```

4. **Test the complete flow**:
   - Register a new user with a real email address you can access
   - Check your email inbox for the verification email
   - Click the verification link
   - Try logging in

## Testing Password Reset

1. **Navigate to login page**: http://localhost:3000/auth/login

2. **Click "Forgot password?"**

3. **Enter your email address**

4. **Check for reset email** (console logs in test mode, or your inbox in production mode)

5. **Click the reset link** and set a new password

6. **Login with new password**

## Verifying Existing Users

If you have existing users in your database that need to be marked as verified:

```bash
npx tsx scripts/verify-existing-users.ts
```

This is safe to run multiple times - it only updates users who are not yet verified.

## Useful Database Commands

### Check user verification status:
```bash
npx prisma studio
```
Then navigate to the User model and check the `emailVerified` field.

### Manually verify a user (if needed):
Open Prisma Studio and set:
- `emailVerified` = true
- `emailVerifiedAt` = current date/time

### View verification tokens:
In Prisma Studio, check the VerificationToken model to see active tokens.

## Common Issues

### "Email not verified" error when logging in
- The user needs to verify their email first
- Check if verification email was sent (check logs)
- Manually verify the user in database if needed
- Or click "Resend verification email" on the error message

### No email received
- Check spam folder
- If in test mode, check console logs
- Verify Azure AD credentials are correct
- Ensure "Send As" permission is granted (wait 15-30 min)

### Token expired error
- Verification links expire after 24 hours
- Password reset links expire after 1 hour
- Request a new token via the resend option

## Next Steps

Once you've tested the basic flow:

1. ✅ Set up Azure AD properly (see `docs/AZURE_AD_EMAIL_SETUP.md`)
2. ✅ Test with real emails
3. ✅ Customize email templates if needed (in `src/utils/email.ts`)
4. ✅ Add monitoring for email failures
5. ✅ Consider adding a token cleanup cron job

## Development Tips

### View email content without sending:
In `src/utils/email.ts`, the `sendEmail` function logs email content in test mode. You can temporarily set `NODE_ENV=test` to see exactly what will be sent.

### Test token generation:
```typescript
import { generateSecureToken } from './src/utils/tokens';
console.log(generateSecureToken());
```

### Manually create a token:
```bash
npx tsx
```
Then:
```typescript
import { PrismaClient } from '@prisma/client';
import { createVerificationToken } from './src/utils/tokens';

const prisma = new PrismaClient();
const token = await createVerificationToken(prisma, 'user-id-here', 'email_verification');
console.log(`Verification link: http://localhost:3000/auth/verify-email?token=${token}`);
await prisma.$disconnect();
```

## Support

- Full implementation details: `docs/EMAIL_VERIFICATION_SUMMARY.md`
- Azure AD setup: `docs/AZURE_AD_EMAIL_SETUP.md`
- Check application logs for detailed error messages
