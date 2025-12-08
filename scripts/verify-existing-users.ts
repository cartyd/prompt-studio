import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Marking all existing users as verified...');

  const result = await prisma.user.updateMany({
    where: {
      emailVerified: false,
    },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`✅ Updated ${result.count} users to verified status`);
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
