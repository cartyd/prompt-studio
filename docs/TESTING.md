# Testing Guide

This project uses two complementary testing approaches:

## Unit Tests (Jest)
**Location**: `tests/*.test.ts`  
**Run**: `npm test`

Fast, isolated tests for business logic:
- Authentication & validation
- Prompt generation algorithms
- Framework definitions
- Subscription logic
- Custom criteria
- Filename sanitization

**126 tests** covering core functionality

## E2E Tests (Playwright)
**Location**: `tests/e2e/*.test.ts`  
**Run**: `npm run test:e2e`

Browser-based tests for user flows and UI behavior:
- Authentication flows (register, login, logout)
- Avatar dropdown menu interactions
- Framework selection and template usage
- Prompt generation and saving
- Advanced options toggling

### Why E2E Tests?

E2E tests catch issues that unit tests miss:
- **CSS visibility bugs** (like the dropdown menu issue we fixed)
- **JavaScript event handlers** not firing correctly
- **Multi-step workflows** breaking between steps
- **Browser-specific behavior**

### Example: The Dropdown Bug

The avatar dropdown menu stopped working after code refactoring. Unit tests all passed, but the menu wouldn't appear when clicked.

**Root cause**: CSS had `display: none` on `.dropdown-menu`, which overrode the `hidden` attribute toggle.

**E2E test that would have caught it**:
```typescript
test('menu does not have display:none when visible', async ({ page }) => {
  await page.click('#avatar-btn');
  const displayStyle = await dropdown.evaluate((el) => 
    window.getComputedStyle(el).display
  );
  expect(displayStyle).not.toBe('none');
});
```

## Running Tests

```bash
# Unit tests only (fast - ~3s)
npm test

# E2E tests only (slower - starts server, runs browser)
npm run test:e2e

# Interactive E2E with UI (best for debugging)
npm run test:e2e:ui

# Watch mode for development
npm run test:watch

# Everything together
npm run test:all
```

## When to Write Each Type

### Write Unit Tests for:
- Business logic and algorithms
- Data validation and sanitization
- Error handling
- Pure functions
- Database queries

### Write E2E Tests for:
- Critical user flows (login, checkout, etc.)
- Complex UI interactions
- Features that unit tests can't verify (CSS, DOM events)
- Regressions that caused production bugs

## Best Practices

1. **Unit tests should be fast** - Mock external dependencies
2. **E2E tests should be focused** - Test complete user journeys
3. **Both should be deterministic** - No flaky tests
4. **Test behavior, not implementation** - Refactoring shouldn't break tests
5. **Meaningful names** - Test names should describe what's being tested

## CI/CD Integration

Both test suites run automatically on:
- Every commit (unit tests)
- Pull requests (unit + E2E tests)
- Before deployment

E2E tests are configured with retries for CI stability.

## Coverage

- **Unit tests**: 126 tests covering core business logic
- **E2E tests**: 18+ tests covering critical user flows

Combined, these provide confidence in:
- ✅ Code correctness
- ✅ User experience quality
- ✅ Regression prevention
