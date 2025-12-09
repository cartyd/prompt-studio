import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential, ClientCertificateCredential } from '@azure/identity';
import 'isomorphic-fetch';
import fs from 'fs';

const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID || '';
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID || '';
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || '';
const AZURE_CERTIFICATE_PATH = process.env.AZURE_CERTIFICATE_PATH || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'pfs-noreply@yourdomain.com';

function getGraphClient(): Client {
  let credential;

  if (AZURE_CERTIFICATE_PATH && fs.existsSync(AZURE_CERTIFICATE_PATH)) {
    try {
      const certificateContent = fs.readFileSync(AZURE_CERTIFICATE_PATH, 'utf-8');
      credential = new ClientCertificateCredential(
        AZURE_TENANT_ID,
        AZURE_CLIENT_ID,
        certificateContent
      );
      console.log('Using certificate-based authentication');
    } catch (error) {
      console.error('Failed to load certificate, falling back to client secret:', error);
      credential = new ClientSecretCredential(
        AZURE_TENANT_ID,
        AZURE_CLIENT_ID,
        AZURE_CLIENT_SECRET
      );
    }
  } else {
    credential = new ClientSecretCredential(
      AZURE_TENANT_ID,
      AZURE_CLIENT_ID,
      AZURE_CLIENT_SECRET
    );
    console.log('Using client secret authentication');
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

async function sendTestEmail(to: string): Promise<void> {
  // Validate configuration
  const hasCertificate = AZURE_CERTIFICATE_PATH && fs.existsSync(AZURE_CERTIFICATE_PATH);
  const hasClientSecret = !!AZURE_CLIENT_SECRET;
  
  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || (!hasCertificate && !hasClientSecret)) {
    console.error('Email configuration missing. Required:');
    console.error('- AZURE_TENANT_ID:', !!AZURE_TENANT_ID);
    console.error('- AZURE_CLIENT_ID:', !!AZURE_CLIENT_ID);
    console.error('- AZURE_CLIENT_SECRET or AZURE_CERTIFICATE_PATH:', hasClientSecret || hasCertificate);
    throw new Error('Email service not configured');
  }

  console.log('Configuration found:');
  console.log('- AZURE_TENANT_ID:', AZURE_TENANT_ID);
  console.log('- AZURE_CLIENT_ID:', AZURE_CLIENT_ID);
  console.log('- EMAIL_FROM:', EMAIL_FROM);
  console.log('- Sending to:', to);

  const client = getGraphClient();

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Email</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(to right, #1a2733, #2c3e50); padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 15px 0 5px 0; font-weight: 600; }
    .header p { color: #95a5a6; font-size: 14px; margin: 0; font-style: italic; }
    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
    .footer { padding: 30px; text-align: center; color: #7f8c8d; font-size: 12px; background-color: #ecf0f1; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Prompt Framework Studio</h1>
      <p>Nothing But Prompt</p>
    </div>
    <div class="content">
      <h2>Test Email</h2>
      <p>Hi Dave,</p>
      <p>This is a test email from Prompt Framework Studio to verify the email functionality is working correctly.</p>
      <p>If you're receiving this, the email service is configured properly!</p>
      <p>Timestamp: ${new Date().toISOString()}</p>
    </div>
    <div class="footer">
      <p>© 2026 Prompt Framework Studio by Simplicate AI</p>
      <p>Created by Dave Carty</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const message = {
    message: {
      subject: 'Test Email - Prompt Framework Studio',
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
    const emailMatch = EMAIL_FROM.match(/<(.+)>/);
    const fromEmail = emailMatch ? emailMatch[1] : EMAIL_FROM;

    console.log('Attempting to send email from:', fromEmail);
    
    await client.api(`/users/${fromEmail}/sendMail`).post(message);
    
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error: any) {
    console.error('❌ Error sending email:', error.message);
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    }
    throw error;
  }
}

// Run the test
const testEmail = 'dave.carty@simplicate.ai';
console.log('\n=== Testing Email Service ===\n');

sendTestEmail(testEmail)
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
