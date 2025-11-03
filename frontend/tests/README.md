# Frontend Smoke Tests

## Overview

This directory contains smoke tests for the Allajnah Enhanced frontend application using Playwright.

## What the Tests Cover

The smoke tests verify:

1. **Page Loading**: `/setup` and `/login` pages load without JavaScript exceptions
2. **No JS Errors**: Console is free of critical JavaScript errors
3. **Form Rendering**: Required form elements are visible and functional
4. **Error Handling**: Application displays user-friendly messages on 4xx HTTP errors:
   - 401 Unauthorized
   - 400 Bad Request
   - 404 Not Found
5. **Navigation**: Cross-page navigation works without errors

## Prerequisites

Before running tests, ensure:

1. **Backend is running** on `http://localhost:8000`
   ```bash
   cd backend
   uv run uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. **Frontend is running** on `http://localhost:5000`
   ```bash
   cd frontend
   npm run dev
   ```

3. **Playwright browsers are installed**
   ```bash
   npx playwright install chromium
   ```

## Running the Tests

### Quick Start

```bash
# Run all smoke tests (headless)
npm run test:smoke

# Run with browser visible
npm run test:smoke:headed

# Run in debug mode (step through tests)
npm run test:smoke:debug
```

### Using Playwright CLI

```bash
# Run all tests
npx playwright test tests/smoke.test.js

# Run with UI mode (interactive)
npx playwright test tests/smoke.test.js --ui

# Run specific test
npx playwright test tests/smoke.test.js -g "should load /setup"

# Show test report
npx playwright show-report
```

## Test Structure

```
tests/
├── smoke.test.js          # Main smoke test file
└── README.md             # This file
```

## Expected Output

Successful test run:
```
Running 11 tests using 1 worker

  ✓ [chromium] › smoke.test.js:28:5 › /setup page › should load /setup page
  ✓ [chromium] › smoke.test.js:46:5 › /setup page › should display setup form
  ✓ [chromium] › smoke.test.js:80:5 › /login page › should load /login page
  ✓ [chromium] › smoke.test.js:101:5 › /login page › should display login form
  ✓ [chromium] › smoke.test.js:125:5 › 4xx Error Handling › 401 error
  ... and more

  11 passed (15.2s)
```

## Troubleshooting

### Tests Fail with "Connection Refused"

**Problem**: Cannot connect to `http://localhost:5000`

**Solution**: Ensure frontend dev server is running:
```bash
cd frontend
npm run dev
```

### Tests Fail with "Timeout"

**Problem**: Page takes too long to load

**Solution**: 
- Check if backend is running and responding
- Check network/console in browser for errors
- Increase timeout in test if needed

### Browser Dependencies Missing

**Problem**: Playwright warns about missing system dependencies

**Solution**: This is expected in Replit environment. Tests will run in headless mode.

## CI/CD Integration

To run tests in CI:

```yaml
- name: Install dependencies
  run: cd frontend && npm ci

- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run smoke tests
  run: npm run test:smoke
```

## Adding New Tests

To add new smoke tests:

1. Open `tests/smoke.test.js`
2. Add a new `test()` block in the appropriate `test.describe()` group
3. Follow the existing pattern for error tracking:
   ```javascript
   test('my new test', async ({ page }) => {
     // Your test code
   });
   ```

## Documentation

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Writing Tests](https://playwright.dev/docs/writing-tests)

## Support

For issues or questions:
1. Check the Playwright docs
2. Review test output and screenshots in `test-results/`
3. Run with `--debug` flag to step through tests
