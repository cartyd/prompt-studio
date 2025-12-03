import { Page } from '@playwright/test';

/**
 * Helper to register and login a test user
 */
export async function registerAndLogin(page: Page, email: string, password: string, name: string = 'Test User') {
  // Register user
  await page.goto('/auth/register');
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Should redirect to frameworks page
  await page.waitForURL('/frameworks');
}

/**
 * Helper to login an existing user
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Should redirect to frameworks page
  await page.waitForURL('/frameworks');
}

/**
 * Helper to generate unique test email
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}
