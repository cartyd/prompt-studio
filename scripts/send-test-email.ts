import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

import { sendVerificationEmail } from '../src/utils/email';

async function sendTest() {
  console.log('\n=== Testing Email Service ===\n');
  console.log('Environment check:');
  console.log('- AZURE_TENANT_ID:', process.env.AZURE_TENANT_ID);
  console.log('- AZURE_CLIENT_ID:', process.env.AZURE_CLIENT_ID);
  console.log('- AZURE_CERTIFICATE_PATH:', process.env.AZURE_CERTIFICATE_PATH);
  console.log('- AZURE_CLIENT_SECRET:', process.env.AZURE_CLIENT_SECRET ? '(set)' : '(not set)');
  console.log('- EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('\nSending test email to: dave.carty@simplicate.ai');
  console.log('From: pfs-noreply@simplicate.ai\n');

  try {
    // Use a dummy token for testing
    const dummyToken = 'test-token-' + Date.now();
    
    await sendVerificationEmail('dave.carty@simplicate.ai', dummyToken, 'Dave');
    
    console.log('✅ Test email sent successfully!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error sending test email:', error.message);
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    }
    process.exit(1);
  }
}

sendTest();
