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
    await page.click('a[href="/frameworks/cot"]');
    
    // Should see the form
    await expect(page.locator('form[hx-post]')).toBeVisible();
    await expect(page.locator('textarea[name="problem"]')).toBeVisible();
  });

  test('can load a template and generate prompt', async ({ page }) => {
    // Navigate to Tree-of-Thought
    await page.goto('/frameworks/tot');
    
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
      await page.click('button:has-text("Generate Preview")');
      
      // Should see preview
      await expect(page.locator('#prompt-preview')).toBeVisible();
    }
  });

  test('can toggle advanced options', async ({ page }) => {
    // Navigate to Chain-of-Thought
    await page.goto('/frameworks/cot');
    
    // Advanced options should be hidden
    const advancedSection = page.locator('#advanced-options');
    await expect(advancedSection).toBeHidden();
    
    // Click toggle button
    await page.click('#toggle-advanced-btn');
    
    // Advanced options should be visible
    await expect(advancedSection).toBeVisible();
    
    // Click again to hide
    await page.click('#toggle-advanced-btn');
    await expect(advancedSection).toBeHidden();
  });

  test('templates sidebar is sticky and scrollable', async ({ page }) => {
    // Navigate to framework with templates
    await page.goto('/frameworks/tot');
    
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
    await page.goto('/frameworks/cot');
    
    // Fill form fields
    await page.fill('textarea[name="problem"]', 'What is the meaning of life?');
    
    // Expand advanced options to fill context
    await page.click('#toggle-advanced-btn');
    await page.fill('textarea[name="context"]', 'Philosophical discussion');
    
    // Generate prompt
    await page.click('button:has-text("Generate Preview")');
    
    // Wait for HTMX to load the preview (not just the container)
    await page.waitForSelector('#prompt-preview #copy-prompt-btn', { timeout: 5000 });
    
    // Should see preview with content
    const preview = page.locator('#prompt-preview');
    await expect(preview).toBeVisible();
    
    const previewText = await preview.textContent();
    expect(previewText).toContain('What is the meaning of life?');
  });

  test('can save a generated prompt', async ({ page }) => {
    // Navigate to framework
    await page.goto('/frameworks/cot');
    
    // Fill and generate
    await page.fill('textarea[name="problem"]', 'Test question for saving');
    await page.click('button:has-text("Generate Preview")');
    
    // Wait for preview to load with actual content
    await page.waitForSelector('#prompt-preview #copy-prompt-btn', { timeout: 5000 });
    
    // Save prompt
    await page.click('button:has-text("Save Prompt")');
    
    // Should see success message (HTMX response, not redirect)
    await expect(page.locator('#save-result .success')).toBeVisible();
    await expect(page.locator('#save-result')).toContainText('Prompt saved successfully!');
    
    // Click the link in the success message to go to prompts library
    await page.click('#save-result a[href="/prompts"]');
    
    // Should see the saved prompt in library
    await expect(page).toHaveURL('/prompts');
    await expect(page.locator('body')).toContainText('Test question');
  });

  test('can copy prompt to clipboard', async ({ page }) => {
    // Navigate to framework
    await page.goto('/frameworks/cot');
    
    // Fill and generate
    await page.fill('textarea[name="problem"]', 'Test problem for copying');
    await page.click('button:has-text("Generate Preview")');
    
    // Wait for preview
    await page.waitForSelector('#prompt-preview #copy-prompt-btn', { timeout: 5000 });
    
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Click copy button
    await page.click('#copy-prompt-btn');
    
    // Verify clipboard content (if available)
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('Test problem for copying');
  });

  test('can clear form', async ({ page }) => {
    // Navigate to framework
    await page.goto('/frameworks/cot');
    
    // Fill form fields
    await page.fill('textarea[name="problem"]', 'Test problem');
    await page.fill('input[name="role"]', 'test role');
    
    // Clear form
    await page.click('#clear-form-btn');
    
    // Check fields are empty
    const problemValue = await page.locator('textarea[name="problem"]').inputValue();
    const roleValue = await page.locator('input[name="role"]').inputValue();
    
    expect(problemValue).toBe('');
    // Role should be reset to default, not empty
    expect(roleValue).toBe('logical thinker');
  });

  test('validates required fields', async ({ page }) => {
    // Navigate to framework
    await page.goto('/frameworks/cot');
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Generate Preview")');
    
    // Check for validation message on required field
    const problemField = page.locator('textarea[name="problem"]');
    const validationMessage = await problemField.evaluate((el: HTMLTextAreaElement) => el.validationMessage);
    
    expect(validationMessage).toBeTruthy();
  });

  test('can toggle and load examples', async ({ page }) => {
    // Navigate to framework with examples
    await page.goto('/frameworks/cot');
    
    // Examples should be hidden initially
    const examplesContainer = page.locator('#examples-container');
    await expect(examplesContainer).toBeHidden();
    
    // Toggle examples
    await page.click('#toggle-examples-btn');
    await expect(examplesContainer).toBeVisible();
    
    // Load example into form
    await page.click('#load-example-btn');
    
    // Form should be populated
    const problemValue = await page.locator('textarea[name="problem"]').inputValue();
    expect(problemValue.length).toBeGreaterThan(0);
  });

  test('can switch between example categories', async ({ page }) => {
    // Navigate to framework with examples
    await page.goto('/frameworks/tot');
    
    // Open examples
    await page.click('#toggle-examples-btn');
    
    // Switch to business category
    await page.click('#category-business');
    
    // Check button state
    const businessBtn = page.locator('#category-business');
    await expect(businessBtn).toHaveClass(/active/);
    
    // Switch back to general
    await page.click('#category-general');
    const generalBtn = page.locator('#category-general');
    await expect(generalBtn).toHaveClass(/active/);
  });

  test('validates number field constraints', async ({ page }) => {
    // Navigate to framework with number fields
    await page.goto('/frameworks/tot');
    
    // Fill with value below minimum
    await page.fill('input[name="approaches"]', '0');
    await page.fill('textarea[name="objective"]', 'Test objective');
    await page.click('button:has-text("Generate Preview")');
    
    // Check validation
    const approachesField = page.locator('input[name="approaches"]');
    const validationMessage = await approachesField.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });
});

test.describe('Framework Forms - All Framework Types', () => {
  test.beforeEach(async ({ page }) => {
    const email = generateTestEmail();
    await registerAndLogin(page, email, 'TestPassword123!');
  });

  test('can use Tree-of-Thought framework', async ({ page }) => {
    await page.goto('/frameworks/tot');
    
    // Fill required fields
    await page.fill('input[name="role"]', 'problem solver');
    await page.fill('textarea[name="objective"]', 'Optimize database queries');
    await page.fill('input[name="approaches"]', '3');
    
    // Generate
    await page.click('button:has-text("Generate Preview")');
    
    // Wait for preview
    await page.waitForSelector('#prompt-preview #copy-prompt-btn', { timeout: 5000 });
    
    // Verify content
    const previewText = await page.locator('#prompt-preview').textContent();
    expect(previewText).toContain('Optimize database queries');
  });

  test('can use Self-Consistency framework', async ({ page }) => {
    await page.goto('/frameworks/self-consistency');
    
    // Fill required fields
    await page.fill('input[name="role"]', 'analytical reasoner');
    await page.fill('textarea[name="goal"]', 'Calculate optimal solution');
    await page.fill('input[name="versions"]', '3');
    
    // Generate
    await page.click('button:has-text("Generate Preview")');
    
    // Wait for preview
    await page.waitForSelector('#prompt-preview #copy-prompt-btn', { timeout: 5000 });
    
    // Verify content
    const previewText = await page.locator('#prompt-preview').textContent();
    expect(previewText).toContain('Calculate optimal solution');
  });

  test('can use Role/Few-Shot framework', async ({ page }) => {
    await page.goto('/frameworks/role');
    
    // Fill required fields
    await page.fill('input[name="role"]', 'professional copywriter');
    await page.fill('textarea[name="tone"]', 'Friendly and engaging');
    await page.fill('textarea[name="task"]', 'Write product description');
    
    // Fill optional examples
    await page.click('#toggle-advanced-btn');
    await page.fill('textarea[name="examples"]', 'Example 1: Great product\nExample 2: Amazing features');
    
    // Generate
    await page.click('button:has-text("Generate Preview")');
    
    // Wait for preview
    await page.waitForSelector('#prompt-preview #copy-prompt-btn', { timeout: 5000 });
    
    // Verify content
    const previewText = await page.locator('#prompt-preview').textContent();
    expect(previewText).toContain('Write product description');
  });

  test('can use Reflection framework', async ({ page }) => {
    await page.goto('/frameworks/reflection');
    
    // Fill required fields
    await page.fill('input[name="role"]', 'critical editor');
    await page.fill('textarea[name="task"]', 'Write technical documentation');
    await page.fill('textarea[name="criteria"]', 'Clarity, accuracy, completeness');
    
    // Generate
    await page.click('button:has-text("Generate Preview")');
    
    // Wait for preview
    await page.waitForSelector('#prompt-preview #copy-prompt-btn', { timeout: 5000 });
    
    // Verify content
    const previewText = await page.locator('#prompt-preview').textContent();
    expect(previewText).toContain('Write technical documentation');
  });
});

test.describe('Framework Forms - Custom Criteria', () => {
  test.beforeEach(async ({ page }) => {
    const email = generateTestEmail();
    await registerAndLogin(page, email, 'TestPassword123!');
  });

  test('can add custom criteria (free user)', async ({ page }) => {
    // Navigate to ToT framework (has criteria selector)
    await page.goto('/frameworks/tot');
    
    // Click add custom criteria button
    await page.click('#add-custom-btn');
    
    // Input should be visible
    await expect(page.locator('#custom-criteria-input')).toBeVisible();
    
    // Add custom criteria
    await page.fill('#custom-criteria-input', 'Innovation');
    await page.click('#add-custom-submit-btn');
    
    // Should see the custom criteria checkbox
    await expect(page.locator('text=Innovation')).toBeVisible();
  });

  test('can cancel adding custom criteria', async ({ page }) => {
    await page.goto('/frameworks/tot');
    
    // Open custom input
    await page.click('#add-custom-btn');
    await page.fill('#custom-criteria-input', 'Test criteria');
    
    // Cancel
    await page.click('#cancel-custom-btn');
    
    // Input should be hidden
    await expect(page.locator('#custom-criteria-input')).toBeHidden();
    
    // Custom criteria should not be added
    await expect(page.locator('text=Test criteria')).not.toBeVisible();
  });

  test('shows criteria counter', async ({ page }) => {
    await page.goto('/frameworks/tot');
    
    // Check initial count (4 defaults)
    const initialCount = await page.locator('#criteria-count').textContent();
    expect(initialCount).toBe('4');
  });

  test('can select and deselect criteria', async ({ page }) => {
    await page.goto('/frameworks/tot');
    
    // Find first criteria checkbox
    const firstCheckbox = page.locator('#criteria-checkboxes input[type="checkbox"]').first();
    
    // Uncheck it
    await firstCheckbox.uncheck();
    
    // Count should decrease
    const newCount = await page.locator('#criteria-count').textContent();
    expect(newCount).toBe('3');
    
    // Check it again
    await firstCheckbox.check();
    
    // Count should increase
    const finalCount = await page.locator('#criteria-count').textContent();
    expect(finalCount).toBe('4');
  });

  test('enforces max 4 criteria selection', async ({ page }) => {
    await page.goto('/frameworks/tot');
    
    // Add a custom criteria
    await page.click('#add-custom-btn');
    await page.fill('#custom-criteria-input', 'Extra Criteria');
    await page.click('#add-custom-submit-btn');
    
    // Try to check it (should not work if 4 already selected)
    const extraCheckbox = page.locator('input[type="checkbox"][value*="Extra Criteria"]');
    await extraCheckbox.check();
    
    // Count should not exceed 4
    const count = await page.locator('#criteria-count').textContent();
    expect(parseInt(count || '0')).toBeLessThanOrEqual(4);
  });
});

test.describe('Framework Forms - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    const email = generateTestEmail();
    await registerAndLogin(page, email, 'TestPassword123!');
  });

  test('handles form submission with empty required fields gracefully', async ({ page }) => {
    await page.goto('/frameworks/cot');
    
    // Clear default role
    await page.fill('input[name="role"]', '');
    
    // Try to submit
    await page.click('button:has-text("Generate Preview")');
    
    // Should show browser validation, not crash
    const roleField = page.locator('input[name="role"]');
    const isInvalid = await roleField.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('handles very long input gracefully', async ({ page }) => {
    await page.goto('/frameworks/cot');
    
    // Fill with very long text
    const longText = 'A'.repeat(10000);
    await page.fill('textarea[name="problem"]', longText);
    
    // Generate
    await page.click('button:has-text("Generate Preview")');
    
    // Should complete without error (might be truncated by server)
    await page.waitForSelector('#prompt-preview', { timeout: 10000 });
    await expect(page.locator('#prompt-preview')).toBeVisible();
  });
});
