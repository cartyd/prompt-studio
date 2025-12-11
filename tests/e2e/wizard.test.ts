import { test, expect } from '@playwright/test';

test.describe('Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/auth/register');
    const timestamp = Date.now();
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/frameworks');
  });

  test('should display wizard welcome page', async ({ page }) => {
    await page.goto('/wizard');
    
    await expect(page.locator('h1')).toContainText('Perfect Prompting Framework');
    await expect(page.locator('text=How It Works')).toBeVisible();
    await expect(page.locator('text=Start the Wizard')).toBeVisible();
  });

  test('should complete full wizard flow and reach recommendation', async ({ page }) => {
    await page.goto('/wizard');
    
    // Start wizard
    await page.click('text=Start the Wizard');
    await page.waitForURL('/wizard/question/0');
    
    // Question 1
    await expect(page.locator('h1')).toContainText('What do you want to accomplish?');
    await page.click('label:has-text("Explore different ideas")');
    await page.click('button:has-text("Next")');
    await page.waitForURL('/wizard/question/1');
    
    // Question 2
    await expect(page.locator('h1')).toContainText('How complex is your task?');
    await page.click('label:has-text("Very complex")');
    await page.click('button:has-text("Next")');
    await page.waitForURL('/wizard/question/2');
    
    // Question 3
    await expect(page.locator('h1')).toContainText('What matters most to you?');
    await page.click('label:has-text("Exploring creative alternatives")');
    await page.click('button:has-text("Next")');
    await page.waitForURL('/wizard/question/3');
    
    // Question 4
    await expect(page.locator('h1')).toContainText('Do you have examples or existing content?');
    await page.click('label:has-text("No, starting from scratch")');
    await page.click('button:has-text("See Recommendation")');
    await page.waitForURL('/wizard/recommend');
    
    // Recommendation page
    await expect(page.locator('text=Perfect Match Found!')).toBeVisible();
    await expect(page.locator('text=Tree-of-Thought')).toBeVisible();
    await expect(page.locator('text=Why We Chose This for You')).toBeVisible();
  });

  test('should allow back navigation in wizard', async ({ page }) => {
    await page.goto('/wizard/question/0');
    
    // Answer first question
    await page.click('label:has-text("Explore different ideas")');
    await page.click('button:has-text("Next")');
    await page.waitForURL('/wizard/question/1');
    
    // Go back
    await page.click('text=Back');
    await page.waitForURL('/wizard/question/0');
    
    // Verify answer was preserved
    const selectedOption = page.locator('.wizard-option-card.selected');
    await expect(selectedOption).toContainText('Explore different ideas');
  });

  test('should show discover card on frameworks page', async ({ page }) => {
    await page.goto('/frameworks');
    
    const discoverCard = page.locator('.discover-card');
    await expect(discoverCard).toBeVisible();
    await expect(discoverCard).toContainText('Discover');
    await expect(discoverCard).toContainText('Find My Framework');
    await expect(discoverCard).toContainText('Recommended for beginners');
  });

  test('should navigate from recommendation to framework form', async ({ page }) => {
    // Complete wizard quickly
    await page.goto('/wizard/question/0');
    await page.click('label:has-text("Break down a complex problem")');
    await page.click('button:has-text("Next")');
    
    await page.click('label:has-text("Needs careful analysis")');
    await page.click('button:has-text("Next")');
    
    await page.click('label:has-text("Clarity and easy-to-follow")');
    await page.click('button:has-text("Next")');
    
    await page.click('label:has-text("No, starting from scratch")');
    await page.click('button:has-text("See Recommendation")');
    await page.waitForURL('/wizard/recommend');
    
    // Click through to framework
    await page.click('text=Start with');
    await expect(page.url()).toContain('/frameworks/');
    await expect(page.url()).toContain('fromWizard=true');
  });

  test('should show progress indicator', async ({ page }) => {
    await page.goto('/wizard/question/0');
    
    await expect(page.locator('text=Question 1 of 4')).toBeVisible();
    
    // Check progress bar exists
    const progressBar = page.locator('.wizard-progress-bar');
    await expect(progressBar).toBeVisible();
  });

  test('should validate required selection', async ({ page }) => {
    await page.goto('/wizard/question/0');
    
    // Try to proceed without selection
    await page.click('button:has-text("Next")');
    
    // Should stay on same page or show error
    await expect(page.url()).toContain('/wizard/question/0');
  });
});
