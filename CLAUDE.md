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
  ui/<feature>/       # UI/E2E tests grouped by feature
  api/<resource>/     # API tests grouped by resource
pages/                # Page Object Models (one class per page/component)
fixtures/             # Custom Playwright fixtures (shared setup/teardown)
helpers/              # Utility functions (data generators, API wrappers)
test-artifacts/       # Runtime-generated test files, one subfolder per feature
                      # (gitignored; created in global-setup.ts, removed in global-teardown.ts)
```

## Workflow
Before writing any code for a new feature:
1. Fetch the target page to inspect real selectors, element attributes, and page behaviour
2. Propose a list of test cases (applying the test design techniques below) for review
3. Get explicit approval on the test case list before writing the POM or spec
4. Write the POM first, then the spec

## Conventions
- Always use the **Page Object Model (POM)** pattern — selectors and actions belong in `pages/`, never directly in test files
- Tests import `test` and `expect` from `fixtures/index.ts`, not directly from `@playwright/test`
- Use `locator.clear()` before `locator.fill()` to ensure consistent behaviour across all browsers
- All POM `goto()` and `reload()` methods must pass `{ waitUntil: 'domcontentloaded' }` — see the ad-iframe gotcha below
- Prefer `page.locator('#id')` for stable IDs, `page.getByRole()` for semantic elements
- Keep test files named `<feature>.spec.ts`
- TC numbers must be sequential within a spec file — reorder and renumber when tests are added or removed
- For multi-step flows (e.g. email → OTP verification), use nested `test.describe` blocks with a separate `beforeEach` that completes the prerequisite step
- For forms with client-side validation, provide a `submitEmpty()` POM method (clicks submit without filling) alongside the normal `submitX(value)` method

## Browsers
Active projects: `chromium`, `firefox`, `webkit`, `mobile-chrome`
Disabled: `mobile-safari` — practice site times out consistently on WebKit mobile

## Running Tests
```bash
npm test                                        # all tests, all browsers
npx playwright test tests/ui/<feature>          # specific feature
npx playwright test --project=chromium          # single browser
npm run report                                  # open HTML report
```

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

## POM Design Rules
- Output elements must expose a `Locator` (not `Promise<string | null>`) so tests can use auto-retrying assertions directly
- Input elements expose `inputValue()` methods for checking field state after interaction
- Never return raw `textContent()` from POM methods — always return a `Locator` and let the test assert on it

## Assertion Preferences
Use assertions in this order of preference:
- `toHaveText('value')` — for asserting specific text content
- `toContainText('partial')` — for asserting partial text (e.g. flash messages that include a dismiss button's text)
- `toBeEmpty()` — for asserting a container has no children or text
- `toBeVisible()` / `toBeHidden()` — only when the element is genuinely expected to appear or disappear from view
- Never use `textContent()` directly in assertions — it does not auto-retry and will time out on dynamic content

## Unused Code Check
After writing a POM or spec file, scan it for unused methods, functions, exports, or variables before marking the task complete. Do not silently delete — for each unused item:
1. Identify why it went unused. Was it written speculatively, or does it point to a gap — a missed test case, a missing assertion, an incomplete flow, or a boundary the spec skipped?
2. If it maps to a gap, surface it and propose the missing test. Prefer adding the test over removing the helper.
3. If it is genuinely redundant (duplicate of an existing helper, or covers behaviour that is out of scope by design), flag it and propose deletion for explicit confirmation before removing.
4. Report the findings as part of the task summary so the decision is visible, not hidden in the diff.

## Known Gotchas (learned from practice site)

- **Date input format**: `locator.fill()` on `<input type="date">` requires `YYYY-MM-DD` format. Playwright must use the HTML standard format or it throws `Malformed value`. The practice site also outputs dates in `YYYY-MM-DD` format.
- **Invalid dates via keyboard**: To test invalid date values that `fill()` rejects, use `pressSequentially()` to simulate raw keyboard input instead.
- **Empty output elements**: When a page clears output elements (e.g. on button click or input change), the elements often remain in the DOM but become empty. Use `toBeEmpty()` on the container — not `toBeHidden()` or `toHaveText('')`. If the container always has children (even when empty), assert `toHaveText('')` on each individual output element instead.
- **Auto-retrying assertions**: Always prefer `expect(locator).toBeEmpty()`, `toHaveText()`, `toBeVisible()` etc. over `textContent()` for state assertions — they retry automatically. `textContent()` does not retry and will time out if the element is not immediately ready.
- **Bootstrap client-side validation**: Several forms use `class="needs-validation"` with `novalidate` and a `form-validation.js` script. This creates two validation layers: client-side (Bootstrap + HTML5 `checkValidity()`, shows `.invalid-feedback`) and server-side (flash messages after redirect). Tests must cover both layers — the form does not submit when client-side validation fails.
- **Flash messages**: Server-side errors and notices use `#flash` inside `#flash-message`. Error flashes use `alert-danger`, success uses `alert-success`, notices use `alert-info`. Flash messages appear after 302 redirects via session cookies.
- **Server validation inconsistency**: Email validation differs across endpoints. The forgot-password page rejects emails without a TLD (e.g. `user@domain`), but the OTP login page accepts them. Always probe each endpoint — do not assume identical validation rules.
- **OTP login has one hard-coded email/code pair**: `/otp-login` does not send real emails. Only `practice@expandtesting.com` + `214365` reaches `/secure`. Step 1 accepts any well-formed email (non-TLD, non-existent, whitespace-padded) and advances to step 2, but step 2 will always return "The provided OTP code is incorrect." unless the canonical pair is used. Do not design tests that try to reach `/secure` via OTP with any other email — the two steps' input classes are *not* composable.
- **Registration username normalisation**: The server silently converts uppercase usernames to lowercase during registration. Despite the error message stating "lowercase letters only", uppercase input succeeds.
- **DataTables search clearing**: DataTables listens on the `input` event for its search box. Playwright's `clear()` and `fill('')` do not reliably trigger this event. Use `clear()` followed by `dispatchEvent('input')` to ensure DataTables re-renders the unfiltered table.
- **Ad/link injection in elements**: The practice site injects ad links inside page elements (e.g. `#chrome-cpu` label). Using `textContent()` picks up child element text. Use `evaluate()` to extract only direct text nodes when an element may contain injected children.
- **Third-party ad iframes block the `load` event**: The practice site embeds Google DoubleClick ad iframes that can delay or never complete loading. Playwright's default `page.goto()` and `page.reload()` wait for `waitUntil: 'load'`, which will time out at 30 s while waiting for the ad network. Always pass `{ waitUntil: 'domcontentloaded' }` to `goto()` and `reload()` in every POM — the DOM is ready long before the ads.
- **Ad iframes pollute `page.on('console', ...)` output**: The same ad iframes emit `ERR_BLOCKED_BY_CLIENT` errors and occasional `log`/`warning` messages unrelated to the SUT. Any test that asserts on console output must filter by message shape (e.g. regex on the app's known prefix, or `msg.type()` match) or risk counting ad-iframe noise as app events. See `tests/ui/console-logs/console-logs.spec.ts` (`isAppMessage` helper) for the pattern.
- **HTML5 drag-and-drop**: Playwright's `dragTo()` targets the centre of the drop zone, which can land on already-dropped child elements that lack a `drop` listener. Use manual `DataTransfer` event dispatch via `page.evaluate()` to fire `dragstart`/`dragover`/`drop`/`dragend` directly on the correct source and target elements. The `tsconfig.json` includes `"dom"` in `lib` to support browser API types inside `evaluate()`.
- **Missing `for` attribute on labels**: Some practice site labels omit the `for` attribute (e.g. Green radio button on `/radio-buttons`). Use parent-relative locators (`#id` → `..` → `.form-check-label`) instead of `label[for="id"]`.
- **Native HTML5 required-validation popover consumes the next click**: After a submit attempt is blocked by an HTML5 `required` field, Chromium keeps the native validation popover active. The next click on the submit button — even once the field is filled — can be consumed by the popover dismissal rather than triggering form submission. In state-transition tests that chain *(blocked submit → fill field → submit)*, press `Escape` between the two submits to clear the popover explicitly. See `tests/ui/file-upload/file-upload.spec.ts` TC08 for the pattern. Does not apply to forms using Bootstrap's `novalidate` + `needs-validation` pattern (which replaces native validation with DOM-rendered `.invalid-feedback`).

## What NOT to Do
- Do not write selectors directly in test files
- Do not skip `clear()` before `fill()` on input fields
- Do not add tests for the `api` project until API testing is explicitly started
- Do not enable `mobile-safari` without confirming the target site supports it
