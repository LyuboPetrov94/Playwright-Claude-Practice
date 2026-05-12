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
- Tests import `test` and `expect` from `fixtures/index.ts`, not directly from `@playwright/test`. **Type-only imports** (e.g. `import type { Download, ConsoleMessage } from '@playwright/test'`) are allowed directly from `@playwright/test` — they don't bring runtime values into the spec, so the fixture-routing concern doesn't apply.
- Do NOT call `locator.clear()` before `locator.fill()` — `fill()` already clears the field internally. The extra `clear()` dispatches a redundant `input` event that on Firefox under load can race with subsequent actions (e.g. a click that reads `input.value` may fire before the fill commits). Only use a standalone `clear()` when the goal is to clear *without* refilling, or when you need to dispatch an `input` event manually after clearing (DataTables search — see gotcha below).
- For Firefox-reliable form-fill flows, follow `fill(value)` with `await expect(input).toHaveValue(value)` as a commit barrier before any action that depends on the value. See `pages/WebInputsPage.ts` for the pattern.
- All POM `goto()` and `reload()` methods must pass `{ waitUntil: 'domcontentloaded' }` — see the ad-iframe gotcha below. Exception: same-origin iframes with inline submit handlers also need `contentFrame.waitForLoadState('load')` after `goto()` — see the iframe-inline-script gotcha.
- Prefer `page.locator('#id')` for stable IDs, `page.getByRole()` for semantic elements
- Keep test files named `<feature>.spec.ts`
- TC numbers must be sequential within a spec file — reorder and renumber when tests are added or removed
- For multi-step flows (e.g. email → OTP verification), use nested `test.describe` blocks with a separate `beforeEach` that completes the prerequisite step
- For forms with client-side validation, provide a `submitEmpty()` POM method (clicks submit without filling) alongside the normal `submitX(value)` method
- **Cross-browser outcome divergence:** when the same user action produces a different browser-defined outcome per engine (e.g. invalid-date entry: Chromium normalises, Firefox + WebKit reject), branch one test on `browserName` rather than skipping on a browser or duplicating the test. Single TC, multiple `if`/`else` branches each with an inline comment naming the engine's behaviour. See `tests/ui/inputs/inputs.spec.ts` TC09 for the canonical example.

## Browsers
Active projects: `chromium`, `firefox`, `webkit`.
Mobile projects (`mobile-chrome`, `mobile-safari`) are intentionally excluded — the practice site has no responsive design, so below desktop breakpoints the layout reflows into a partially-broken state that doesn't represent any real mobile UX. See `README.md` "Browser Coverage". Do not re-add mobile projects without the SUT first gaining responsive design.

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
- **`/digest-auth` is mislabeled — actually Basic auth**: The practice site's `/digest-auth` page is described in prose as using HTTP Digest authentication, but the server challenges with `WWW-Authenticate: Basic realm="Restricted Area"` — the same realm as `/basic-auth`. Sending `Authorization: Basic <base64(admin:admin)>` returns 200 on both endpoints. A single Playwright `httpCredentials` Basic context handles both. There is no real Digest-auth target on this practice site; do not write tests that exercise the digest dance (`nonce`/`qop`/`cnonce`) — they will not run against this server. If a future spec needs an actual Digest server, pick a different SUT.
- **`/iframe` has only one testable iframe out of three sections**: The page advertises "External: YouTube Video Player", "External: TinyMCE Editor", and "Internal: Email Subscription". In reality only one is testable. (1) The YouTube iframe (`#iframe-youtube`) is blocked by Chromium and renders the message "This page has been blocked by Chromium" — its content is unreachable. (2) The "TinyMCE Editor" section is **not actually an iframe** — `document.querySelectorAll('iframe')` finds only two elements (YouTube + email-subscribe), and the TinyMCE editable area renders as a textarea/contenteditable in the parent DOM. (3) Only the email-subscribe iframe (`#email-subscribe`, same-origin to `/iframe-email-subscribe`) is a real, testable iframe — it embeds a Bootstrap `needs-validation` subscribe form. Do not write tests that assume the YouTube or TinyMCE sections behave as iframes.
- **Bootstrap 5 strips `title` attribute on first tooltip show**: When Bootstrap's Tooltip plugin shows a tooltip for an element, it moves the original `title` value into JS instance state and clears the live DOM attribute (so the browser does not render its own native tooltip on top of Bootstrap's). Subsequent `getAttribute('title')` calls return `null`. Always read the title *before* any hover/click that could trigger initialization, cache it in a JS-scope `const`, and assert against the cached value. See `tests/ui/hovers-tooltips/hovers-tooltips.spec.ts` TC17 for the pattern. As of BS 5.2 the value is no longer mirrored to `data-bs-original-title`, so the only reliable source post-show is `bootstrap.Tooltip.getInstance(el).getTitle()`.
- **Third-party consent UI on `/tooltips` adds `role="tooltip"` to non-Bootstrap elements**: The practice site loads a consent-management widget that injects `<button role="tooltip" class="fc-help-tip">` nodes (~85 of them) asynchronously after `domcontentloaded`. A broad `page.locator('[role="tooltip"]')` selector will match these alongside Bootstrap's `<div class="tooltip" role="tooltip">`, tripping Playwright's strict mode on most assertions. Always narrow to `div.tooltip[role="tooltip"]` for Bootstrap tooltips. The widget loads asynchronously, so early-running tests can pass on the broad selector and later ones fail — do not rely on timing.
- **MCP `--allowed-origins` blocks Bootstrap (and other CDN) scripts**: The project's `.mcp.json` restricts the Playwright MCP browser to `practice.expandtesting.com` (plus the staging host). This blocks `cdn.jsdelivr.net` and other CDNs, so the Bootstrap JS bundle never loads, Bootstrap's Tooltip/Modal/etc. plugins are not initialised, and pages that depend on them appear broken (e.g. `/tooltips` shows no tooltip on hover; console reports `ReferenceError: bootstrap is not defined`). This affects MCP-based page inspection only — the actual Playwright test framework runs without `--allowed-origins`, so Bootstrap works normally in test runs. When inspecting Bootstrap-driven pages via MCP, trust the documented Bootstrap behaviour rather than the rendered output.
- **Hover-reveal + click races scrollIntoViewIfNeeded**: When a CSS `:hover` selector reveals a previously hidden element (e.g. `.figcaption { display:none }` → `display:block`), the figure's height changes on hover. If the subsequent `click()` on the revealed child needs to scroll to bring the child into view, the page layout shifts, the mouse's viewport position no longer falls on the figure, the `:hover` state is lost, the revealed element hides, and the click times out (with `element is not visible` after `done scrolling` in the trace). Fix: in the POM's hover action, call `scrollIntoViewIfNeeded()` *before* `hover()` so the layout is settled and the later click never needs to scroll. See `pages/HoversPage.ts` `hoverUser()` for the pattern. The bug is flaky — it depends on viewport size and which figure is being hovered — so a passing run does not mean it's absent.
- **`/key-presses` `#target` is inside a hidden form**: The text input has no visible `<form>` wrapping it in the accessibility tree, but it is in fact inside `<form method="get">` with no `action` and no `name`-attributed fields. Pressing Enter while `#target` is focused submits the form, the browser navigates to `/key-presses?` (trailing `?` is the giveaway), the page reloads, and `#result` is wiped before any assertion can read it. Do NOT auto-focus `#target` in `beforeEach` for keydown-only tests — the page handler is bound to `document.keydown` so it fires regardless of focus. Only focus the input from tests that need to read `#target.value` (TC19–TC22 in `key-presses.spec.ts`).
- **Playwright's `press('Shift+a')` chord does NOT type uppercase**: The chord syntax `'Mod+key'` is for combos like `Shift+Tab` or `Ctrl+C` where you want the modifier *as a modifier*. It dispatches keydown(Shift) → keydown(a) (with `shiftKey: true`) → keyup chain, but the text-input simulation still inserts lowercase `'a'` into the focused field. To actually type uppercase characters, call `press('A')` or `type('A')` — Playwright handles the Shift internally and inserts the uppercase character. The page-level handler's keyCode is the same (65 → "A") in both cases, so `#result` is identical; only the text-entry differs. Documented in `tests/ui/key-presses/key-presses.spec.ts` TC19.
- **Invalid date-input segments: only Chromium normalises**: Typing an out-of-range sequence like `15/35/2024` into `<input type="date">` via `pressSequentially()` yields three different outcomes. Chromium accepts the typed digits and normalises out-of-range parts to the last valid day of the year (`2024-12-31`). Firefox and WebKit instead reject each invalid segment as it's typed — only the year commits, the date is incomplete, and `input.value === ''`. Tests that assert on this behaviour must branch on `browserName` (see the convention above). Documented at `tests/ui/inputs/inputs.spec.ts` TC09.
- **Project-wide ad/analytics blocker in `fixtures/index.ts`**: Every test runs with a `page.route` handler that aborts requests to DoubleClick, AdSense, Google Tag Manager, Google Analytics, AdNexus, and Google's Funding Choices consent host. Models a real user with an ad blocker (~99% of users). It exists for three reasons: (1) DoubleClick ad iframes reflowed the practice-site layout asynchronously, causing Firefox click-coordinate races where Display-Inputs clicks landed on shifted ad banners — see the inputs spec history; (2) the Funding Choices consent dialog injected an extra `<h1>` that broke strict-mode `locator('h1')` queries (e.g. `multiple-windows` TC04); (3) blocking heavy ad scripts also makes Firefox/WebKit runs noticeably faster on slow machines. Do not remove the blocker without re-introducing per-spec waits for ad iframes. The "Third-party ad iframes block the `load` event" and "Ad iframes pollute `page.on('console')`" gotchas above remain factually true but their *practical impact is largely mitigated* by the blocker — keep the `domcontentloaded` convention anyway since not every ad host is on the list.
- **Same-origin iframes with inline submit handlers need `contentFrame.waitForLoadState('load')`**: Bootstrap's `needs-validation` pattern is wired up by an inline `<script>` at the **end** of the iframe's body. The submit button can be in the iframe DOM and clickable *before* that inline script has executed and attached its listener. A click in that window falls through to the form's default submission — `was-validated` is never added and `.invalid-feedback` never becomes visible, with the failure surfacing as a `toBeVisible` timeout on the validation message. Waiting on the **outer page's** `domcontentloaded` is not sufficient. In any POM that drives an inline-scripted iframe, after `page.goto()` also: `const frameEl = await page.waitForSelector('#email-subscribe'); const frame = await frameEl.contentFrame(); await frame?.waitForLoadState('load');`. See `pages/IframePage.ts` `goto()` for the canonical pattern. Without this wait, the failure is flaky and timing-sensitive — running with ads blocked makes it more likely to surface because page load is faster.
- **DataTables-driven tables expose the "non-retrying assertion" anti-pattern (extends the Auto-retrying assertions gotcha above)**: `expect(await locator.count()).toBe(N)` does not auto-retry — the `await` resolves to a one-shot integer that's then passed to a synchronous `toBe`. DataTables injects its visible rows asynchronously after `domcontentloaded`, so on Firefox/WebKit the assertion fires while the table body is still empty (received `0`). Always assert via the locator: `await expect(rowLocator).toHaveCount(N)`. POMs for DataTables-driven pages should expose a `Locator` for the visible rows, not a `Promise<number>` count helper. See `pages/DynamicPaginationTablePage.ts` `getTableRows()`.
- **`<input type="email">` strips leading/trailing whitespace per HTML spec**: The HTML value-sanitization algorithm for `type="email"` strips ASCII whitespace from both ends of the value. After `await emailInput.fill(' user@example.com ')`, `inputValue()` returns `'user@example.com'` — not the padded string. This breaks the `toHaveValue(value)` commit-barrier pattern (from the Conventions section) for email inputs whenever a test deliberately passes whitespace-padded input (e.g. forgot-password TC05, otp-login TC05 — both assert the page handles padded emails gracefully). The fix is to assert against the sanitized value in the POM: `await expect(emailInput).toHaveValue(email.trim())`. The barrier still catches the Firefox fill→click commit race because `trim()` is a no-op on non-whitespace input. Applied in `pages/ForgotPasswordPage.ts`, `pages/OtpLoginPage.ts`, `pages/IframePage.ts`. Other input types (text, password, date) do not sanitize, so their commit barriers stay as `toHaveValue(value)` without `.trim()`.

## What NOT to Do
- Do not write selectors directly in test files
- Do not call `clear()` before `fill()` — `fill()` already clears, and the extra event races on Firefox. See the Conventions section.
- Do not add tests for the `api` project until API testing is explicitly started
- Do not re-add `mobile-chrome` / `mobile-safari` projects without the SUT first gaining responsive design
- Do not remove the ad/analytics blocker in `fixtures/index.ts` without first re-introducing per-spec ad-iframe stabilisation
