// View all user accounts (works on server without dev deps)
// Usage:
//   node scripts/view-users.js            # pretty table
//   node scripts/view-users.js --json     # raw JSON
//   node scripts/view-users.js <filter>   # filter by substring in email

const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
require('dotenv/config');

(async () => {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
  const prisma = new PrismaClient({ adapter });
  try {
    const filter = process.argv.slice(2).find(a => !a.startsWith('--')) || '';
    const where = filter
      ? { email: { contains: filter } } // Prisma will translate for SQLite
      : undefined;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        isAdmin: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(users, null, 2));
      return;
    }

    const rows = users.map(u => ({
      Email: u.email,
      Admin: u.isAdmin ? 'yes' : 'no',
      Verified: u.emailVerified ? 'yes' : 'no',
      Created: u.createdAt ? new Date(u.createdAt).toISOString() : '',
      Updated: u.updatedAt ? new Date(u.updatedAt).toISOString() : '',
    }));

    console.table(rows);
  } catch (err) {
    console.error('Error listing users:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
