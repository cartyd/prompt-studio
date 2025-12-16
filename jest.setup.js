// Polyfills for TextEncoder and TextDecoder (required by Prisma/cuid2)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock localStorage for better-sqlite3 adapter
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

if (typeof global.localStorage === 'undefined') {
  global.localStorage = new LocalStorageMock();
}

// Set test database URL
const path = require('path');
const TEST_DB_PATH = path.join(__dirname, 'test.db');
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;
process.env.NODE_ENV = 'test';

// Setup test database
const { execSync } = require('child_process');
const fs = require('fs');

// Remove existing test database
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}

// Create tables using prisma db push
try {
  execSync('npx prisma db push --schema=prisma/schema.prisma --accept-data-loss', {
    env: { ...process.env, DATABASE_URL: `file:${TEST_DB_PATH}` },
    stdio: 'pipe', // Suppress output unless there's an error
  });
  console.log('Test database initialized successfully');
} catch (error) {
  console.error('Failed to initialize test database:', error.message);
  // Don't throw here - let individual tests handle missing tables
}
