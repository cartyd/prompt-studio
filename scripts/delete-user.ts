import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser(email: string) {
  try {
    console.log(`\nLooking for user with email: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`User ID: ${user.id}`);
    
    // Delete related records first
    console.log('\nDeleting related records...');
    
    // Delete verification tokens
    const deletedTokens = await prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });
    console.log(`- Deleted ${deletedTokens.count} verification token(s)`);
    
    // Delete prompts
    const deletedPrompts = await prisma.prompt.deleteMany({
      where: { userId: user.id },
    });
    console.log(`- Deleted ${deletedPrompts.count} prompt(s)`);
    
    // Delete events
    const deletedEvents = await prisma.event.deleteMany({
      where: { userId: user.id },
    });
    console.log(`- Deleted ${deletedEvents.count} event(s)`);
    
    // Delete custom criteria
    const deletedCriteria = await prisma.customCriteria.deleteMany({
      where: { userId: user.id },
    });
    console.log(`- Deleted ${deletedCriteria.count} custom criteria`);
    
    // Delete the user
    await prisma.user.delete({
      where: { id: user.id },
    });
    
    console.log(`\n✅ Successfully deleted user: ${email}`);
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error deleting user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: tsx scripts/delete-user.ts <email>');
  process.exit(1);
}

deleteUser(email);
