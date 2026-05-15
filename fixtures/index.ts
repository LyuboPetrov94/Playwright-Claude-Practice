import { test as base, APIRequestContext, request } from "@playwright/test";
import { UserService } from "../services/UserService";
import { randomEmail, randomString, randomUsername } from "../helpers/data";

/**
 * Custom fixtures extend Playwright's base `test` object.
 * Think of fixtures like Cypress's beforeEach — but they're reusable
 * and injected automatically into any test that declares them.
 */

/**
 * authedRequest — worker-scoped APIRequestContext pre-loaded with x-auth-token.
 *
 * Usage:
 *   test("...", async ({ authedRequest }) => {
 *     const users = new UserService(authedRequest);
 *     const res = await users.getProfile();
 *     expect(res.status()).toBe(200);
 *   });
 */

// Ad / analytics / consent-dialog hosts blocked on every page.
// Matches a real user with an ad blocker installed (~99% of users).
// Removes the layout-shift races the practice site's DoubleClick iframes
// cause in Firefox, and the Funding Choices consent dialog.
const BLOCKED_HOSTS = [
  "doubleclick.net",
  "googlesyndication.com",
  "googletagservices.com",
  "googletagmanager.com",
  "google-analytics.com",
  "adservice.google.com",
  "adnxs.com",
  "fundingchoicesmessages.google.com",
];

const BASE_URL = "https://practice.expandtesting.com";

type WorkerFixtures = {
  authedRequest: APIRequestContext;
};

export const test = base.extend<{}, WorkerFixtures>({
  page: async ({ page }, use) => {
    await page.route("**/*", (route) => {
      const host = new URL(route.request().url()).hostname;
      if (BLOCKED_HOSTS.some((ad) => host === ad || host.endsWith(`.${ad}`))) {
        return route.abort();
      }
      return route.continue();
    });
    await use(page);
  },

  authedRequest: [
    async ({}, use) => {
      // Setup: register a fresh user, then login to get a token.
      // Two contexts: setupContext is unauthenticated (used for register + login);
      // authed carries the token in extraHTTPHeaders for every subsequent call.
      const email = randomEmail();
      const password = randomString(10);
      const name = randomUsername();

      const setupContext = await request.newContext({ baseURL: BASE_URL });
      const users = new UserService(setupContext);
      await users.register({ name, email, password });
      const loginRes = await users.login({ email, password });
      const token = (await loginRes.json()).data.token;
      await setupContext.dispose();

      const authed = await request.newContext({
        baseURL: BASE_URL,
        extraHTTPHeaders: { "x-auth-token": token },
      });

      await use(authed);

      // Teardown: delete the test account so the practice site doesn't accumulate
      // one worker-fixture user per CI run
      await authed.delete("/notes/api/users/delete-account");

      await authed.dispose();
    },
    { scope: "worker" },
  ],
});

// Re-export expect so tests only need to import from this file
export { expect } from "@playwright/test";
