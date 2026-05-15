import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Directory where tests live
  testDir: "./tests",

  // One-time setup/teardown for the whole test run (runs before/after all
  // workers). Used to generate test-artifacts/ fixture files in a single
  // process, avoiding races between parallel project workers.
  globalSetup: "./global-setup",
  globalTeardown: "./global-teardown",

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if test.only() was accidentally left in
  forbidOnly: !!process.env.CI,

  // Retry failed tests once (local + CI). Artifacts are kept only when the
  // retry also fails — see `use.trace` / `use.video` below.
  retries: 1,

  // Number of parallel workers (adjust based on your machine)
  workers: process.env.CI ? 2 : 4,

  // Reporter: HTML report saved to playwright-report/
  reporter: [["html", { open: "never" }]],

  // Global settings applied to all tests
  use: {
    // Base URL for the practice site
    baseURL: process.env.BASE_URL || "https://practice.expandtesting.com",

    // All three artifact types use *-on-failure semantics: Playwright records
    // them for every attempt, then discards if the test ultimately passes
    // (e.g. fails first, succeeds on retry). They are retained only when the
    // final outcome is failed — i.e. both the initial attempt and the retry
    // failed. Keeps test-results/ clean across flaky retried-and-passed runs.
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },

  projects: [
    // --- Desktop Browsers ---
    {
      name: "chromium",
      testDir: "./tests/ui",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testDir: "./tests/ui",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testDir: "./tests/ui",
      use: { ...devices["Desktop Safari"] },
    },

    // --- Mobile Viewports ---
    // Intentionally omitted. The practice site (practice.expandtesting.com)
    // does not have a responsive design — viewports below desktop breakpoints
    // reflow into a partially-broken layout that doesn't reflect any real
    // mobile user experience. See README.md "Browser Coverage" for context.

    // --- API Tests (no browser needed) ---
    {
      name: "api",
      testDir: "./tests/api",
      // Inherits global baseURL ('https://practice.expandtesting.com'); service
      // wrappers carry the full path (e.g. '/notes/api/health-check') so each
      // service is self-documenting against the Notes API Swagger.
    },
  ],
});
