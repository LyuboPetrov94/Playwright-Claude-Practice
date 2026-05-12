# Playwright Framework — Claude Instructions

## Project Overview
General-purpose Playwright E2E and API testing framework built with TypeScript.
Currently using https://practice.expandtesting.com as the practice target.

## User Context
- QA Engineer, ISTQB Foundation Level Certified
- Experienced with Cypress (UI E2E), new to Playwright
- When introducing Playwright concepts, relate them to Cypress equivalents where helpful

## Project Structure
```
tests/
  ui/<feature>/       # UI/E2E tests grouped by feature — see tests/ui/CLAUDE.md
  api/<resource>/     # API tests grouped by resource (not yet started)
pages/                # Page Object Models (one class per page/component) — UI only
fixtures/             # Custom Playwright fixtures (shared setup/teardown)
helpers/              # Utility functions (data generators, API wrappers)
test-artifacts/       # Runtime-generated test files, one subfolder per feature
                      # (gitignored; created in global-setup.ts, removed in global-teardown.ts)
```

## Subtree Instructions
This root file documents shared/cross-cutting rules. UI-specific conventions, design rules, and gotchas live in `tests/ui/CLAUDE.md` — Claude Code auto-loads that file when working within the UI subtree. API-specific instructions will live at `tests/api/CLAUDE.md` once API testing begins.

## Workflow
Before writing any code for a new feature:
1. Inspect the target — for UI, fetch the page and inspect selectors/attributes/behaviour; for API, probe the endpoint and observe request/response shape and status codes
2. Propose a list of test cases (applying the test design techniques below) for review
3. Get explicit approval on the test case list before writing any test code
4. Write supporting code first (POM for UI, service wrapper for API), then the spec

## Conventions
- Tests import `test` and `expect` from `fixtures/index.ts`, not directly from `@playwright/test`. **Type-only imports** (e.g. `import type { Download, ConsoleMessage } from '@playwright/test'`) are allowed directly from `@playwright/test` — they don't bring runtime values into the spec, so the fixture-routing concern doesn't apply.
- Selectors / endpoints / test targets never appear directly in spec files — abstract through POMs (UI) or service wrappers (API).
- Keep test files named `<feature>.spec.ts`
- TC numbers must be sequential within a spec file — reorder and renumber when tests are added or removed
- For multi-step flows, use nested `test.describe` blocks with a separate `beforeEach` that completes the prerequisite step

## Browsers
Active projects: `chromium`, `firefox`, `webkit`. Mobile projects are intentionally excluded — see `tests/ui/CLAUDE.md` Browsers section for the rationale.

## Running Tests
```bash
npm test                                        # all tests, all browsers
npx playwright test tests/ui/<feature>          # specific feature
npx playwright test --project=chromium          # single browser
npm run report                                  # open HTML report
```

Retries are enabled (1) both locally and on CI. Screenshot / video / trace all use `*-on-failure` semantics — artifacts are kept only when the final outcome is failed (i.e. the initial attempt AND the retry both failed). Tests that pass on retry are reported as "flaky" with no artifacts retained. Full-suite Firefox/WebKit runs on resource-constrained machines occasionally surface flakes that pass in isolation; for deterministic per-spec signal, prefer `npx playwright test tests/ui/<feature> --project=<browser> --workers=1`.

## Test Design Techniques
Apply these ISTQB techniques when generating test cases:

### Equivalence Partitioning
Divide inputs into valid and invalid equivalence classes. Write one test per class — do not repeat tests within the same class.
- Example for a username field: valid class (existing user), invalid classes (non-existent user, empty)

### Boundary Value Analysis (3-point)
For any range or limit, test three points: just below, at, and just above the boundary.
- Example for a field with max 20 characters: 19 chars (below), 20 chars (at boundary), 21 chars (above)
- Keep all three points even when "at" and "above" produce the same outcome (e.g. both rejected). The points document the boundary's shape, not only outcome diversity — this technique wins over the "distinct outcomes" decision-table rule when they conflict.

### Decision Table
For features with multiple input conditions that combine to produce different outcomes, map all combinations in a table before writing tests.
- Example: login with (valid/invalid username) × (valid/invalid/empty password) = distinct outcomes

### State Transition
For multi-step flows, identify states and transitions. Write tests that cover valid transitions and attempt invalid ones.
- Example: Logged out → Login → Logged in → Logout → Logged out

## Assertion Preferences
Prefer Playwright's auto-retrying assertions over manual `await` + `toBe()` patterns whenever the underlying value comes from a Locator:
- `toHaveText('value')` — for asserting specific text content
- `toContainText('partial')` — for asserting partial text
- `toBeEmpty()` — for asserting a container has no children or text
- `toBeVisible()` / `toBeHidden()` — only when the element is genuinely expected to appear or disappear from view
- `toHaveCount(N)` — for asserting locator-resolved element count (NOT `expect(await locator.count()).toBe(N)`, which does not auto-retry)

UI-specific assertion rules (textContent restrictions, whitespace-significant matchers) live in `tests/ui/CLAUDE.md`.

## Unused Code Check
After writing a POM or spec file, scan it for unused methods, functions, exports, or variables before marking the task complete. Do not silently delete — for each unused item:
1. Identify why it went unused. Was it written speculatively, or does it point to a gap — a missed test case, a missing assertion, an incomplete flow, or a boundary the spec skipped?
2. If it maps to a gap, surface it and propose the missing test. Prefer adding the test over removing the helper.
3. If it is genuinely redundant (duplicate of an existing helper, or covers behaviour that is out of scope by design), flag it and propose deletion for explicit confirmation before removing.
4. Report the findings as part of the task summary so the decision is visible, not hidden in the diff.

## What NOT to Do
- Do not write selectors / endpoints / test targets directly in spec files — abstract through POMs (UI) or service wrappers (API)
- Do not add tests for the `api` project until API testing is explicitly started
- UI-specific "do not" rules live in `tests/ui/CLAUDE.md`
