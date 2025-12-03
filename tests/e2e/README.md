# End-to-End (E2E) Tests

This directory contains browser-based E2E tests using [Playwright](https://playwright.dev/).

## Purpose

E2E tests verify critical user flows and UI interactions that unit tests cannot catch, such as:
- CSS issues affecting element visibility
- JavaScript event handlers and DOM manipulation
- Multi-step user workflows
- Browser-specific behavior

## Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run with visible browser (headed mode)
npm run test:e2e:headed

# Run both unit and E2E tests
npm run test:all
```

## Test Files

- **`auth.test.ts`** - Authentication flows (register, login, logout, validation)
- **`dropdown.test.ts`** - Avatar dropdown menu behavior (the bug we fixed!)
- **`frameworks.test.ts`** - Framework selection, template usage, prompt generation
- **`helpers.ts`** - Shared test utilities

## Key Features

### Automatic Server Management
Playwright automatically starts the dev server before running tests and stops it after. No manual setup needed.

### Test Isolation
Each test registers a unique user to avoid conflicts and ensure clean state.

### Real Browser Testing
Tests run in Chromium (can add Firefox/Safari in `playwright.config.ts`), catching real-world issues.

## Writing New Tests

```typescript
import { test, expect } from '@playwright/test';
import { registerAndLogin, generateTestEmail } from './helpers';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: register and login
    const email = generateTestEmail();
    await registerAndLogin(page, email, 'TestPassword123!');
  });

  test('does something useful', async ({ page }) => {
    // Navigate
    await page.goto('/some-page');
    
    // Interact
    await page.click('#some-button');
    
    // Assert
    await expect(page.locator('#result')).toContainText('expected text');
  });
});
```

## Best Practices

1. **Test user-facing behavior**, not implementation details
2. **Use semantic selectors** (IDs, data-testid, meaningful text) over CSS classes
3. **Wait for visibility** with `await expect(...).toBeVisible()` before interacting
4. **Keep tests independent** - don't rely on execution order
5. **Test critical paths first** - focus on flows that break the app if they fail

## Debugging

```bash
# Open Playwright Inspector
npm run test:e2e:headed -- --debug

# Generate trace on failure (view in UI mode)
npm run test:e2e:ui
```

## CI/CD Integration

Tests are configured to run in CI with retries (see `playwright.config.ts`):
- 2 retries on failure
- Single worker (sequential execution)
- HTML report generated

## Coverage

Current E2E test coverage:
- ✅ User registration with validation
- ✅ Login/logout flows
- ✅ Avatar dropdown menu (CSS visibility bug)
- ✅ Framework selection
- ✅ Template loading and form population
- ✅ Advanced options toggle
- ✅ Prompt generation and saving

## Future Additions

Consider adding tests for:
- Premium subscription flows
- Prompt editing and deletion
- Custom criteria functionality
- Mobile responsive behavior
- Accessibility (keyboard navigation, screen readers)
