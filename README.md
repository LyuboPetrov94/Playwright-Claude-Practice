# Playwright Testing Framework

An end-to-end and API testing framework built with [Playwright](https://playwright.dev/) and TypeScript, targeting [practice.expandtesting.com](https://practice.expandtesting.com) as the system under test.

## Tech Stack

- **Playwright** v1.43.0
- **TypeScript** 5.0.0
- **Node.js** 20+

## Project Structure

```
playwright-framework/
├── tests/
│   ├── ui/                        # UI tests grouped by feature
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── otp-login/
│   │   ├── inputs/
│   │   ├── radio-buttons/
│   │   ├── locators/
│   │   ├── drag-and-drop/
│   │   ├── drag-and-drop-circles/
│   │   ├── dynamic-table/
│   │   └── dynamic-pagination-table/
│   └── api/                       # API tests
│       └── users/
├── pages/                         # Page Object Models
├── fixtures/                      # Custom Playwright fixtures
├── helpers/                       # Utility functions
├── playwright.config.ts           # Playwright configuration
└── tsconfig.json                  # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm

### Installation

```bash
npm install
npx playwright install
```

## Running Tests

```bash
# Run all tests (all browsers)
npm test

# Run only UI tests
npm run test:ui

# Run only API tests
npm run test:api

# Run tests with the browser visible
npm run test:headed

# Run in debug mode
npm run test:debug

# Open the HTML test report
npm run report
```

## Browser Coverage

| Browser          | Device   | Status  |
|------------------|----------|---------|
| Chromium         | Desktop  | Enabled |
| Firefox          | Desktop  | Enabled |
| WebKit (Safari)  | Desktop  | Enabled |
| Mobile Chrome    | Pixel 5  | Enabled |

## Architecture

### Page Object Model

Each page under test has a corresponding class in `pages/` that encapsulates locators and interaction methods. Page objects expose `Locator` objects (not raw strings) so that Playwright's auto-retry mechanism works with assertions.

### Fixtures

Custom fixtures in `fixtures/index.ts` extend Playwright's base `test` object. This includes a pre-configured `apiContext` for API testing with the correct base URL and headers.

### Helpers

- **`helpers/api.ts`** — Thin wrappers (`getJson`, `postJson`, `deleteResource`) around Playwright's `APIRequestContext`
- **`helpers/data.ts`** — Test data generators (`randomEmail`, `randomUsername`, `randomString`, `randomInt`) to avoid collisions between test runs

## Test Design

Tests apply ISTQB test design techniques:

- **Equivalence Partitioning** — One test per valid/invalid input class
- **Boundary Value Analysis (3-point)** — Below, at, and above limits
- **Decision Table** — Input combinations mapped to expected outcomes
- **State Transition** — Valid and invalid state flow coverage

## CI

Playwright config detects `CI` via environment variable and adjusts:

- Workers: 2 (vs. 4 locally)
- Retries: 1 on failure
- `forbidOnly`: enabled
- Artifacts (screenshots, videos, traces) captured on failure
