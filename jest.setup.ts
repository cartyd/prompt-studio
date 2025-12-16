import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Polyfills for TextEncoder and TextDecoder (required by Prisma/cuid2)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}

// Mock localStorage for better-sqlite3 adapter
class LocalStorageMock implements Storage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

if (typeof global.localStorage === 'undefined') {
  (global as any).localStorage = new LocalStorageMock();
}

// Set test environment
process.env.NODE_ENV = 'test';
