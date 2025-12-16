import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential, ClientCertificateCredential } from '@azure/identity';
import 'isomorphic-fetch';
import fs from 'fs';
import { emailLogger } from './logger';

// Email configuration from environment variables
// These are read at runtime to allow for dynamic configuration
function getConfig() {
  return {
    AZURE_TENANT_ID: process.env.AZURE_TENANT_ID || '',
    AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID || '',
    AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET || '',
    AZURE_CERTIFICATE_PATH: process.env.AZURE_CERTIFICATE_PATH || '',
    EMAIL_FROM: process.env.EMAIL_FROM || 'pfs-noreply@yourdomain.com',
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
  };
}

/**
 * Get authenticated Microsoft Graph client
 * Supports both certificate-based and client secret authentication
 * Certificate-based auth is preferred for production
 */
function getGraphClient(): Client {
  const config = getConfig();
  let credential;

  // Prefer certificate-based authentication if available
  if (config.AZURE_CERTIFICATE_PATH && fs.existsSync(config.AZURE_CERTIFICATE_PATH)) {
    try {
      credential = new ClientCertificateCredential(
        config.AZURE_TENANT_ID,
        config.AZURE_CLIENT_ID,
        {
          certificate: fs.readFileSync(config.AZURE_CERTIFICATE_PATH, 'utf-8'),
        }
      );
      emailLogger.info('Using certificate-based authentication for Microsoft Graph API');
    } catch (error) {
      emailLogger.warn('Failed to load certificate, falling back to client secret', error);
      credential = new ClientSecretCredential(
        config.AZURE_TENANT_ID,
        config.AZURE_CLIENT_ID,
        config.AZURE_CLIENT_SECRET
      );
    }
  } else {
    // Fall back to client secret authentication
    credential = new ClientSecretCredential(
      config.AZURE_TENANT_ID,
      config.AZURE_CLIENT_ID,
      config.AZURE_CLIENT_SECRET
    );
    if (!config.AZURE_CERTIFICATE_PATH) {
      emailLogger.info('Using client secret authentication for Microsoft Graph API');
    }
  }

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken('https://graph.microsoft.com/.default');
        return token?.token || '';
      },
    },
  });
}

/**
 * Send email using Microsoft Graph API
 */
async function sendEmail(to: string, subject: string, htmlBody: string, _textBody: string): Promise<void> {
  // Skip email sending in test environment
  if (process.env.NODE_ENV === 'test') {
    emailLogger.info('Test mode: Email would be sent', { to, subject });
    return;
  }

  const config = getConfig();
  
  // Validate configuration
  const hasCertificate = config.AZURE_CERTIFICATE_PATH && fs.existsSync(config.AZURE_CERTIFICATE_PATH);
  const hasClientSecret = !!config.AZURE_CLIENT_SECRET;
  
  if (!config.AZURE_TENANT_ID || !config.AZURE_CLIENT_ID || (!hasCertificate && !hasClientSecret)) {
    emailLogger.error('Email configuration missing. Please set Azure AD credentials (certificate or client secret) in environment variables.');
    throw new Error('Email service not configured');
  }

  const client = getGraphClient();

  const message = {
    message: {
      subject,
      body: {
        contentType: 'HTML',
        content: htmlBody,
      },
      toRecipients: [
        {
          emailAddress: {
            address: to,
          },
        },
      ],
    },
    saveToSentItems: true,
  };

  try {
    // Extract email address from EMAIL_FROM if it's in format "Name <email@domain.com>"
    const emailMatch = config.EMAIL_FROM.match(/<(.+)>/);
    const fromEmail = emailMatch ? emailMatch[1] : config.EMAIL_FROM;

    await client.api(`/users/${fromEmail}/sendMail`).post(message);
    
    emailLogger.info('Email sent successfully', { to });
  } catch (error) {
    emailLogger.error('Error sending email', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Generate branded HTML email template
 */
function generateEmailTemplate(content: string, preheader?: string): string {
  const config = getConfig();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Prompt Framework Studio</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(to right, #1a2733, #2c3e50); padding: 30px 20px; text-align: center; }
    .header img { height: 60px; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 15px 0 5px 0; font-weight: 600; }
    .header p { color: #95a5a6; font-size: 14px; margin: 0; font-style: italic; }
    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
    .button { display: inline-block; padding: 14px 32px; background-color: #3498db; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 20px 0; }
    .button:hover { background-color: #2980b9; }
    .footer { padding: 30px; text-align: center; color: #7f8c8d; font-size: 12px; background-color: #ecf0f1; }
    .footer a { color: #3498db; text-decoration: none; }
    .preheader { display: none; max-height: 0; overflow: hidden; }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}</div>` : ''}
  <div class="email-container">
    <div class="header">
      <h1>Prompt Framework Studio</h1>
      <p>Nothing But Prompt</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© 2026 Prompt Framework Studio by <a href="https://simplicate.ai">Simplicate AI</a></p>
      <p>Created by Dave Carty</p>
      <p><a href="${config.APP_URL}/legal/privacy">Privacy Policy</a> | <a href="${config.APP_URL}/legal/terms">Terms of Service</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(email: string, token: string, name: string): Promise<void> {
  const config = getConfig();
  const verificationUrl = `${config.APP_URL}/auth/verify-email?token=${token}`;
  
  const htmlContent = `
    <h2>Welcome to Prompt Framework Studio, ${name}!</h2>
    <p>Thank you for creating an account. To get started, please verify your email address by clicking the button below:</p>
    <p style="text-align: center;">
      <a href="${verificationUrl}" class="button">Verify Email Address</a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #7f8c8d; font-size: 14px;">${verificationUrl}</p>
    <p><strong>This link will expire in 24 hours.</strong></p>
    <p>If you didn't create an account with Prompt Framework Studio, you can safely ignore this email.</p>
  `;

  const textContent = `
Welcome to Prompt Framework Studio, ${name}!

Thank you for creating an account. To get started, please verify your email address by visiting this link:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with Prompt Framework Studio, you can safely ignore this email.

---
Prompt Framework Studio by Simplicate AI
${config.APP_URL}
  `.trim();

  const htmlBody = generateEmailTemplate(htmlContent, 'Verify your email address to get started');
  
  await sendEmail(email, 'Verify Your Email - Prompt Framework Studio', htmlBody, textContent);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string, name: string): Promise<void> {
  const config = getConfig();
  const resetUrl = `${config.APP_URL}/auth/reset-password?token=${token}`;
  
  const htmlContent = `
    <h2>Password Reset Request</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password for your Prompt Framework Studio account. Click the button below to create a new password:</p>
    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #7f8c8d; font-size: 14px;">${resetUrl}</p>
    <p><strong>This link will expire in 1 hour.</strong></p>
    <p style="background-color: #fadbd8; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
      <strong>Security Note:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
    </p>
  `;

  const textContent = `
Password Reset Request

Hi ${name},

We received a request to reset your password for your Prompt Framework Studio account. Visit this link to create a new password:

${resetUrl}

This link will expire in 1 hour.

SECURITY NOTE: If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

---
Prompt Framework Studio by Simplicate AI
${config.APP_URL}
  `.trim();

  const htmlBody = generateEmailTemplate(htmlContent, 'Reset your Prompt Framework Studio password');
  
  await sendEmail(email, 'Reset Your Password - Prompt Framework Studio', htmlBody, textContent);
}

/**
 * Send password changed notification email
 */
export async function sendPasswordChangedNotification(email: string, name: string): Promise<void> {
  const config = getConfig();
  const htmlContent = `
    <h2>Password Changed Successfully</h2>
    <p>Hi ${name},</p>
    <p>This is a confirmation that your password for Prompt Framework Studio has been changed successfully.</p>
    <p>If you made this change, no further action is required.</p>
    <p style="background-color: #fadbd8; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
      <strong>Security Alert:</strong> If you didn't change your password, please contact us immediately and secure your account.
    </p>
    <p style="text-align: center;">
      <a href="${config.APP_URL}/auth/login" class="button">Login to Your Account</a>
    </p>
  `;

  const textContent = `
Password Changed Successfully

Hi ${name},

This is a confirmation that your password for Prompt Framework Studio has been changed successfully.

If you made this change, no further action is required.

SECURITY ALERT: If you didn't change your password, please contact us immediately and secure your account.

Login to your account: ${config.APP_URL}/auth/login

---
Prompt Framework Studio by Simplicate AI
${config.APP_URL}
  `.trim();

  const htmlBody = generateEmailTemplate(htmlContent, 'Your password has been changed');
  
  await sendEmail(email, 'Password Changed - Prompt Framework Studio', htmlBody, textContent);
}

/**
 * Send email change request notification to old email
 */
export async function sendEmailChangeNotification(oldEmail: string, newEmail: string, name: string, revokeToken: string): Promise<void> {
  const config = getConfig();
  const revokeUrl = `${config.APP_URL}/account/revoke-email-change?token=${revokeToken}`;
  
  const htmlContent = `
    <h2>Email Change Request</h2>
    <p>Hi ${name},</p>
    <p>We received a request to change your email address from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>
    <p>If you made this request, no action is needed. The change will complete once the new email address is verified.</p>
    <p style="background-color: #fadbd8; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
      <strong>Security Alert:</strong> If you didn't request this change, click the button below immediately to cancel it:
    </p>
    <p style="text-align: center;">
      <a href="${revokeUrl}" class="button" style="background-color: #e74c3c;">Cancel Email Change</a>
    </p>
    <p style="color: #7f8c8d; font-size: 14px;">This cancellation link will expire in 24 hours.</p>
  `;

  const textContent = `
Email Change Request

Hi ${name},

We received a request to change your email address from ${oldEmail} to ${newEmail}.

If you made this request, no action is needed. The change will complete once the new email address is verified.

SECURITY ALERT: If you didn't request this change, cancel it immediately by visiting:

${revokeUrl}

This link will expire in 24 hours.

---
Prompt Framework Studio by Simplicate AI
${config.APP_URL}
  `.trim();

  const htmlBody = generateEmailTemplate(htmlContent, 'Email change request on your account');
  
  await sendEmail(oldEmail, 'Email Change Request - Prompt Framework Studio', htmlBody, textContent);
}

/**
 * Send email verification to new email address
 */
export async function sendEmailChangeVerification(newEmail: string, name: string, verifyToken: string): Promise<void> {
  const config = getConfig();
  const verifyUrl = `${config.APP_URL}/account/verify-email-change?token=${verifyToken}`;
  
  const htmlContent = `
    <h2>Verify Your New Email Address</h2>
    <p>Hi ${name},</p>
    <p>We received a request to change your Prompt Framework Studio email address to <strong>${newEmail}</strong>.</p>
    <p>To complete this change, please verify your new email address by clicking the button below:</p>
    <p style="text-align: center;">
      <a href="${verifyUrl}" class="button">Verify New Email Address</a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #7f8c8d; font-size: 14px;">${verifyUrl}</p>
    <p><strong>This link will expire in 24 hours.</strong></p>
    <p style="color: #7f8c8d; font-size: 14px;">If you didn't request this change, you can safely ignore this email.</p>
  `;

  const textContent = `
Verify Your New Email Address

Hi ${name},

We received a request to change your Prompt Framework Studio email address to ${newEmail}.

To complete this change, please verify your new email address by visiting:

${verifyUrl}

This link will expire in 24 hours.

If you didn't request this change, you can safely ignore this email.

---
Prompt Framework Studio by Simplicate AI
${config.APP_URL}
  `.trim();

  const htmlBody = generateEmailTemplate(htmlContent, 'Verify your new email address');
  
  await sendEmail(newEmail, 'Verify Your New Email - Prompt Framework Studio', htmlBody, textContent);
}

/**
 * Send email change completed notification
 */
export async function sendEmailChangeCompleted(newEmail: string, oldEmail: string, name: string): Promise<void> {
  const config = getConfig();
  const htmlContent = `
    <h2>Email Address Changed Successfully</h2>
    <p>Hi ${name},</p>
    <p>Your email address has been successfully changed from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>
    <p>You can now use this email address to log in to your account.</p>
    <p style="background-color: #d5f4e6; padding: 15px; border-left: 4px solid #27ae60; margin: 20px 0;">
      <strong>Success:</strong> Your email has been updated and all future communications will be sent to this address.
    </p>
    <p style="text-align: center;">
      <a href="${config.APP_URL}/auth/login" class="button">Login to Your Account</a>
    </p>
  `;

  const textContent = `
Email Address Changed Successfully

Hi ${name},

Your email address has been successfully changed from ${oldEmail} to ${newEmail}.

You can now use this email address to log in to your account.

Login to your account: ${config.APP_URL}/auth/login

---
Prompt Framework Studio by Simplicate AI
${config.APP_URL}
  `.trim();

  const htmlBody = generateEmailTemplate(htmlContent, 'Your email address has been updated');
  
  await sendEmail(newEmail, 'Email Changed - Prompt Framework Studio', htmlBody, textContent);
}

/**
 * Send email change revoked notification
 */
export async function sendEmailChangeRevoked(oldEmail: string, newEmail: string, name: string): Promise<void> {
  const config = getConfig();
  
  // Notify old email
  const htmlContentOld = `
    <h2>Email Change Cancelled</h2>
    <p>Hi ${name},</p>
    <p>The request to change your email address from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong> has been cancelled.</p>
    <p>Your email address remains unchanged and your account is secure.</p>
    <p style="background-color: #d5f4e6; padding: 15px; border-left: 4px solid #27ae60; margin: 20px 0;">
      <strong>No Action Required:</strong> Your email address is still ${oldEmail}.
    </p>
  `;

  const textContentOld = `
Email Change Cancelled

Hi ${name},

The request to change your email address from ${oldEmail} to ${newEmail} has been cancelled.

Your email address remains unchanged and your account is secure.

---
Prompt Framework Studio by Simplicate AI
${config.APP_URL}
  `.trim();

  const htmlBodyOld = generateEmailTemplate(htmlContentOld, 'Email change request cancelled');
  await sendEmail(oldEmail, 'Email Change Cancelled - Prompt Framework Studio', htmlBodyOld, textContentOld);
  
  // Notify new email
  const htmlContentNew = `
    <h2>Email Change Request Cancelled</h2>
    <p>Hi ${name},</p>
    <p>The request to change an email address to <strong>${newEmail}</strong> has been cancelled by the account owner.</p>
    <p>If you were expecting this change, please contact the account owner.</p>
  `;

  const textContentNew = `
Email Change Request Cancelled

Hi ${name},

The request to change an email address to ${newEmail} has been cancelled by the account owner.

If you were expecting this change, please contact the account owner.

---
Prompt Framework Studio by Simplicate AI
${config.APP_URL}
  `.trim();

  const htmlBodyNew = generateEmailTemplate(htmlContentNew, 'Email change request cancelled');
  await sendEmail(newEmail, 'Email Change Cancelled - Prompt Framework Studio', htmlBodyNew, textContentNew);
}
