import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  
  if (!email || !password) {
    console.error('Usage: tsx scripts/create-admin.ts <email> <password>');
    process.exit(1);
  }
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      // Update existing user to admin
      await prisma.user.update({
        where: { email },
        data: {
          isAdmin: true,
          subscriptionTier: 'premium',
          subscriptionExpiresAt: new Date('2099-12-31')
        }
      });
      console.log(`✅ Updated ${email} to admin`);
    } else {
      // Create new admin user
      const premiumExpiresAt = new Date('2099-12-31');
      const passwordHash = await bcrypt.hash(password, 10);
      
      await prisma.user.create({
        data: {
          name: email.split('@')[0],
          email,
          passwordHash,
          isAdmin: true,
          subscriptionTier: 'premium',
          subscriptionExpiresAt: premiumExpiresAt
        }
      });
      console.log(`✅ Created admin account: ${email}`);
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
