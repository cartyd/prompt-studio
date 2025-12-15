import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = path.join(__dirname, '../test.db');

export async function setupTestDatabase() {
  // Remove existing test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  // Set test database URL
  process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

  // Run migrations to create tables
  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: `file:${TEST_DB_PATH}` },
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Failed to run migrations:', error);
    throw error;
  }
}

export async function teardownTestDatabase() {
  // Remove test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}
