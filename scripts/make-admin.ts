import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    if (user.isAdmin) {
      console.log(`ℹ️  User ${email} is already an admin`);
      process.exit(0);
    }

    await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
    });

    console.log(`✅ Successfully granted admin privileges to: ${email}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: tsx scripts/make-admin.ts <email>');
  process.exit(1);
}

makeAdmin(email);
