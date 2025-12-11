import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import * as Prisma from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
  const prisma = new Prisma.PrismaClient({ adapter });

  await prisma.$connect();

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
};

export default fp(prismaPlugin);
