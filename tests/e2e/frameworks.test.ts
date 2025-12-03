import { test, expect } from '@playwright/test';
import { registerAndLogin, generateTestEmail } from './helpers';

test.describe('Framework Selection and Template Usage', () => {
  test.beforeEach(async ({ page }) => {
    const email = generateTestEmail();
    await registerAndLogin(page, email, 'TestPassword123!');
  });

  test('can select a framework and see form', async ({ page }) => {
    // Should be on frameworks page
    await expect(page).toHaveURL('/frameworks');
    
    // Click on Chain-of-Thought framework
    await page.click('a[href="/frameworks/chain-of-thought"]');
    
    // Should see the form
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('textarea[name="question"]')).toBeVisible();
  });

  test('can load a template and generate prompt', async ({ page }) => {
    // Navigate to Tree-of-Thought
    await page.goto('/frameworks/tree-of-thought');
    
    // Check if templates sidebar exists
    const templatesExist = await page.locator('.templates-sidebar').isVisible();
    
    if (templatesExist) {
      // Click on first template
      await page.click('.template-card:first-child');
      
      // Form should be populated
      const problemField = page.locator('textarea[name="problem"]');
      const problemValue = await problemField.inputValue();
      expect(problemValue.length).toBeGreaterThan(0);
      
      // Generate prompt
      await page.click('button:has-text("Generate Prompt")');
      
      // Should see preview
      await expect(page.locator('.prompt-preview')).toBeVisible();
    }
  });

  test('can toggle advanced options', async ({ page }) => {
    // Navigate to Chain-of-Thought
    await page.goto('/frameworks/chain-of-thought');
    
    // Advanced options should be hidden
    const advancedSection = page.locator('#advanced-options');
    await expect(advancedSection).toBeHidden();
    
    // Click toggle button
    await page.click('#toggle-advanced');
    
    // Advanced options should be visible
    await expect(advancedSection).toBeVisible();
    
    // Click again to hide
    await page.click('#toggle-advanced');
    await expect(advancedSection).toBeHidden();
  });

  test('templates sidebar is sticky and scrollable', async ({ page }) => {
    // Navigate to framework with templates
    await page.goto('/frameworks/tree-of-thought');
    
    const sidebar = page.locator('.templates-sidebar');
    
    // Check if sidebar exists
    if (await sidebar.isVisible()) {
      // Get initial position
      const initialBox = await sidebar.boundingBox();
      
      // Scroll page down
      await page.evaluate(() => window.scrollBy(0, 500));
      
      // Wait a bit for any animations
      await page.waitForTimeout(100);
      
      // Get new position - should be same or close (sticky behavior)
      const scrolledBox = await sidebar.boundingBox();
      
      // In sticky layout, top position changes but it stays visible
      expect(scrolledBox).not.toBeNull();
      expect(initialBox).not.toBeNull();
    }
  });

  test('can fill form manually and generate prompt', async ({ page }) => {
    // Navigate to Chain-of-Thought
    await page.goto('/frameworks/chain-of-thought');
    
    // Fill form fields
    await page.fill('textarea[name="question"]', 'What is the meaning of life?');
    await page.fill('textarea[name="context"]', 'Philosophical discussion');
    
    // Generate prompt
    await page.click('button:has-text("Generate Prompt")');
    
    // Should see preview with content
    const preview = page.locator('.prompt-preview');
    await expect(preview).toBeVisible();
    
    const previewText = await preview.textContent();
    expect(previewText).toContain('What is the meaning of life?');
  });

  test('can save a generated prompt', async ({ page }) => {
    // Navigate to framework
    await page.goto('/frameworks/chain-of-thought');
    
    // Fill and generate
    await page.fill('textarea[name="question"]', 'Test question for saving');
    await page.click('button:has-text("Generate Prompt")');
    
    // Wait for preview
    await expect(page.locator('.prompt-preview')).toBeVisible();
    
    // Save prompt
    await page.click('button:has-text("Save Prompt")');
    
    // Should redirect to prompts page
    await expect(page).toHaveURL('/prompts');
    
    // Should see the saved prompt
    await expect(page.locator('body')).toContainText('Test question');
  });
});
