import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Directory where tests live
  testDir: './tests',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if test.only() was accidentally left in
  forbidOnly: !!process.env.CI,

  // Retry failed tests once on CI, no retries locally
  retries: process.env.CI ? 1 : 0,

  // Number of parallel workers (adjust based on your machine)
  workers: process.env.CI ? 2 : 4,

  // Reporter: HTML report saved to playwright-report/
  reporter: [['html', { open: 'never' }]],

  // Global settings applied to all tests
  use: {
    // Base URL for the practice site
    baseURL: process.env.BASE_URL || 'https://practice.expandtesting.com',

    // Capture screenshot only on failure
    screenshot: 'only-on-failure',

    // Record video only on failure
    video: 'retain-on-failure',

    // Collect trace on first retry (useful for debugging CI failures)
    trace: 'on-first-retry',
  },

  projects: [
    // --- Desktop Browsers ---
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // --- Mobile Viewports ---
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    // mobile-safari disabled — practice site times out consistently on WebKit mobile
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 13'] },
    // },

    // --- API Tests (no browser needed) ---
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        // API tests don't need a browser context
        baseURL: process.env.API_BASE_URL || 'https://practice.expandtesting.com/api',
      },
    },
  ],
});
