import { test, expect } from '@playwright/test';
import { generateTestEmail } from './helpers';

test.describe('Authentication Flow', () => {
  test('can register a new user', async ({ page }) => {
    const email = generateTestEmail();
    
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Should redirect to frameworks page
    await expect(page).toHaveURL('/frameworks');
    
    // Should see user avatar
    await expect(page.locator('#avatar-wrapper')).toBeVisible();
  });

  test('shows error for invalid email', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Check for browser validation error (HTML5 validation)
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveJSProperty('validity.valid', false);
    
    // Verify we're still on the register page (form didn't submit)
    await expect(page).toHaveURL('/auth/register');
  });

  test('shows error for weak password', async ({ page }) => {
    const email = generateTestEmail();
    
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    // Use password that passes HTML5 minlength but fails server validation
    await page.fill('input[name="password"]', 'weakpass');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.error')).toContainText('Password');
  });

  test('can login with existing user', async ({ page }) => {
    // First register
    const email = generateTestEmail();
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/frameworks');
    
    // Logout
    await page.click('#avatar-wrapper');
    await page.click('button:has-text("Logout")');
    await page.waitForURL('/');
    
    // Login again
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Should redirect to frameworks
    await expect(page).toHaveURL('/frameworks');
    await expect(page.locator('#avatar-wrapper')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.error')).toContainText('Invalid');
  });

  test('can logout successfully', async ({ page }) => {
    const email = generateTestEmail();
    
    // Register
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/frameworks');
    
    // Logout
    await page.click('#avatar-wrapper');
    await page.click('button:has-text("Logout")');
    
    // Should redirect to homepage
    await expect(page).toHaveURL('/');
    
    // Should not see avatar
    await expect(page.locator('#avatar-wrapper')).not.toBeVisible();
  });
});
