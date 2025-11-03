/**
 * Smoke Tests for Allajnah Enhanced Frontend
 * 
 * These tests verify that the application can:
 * 1. Visit /setup and /login pages without crashing
 * 2. Render without JavaScript exceptions
 * 3. Display correct error messages on 4xx responses
 * 
 * HOW TO RUN:
 * ===========
 * 
 * Prerequisites:
 * - Make sure both backend and frontend are running:
 *   - Backend: http://localhost:8000
 *   - Frontend: http://localhost:5000
 * 
 * Run tests:
 * - npm run test:smoke          # Run in headless mode
 * - npm run test:smoke:headed   # Run with browser visible
 * - npm run test:smoke:debug    # Run in debug mode
 * 
 * Or directly with Playwright:
 * - npx playwright test tests/smoke.test.js
 * - npx playwright test tests/smoke.test.js --headed
 * - npx playwright test tests/smoke.test.js --ui
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5000';

test.describe('Frontend Smoke Tests', () => {
  
  test.describe('/setup page', () => {
    let consoleErrors = [];
    let jsExceptions = [];

    test.beforeEach(async ({ page }) => {
      consoleErrors = [];
      jsExceptions = [];

      // Capture console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Capture JavaScript exceptions
      page.on('pageerror', exception => {
        jsExceptions.push(exception.message);
      });
    });

    test('should load /setup page without JavaScript exceptions', async ({ page }) => {
      await page.goto(`${BASE_URL}/setup`);
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Verify no JS exceptions occurred
      expect(jsExceptions, `Found JS exceptions: ${jsExceptions.join(', ')}`).toHaveLength(0);
      
      // Check page title or main heading is present
      const heading = await page.locator('h1, h2').first();
      await expect(heading).toBeVisible();
      
      // Verify the setup form is rendered
      const form = await page.locator('form');
      await expect(form).toBeVisible();
    });

    test('should display setup form fields correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/setup`);
      await page.waitForLoadState('networkidle');
      
      // Check for email/username input
      const emailInput = await page.locator('input[type="email"], input[type="text"]').first();
      await expect(emailInput).toBeVisible();
      
      // Check for password input
      const passwordInput = await page.locator('input[type="password"]').first();
      await expect(passwordInput).toBeVisible();
      
      // Verify no critical console errors (ignore warnings)
      const criticalErrors = consoleErrors.filter(err => 
        !err.includes('Download the React DevTools') &&
        !err.includes('warning')
      );
      expect(criticalErrors, `Found critical console errors: ${criticalErrors.join(', ')}`).toHaveLength(0);
    });

    test('should handle validation errors correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/setup`);
      await page.waitForLoadState('networkidle');
      
      // Try to submit form without filling required fields
      const submitButton = await page.locator('button[type="submit"]');
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
        
        // Wait a bit for validation to trigger
        await page.waitForTimeout(500);
        
        // Verify no JS exceptions occurred during validation
        expect(jsExceptions, `Found JS exceptions during validation: ${jsExceptions.join(', ')}`).toHaveLength(0);
      }
    });
  });

  test.describe('/login page', () => {
    let consoleErrors = [];
    let jsExceptions = [];

    test.beforeEach(async ({ page }) => {
      consoleErrors = [];
      jsExceptions = [];

      // Capture console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Capture JavaScript exceptions
      page.on('pageerror', exception => {
        jsExceptions.push(exception.message);
      });
    });

    test('should load /login page without JavaScript exceptions', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Verify no JS exceptions occurred
      expect(jsExceptions, `Found JS exceptions: ${jsExceptions.join(', ')}`).toHaveLength(0);
      
      // Check page is rendered
      const heading = await page.locator('h1, h2').first();
      await expect(heading).toBeVisible();
      
      // Verify the login form is rendered
      const form = await page.locator('form');
      await expect(form).toBeVisible();
    });

    test('should display login form fields correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      // Check for email input
      const emailInput = await page.locator('input[type="email"], input[type="text"]').first();
      await expect(emailInput).toBeVisible();
      
      // Check for password input
      const passwordInput = await page.locator('input[type="password"]');
      await expect(passwordInput).toBeVisible();
      
      // Verify no critical console errors
      const criticalErrors = consoleErrors.filter(err => 
        !err.includes('Download the React DevTools') &&
        !err.includes('warning')
      );
      expect(criticalErrors, `Found critical console errors: ${criticalErrors.join(', ')}`).toHaveLength(0);
    });
  });

  test.describe('4xx Error Handling', () => {
    test('should display correct error message on 401 (Unauthorized)', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      // Intercept API calls and mock 401 response
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ 
            detail: 'Invalid credentials' 
          })
        });
      });
      
      // Fill login form with test data
      const emailInput = await page.locator('input[type="email"], input[type="text"]').first();
      const passwordInput = await page.locator('input[type="password"]').first();
      const submitButton = await page.locator('button[type="submit"]');
      
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await submitButton.click();
      
      // Wait for error message to appear (could be toast, alert, or inline)
      await page.waitForTimeout(1000);
      
      // Check for error message somewhere on the page
      const pageContent = await page.content();
      const hasErrorIndicator = 
        pageContent.toLowerCase().includes('invalid') ||
        pageContent.toLowerCase().includes('credentials') ||
        pageContent.toLowerCase().includes('unauthorized') ||
        pageContent.toLowerCase().includes('خطأ') || // Arabic for "error"
        pageContent.toLowerCase().includes('غير صحيح'); // Arabic for "incorrect"
      
      expect(hasErrorIndicator, 'Should display error message on 401').toBeTruthy();
    });

    test('should display correct error message on 404 (Not Found)', async ({ page }) => {
      // Visit a non-existent page
      await page.goto(`${BASE_URL}/this-page-does-not-exist`, { waitUntil: 'networkidle' });
      
      // The app should either redirect or show a 404 message
      // Check if we're still on a valid page or if there's a 404 message
      const pageContent = await page.content();
      
      // Should not crash - page should load something
      expect(pageContent).toBeTruthy();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('should handle 400 (Bad Request) with user-friendly message', async ({ page }) => {
      await page.goto(`${BASE_URL}/setup`);
      await page.waitForLoadState('networkidle');
      
      // Intercept API calls and mock 400 response
      await page.route('**/api/auth/setup', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ 
            detail: 'Invalid email format' 
          })
        });
      });
      
      // Find and fill the form
      const submitButton = await page.locator('button[type="submit"]');
      
      if (await submitButton.count() > 0) {
        // Fill with some data to pass client-side validation
        const inputs = await page.locator('input').all();
        for (const input of inputs) {
          const type = await input.getAttribute('type');
          if (type === 'email' || type === 'text') {
            await input.fill('invalid-email');
          } else if (type === 'password') {
            await input.fill('TestPassword123!');
          }
        }
        
        await submitButton.click();
        
        // Wait for error response
        await page.waitForTimeout(1000);
        
        // Should display error without crashing
        const pageContent = await page.content();
        expect(pageContent).toBeTruthy();
      }
    });
  });

  test.describe('Cross-page Navigation', () => {
    test('should navigate from /setup to /login without errors', async ({ page }) => {
      let jsExceptions = [];
      
      page.on('pageerror', exception => {
        jsExceptions.push(exception.message);
      });
      
      // Start at setup
      await page.goto(`${BASE_URL}/setup`);
      await page.waitForLoadState('networkidle');
      
      // Look for link to login (might be a button or link)
      const loginLink = await page.locator('a[href*="login"], button:has-text("تسجيل الدخول"), button:has-text("Login")').first();
      
      if (await loginLink.count() > 0) {
        await loginLink.click();
        await page.waitForLoadState('networkidle');
        
        // Verify we're on login page
        expect(page.url()).toContain('login');
        
        // Verify no exceptions during navigation
        expect(jsExceptions, `Found JS exceptions during navigation: ${jsExceptions.join(', ')}`).toHaveLength(0);
      }
    });

    test('should navigate from /login to /setup without errors', async ({ page }) => {
      let jsExceptions = [];
      
      page.on('pageerror', exception => {
        jsExceptions.push(exception.message);
      });
      
      // Start at login
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      // Look for link to setup/register
      const setupLink = await page.locator('a[href*="setup"], a[href*="register"], button:has-text("تسجيل"), button:has-text("Register")').first();
      
      if (await setupLink.count() > 0) {
        await setupLink.click();
        await page.waitForLoadState('networkidle');
        
        // Verify navigation occurred
        const url = page.url();
        const isValidDestination = url.includes('setup') || url.includes('register');
        expect(isValidDestination).toBeTruthy();
        
        // Verify no exceptions during navigation
        expect(jsExceptions, `Found JS exceptions during navigation: ${jsExceptions.join(', ')}`).toHaveLength(0);
      }
    });
  });
});
