import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function resetDevUsers() {
  try {
    console.log('🗑️  Clearing all users...');
    const deleteResult = await prisma.user.deleteMany({});
    console.log(`   Deleted ${deleteResult.count} users`);
    
    console.log('\n👤 Creating test accounts...');
    
    // 1. Free User
    const freeUser = await prisma.user.create({
      data: {
        name: 'Free User',
        email: 'free@example.com',
        passwordHash: await bcrypt.hash('Password123!', 10),
        isAdmin: false,
        subscriptionTier: 'free',
        subscriptionExpiresAt: null,
      },
    });
    console.log(`   ✅ Created: free@example.com (Free tier)`);
    
    // 2. Premium User
    const premiumExpiresAt = new Date();
    premiumExpiresAt.setFullYear(premiumExpiresAt.getFullYear() + 1); // 1 year from now
    
    const premiumUser = await prisma.user.create({
      data: {
        name: 'Premium User',
        email: 'premium@example.com',
        passwordHash: await bcrypt.hash('Password123!', 10),
        isAdmin: false,
        subscriptionTier: 'premium',
        subscriptionExpiresAt: premiumExpiresAt,
      },
    });
    console.log(`   ✅ Created: premium@example.com (Premium tier, expires ${premiumExpiresAt.toISOString().split('T')[0]})`);
    
    // 3. Admin User
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: await bcrypt.hash('Password123!', 10),
        isAdmin: true,
        subscriptionTier: 'premium',
        subscriptionExpiresAt: premiumExpiresAt,
      },
    });
    console.log(`   ✅ Created: admin@example.com (Admin + Premium)`);
    
    console.log('\n✨ Development database reset complete!');
    console.log('\n📝 Login credentials for all accounts:');
    console.log('   Email: free@example.com | premium@example.com | admin@example.com');
    console.log('   Password: Password123!');
    
  } catch (error) {
    console.error('❌ Error resetting users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDevUsers();
