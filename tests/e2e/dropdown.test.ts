import { test, expect } from '@playwright/test';
import { registerAndLogin, generateTestEmail } from './helpers';

test.describe('Avatar Dropdown Menu', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login with unique user for each test
    const email = generateTestEmail();
    await registerAndLogin(page, email, 'TestPassword123!');
  });

  test('shows menu when avatar clicked', async ({ page }) => {
    const dropdown = page.locator('#dropdown-menu');
    const avatarBtn = page.locator('#avatar-wrapper');
    
    // Initially hidden
    await expect(dropdown).toBeHidden();
    
    // Click avatar
    await avatarBtn.click();
    
    // Menu appears and contains expected items
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toContainText('Frameworks');
    await expect(dropdown).toContainText('My Prompts');
    await expect(dropdown).toContainText('Logout');
  });

  test('toggles menu on multiple clicks', async ({ page }) => {
    const dropdown = page.locator('#dropdown-menu');
    const avatarBtn = page.locator('#avatar-wrapper');
    
    // Click to open
    await avatarBtn.click();
    await expect(dropdown).toBeVisible();
    
    // Click again to close (use force since dropdown may overlay avatar)
    await avatarBtn.click({ force: true });
    await expect(dropdown).toBeHidden();
    
    // Click again to open
    await avatarBtn.click();
    await expect(dropdown).toBeVisible();
  });

  test('hides menu when clicking outside', async ({ page }) => {
    const dropdown = page.locator('#dropdown-menu');
    const avatarBtn = page.locator('#avatar-wrapper');
    
    // Open menu
    await avatarBtn.click();
    await expect(dropdown).toBeVisible();
    
    // Click outside (on body)
    await page.click('body', { position: { x: 10, y: 10 } });
    await expect(dropdown).toBeHidden();
  });

  test('hides menu on Escape key', async ({ page }) => {
    const dropdown = page.locator('#dropdown-menu');
    const avatarBtn = page.locator('#avatar-wrapper');
    
    // Open menu
    await avatarBtn.click();
    await expect(dropdown).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    await expect(dropdown).toBeHidden();
  });

  test('menu does not have display:none when visible', async ({ page }) => {
    const dropdown = page.locator('#dropdown-menu');
    const avatarBtn = page.locator('#avatar-wrapper');
    
    // Open menu
    await avatarBtn.click();
    await expect(dropdown).toBeVisible();
    
    // Verify CSS does not have display: none
    const displayStyle = await dropdown.evaluate((el) => 
      window.getComputedStyle(el).display
    );
    expect(displayStyle).not.toBe('none');
  });

  test('navigation links work from dropdown', async ({ page }) => {
    const avatarBtn = page.locator('#avatar-wrapper');
    
    // Open menu
    await avatarBtn.click();
    
    // Click "Frameworks" link
    await page.click('#dropdown-menu a[href="/frameworks"]');
    await expect(page).toHaveURL('/frameworks');
    
    // Reopen menu
    await avatarBtn.click();
    
    // Click "My Prompts" link
    await page.click('#dropdown-menu a[href="/prompts"]');
    await expect(page).toHaveURL('/prompts');
  });
});
