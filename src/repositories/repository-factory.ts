import { PrismaClient } from '@prisma/client';

/**
 * Repository Factory Pattern
 * 
 * Provides a central point for creating repository instances.
 * This abstraction layer helps reduce tight coupling to Prisma throughout the codebase.
 * 
 * Benefits:
 * - Single point of database client management
 * - Easier to mock for testing
 * - Can switch database implementations without changing routes
 * - Provides type-safe database access
 */

/**
 * Base repository interface
 * All repositories should implement common CRUD operations
 */
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(options?: any): Promise<T[]>;
  create(data: any): Promise<T>;
  update(id: string, data: any): Promise<T>;
  delete(id: string): Promise<void>;
  count(options?: any): Promise<number>;
}

/**
 * Repository Factory
 * Creates repository instances with the provided Prisma client
 */
export class RepositoryFactory {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get the underlying Prisma client
   * Use sparingly - prefer specific repository methods
   */
  getPrisma(): PrismaClient {
    return this.prisma;
  }

  /**
   * Get user repository
   */
  get users() {
    return this.prisma.user;
  }

  /**
   * Get prompt repository
   */
  get prompts() {
    return this.prisma.prompt;
  }

  /**
   * Get event repository
   */
  get events() {
    return this.prisma.event;
  }

  /**
   * Get custom criteria repository
   */
  get customCriteria() {
    return this.prisma.customCriteria;
  }

  /**
   * Get verification token repository
   */
  get verificationTokens() {
    return this.prisma.verificationToken;
  }

  /**
   * Execute raw queries (use sparingly)
   */
  async queryRaw<T>(query: any): Promise<T> {
    return await this.prisma.$queryRaw<T>(query);
  }

  /**
   * Transaction support
   */
  async transaction<T>(fn: (prisma: any) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(fn);
  }
}

/**
 * Create a repository factory from Fastify instance
 * This is a convenience function for use in routes
 */
export function createRepositoryFactory(prisma: PrismaClient): RepositoryFactory {
  return new RepositoryFactory(prisma);
}
