import { test as base, APIRequestContext, request } from '@playwright/test';

/**
 * Custom fixtures extend Playwright's base `test` object.
 * Think of fixtures like Cypress's beforeEach — but they're reusable
 * and injected automatically into any test that declares them.
 */

type CustomFixtures = {
  // A pre-authenticated API context (reusable across API tests)
  apiContext: APIRequestContext;
};

export const test = base.extend<CustomFixtures>({
  // apiContext is set up before each test and torn down after
  apiContext: async ({}, use) => {
    const context = await request.newContext({
      baseURL: process.env.API_BASE_URL || 'https://your-api.com',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        // Add auth headers here, e.g.:
        // 'Authorization': `Bearer ${process.env.API_TOKEN}`,
      },
    });

    // Hand the context to the test
    await use(context);

    // Cleanup after the test finishes
    await context.dispose();
  },
});

// Re-export expect so tests only need to import from this file
export { expect } from '@playwright/test';
