# UI Test Backlog

Backlog for the UI e2e phase of the Playwright framework. Agreed 2026-04-24, before concluding UI and moving on to API tests.

## Ground rule
Do not mark an entry as [x] until a test run has confirmed the code passes. "Written" is not "done." If a TC fails, update the entry with the failure and next step rather than ticking it. Learned on 2026-04-24 after otp-login TC12 was prematurely ticked and then had to be reverted.

## Goal
Portfolio-style example framework demonstrating core Playwright concepts — something that can be consulted as a reference in future sessions and shown as a skills portfolio.

## Pending new specs

Each spec below targets a Playwright concept not yet demonstrated. Recommended order: top-down.

- [x] **file-upload.spec.ts** (`/upload`) — `setInputFiles()`, size BVA (499/500/501 KB), recovery after size error and after native required validation. 8 TCs. Single-file only (input has `multiple=false`); no type filter (`accept=""`); drag-and-drop skipped (no custom drop zone). Fixture files generated at runtime into `test-artifacts/upload/` via `Buffer.alloc(N * 1024)`. Added 2026-04-24.
- [ ] **file-download.spec.ts** (`/download`) — `page.on('download')` / `waitForDownload()`, `saveAs()` to a project path, filename + content assertions, cleanup after test
- [ ] **http-auth.spec.ts** (`/basic-auth` + `/digest-auth` + `/download-secure`) — `browser.newContext({ httpCredentials })`, one context per auth type, protected download to prove the context persists credentials
- [ ] **iframe.spec.ts** (`/iframe`) — `frameLocator()`, interaction inside a frame, assertions scoped to the frame
- [ ] **multiple-windows.spec.ts** (`/windows`) — `context.waitForEvent('page')`, interact with the new page, close, return focus to the opener
- [ ] **hovers-tooltips.spec.ts** (`/hovers` + `/tooltips` combined in one spec) — `locator.hover()`, reveal on hover, mouse leave, tooltip visibility
- [ ] **key-presses.spec.ts** (`/key-presses`) — `page.keyboard.press()`, modifiers (Shift/Alt/Ctrl/Meta), Enter/Tab/Arrow, event-capture display only (no retrofits to other specs)

## Pending additions to existing specs

- [~] **otp-login.spec.ts TC12** — attempted 2026-04-24, reverted the same day. Test assumed the OTP was global; it is actually hard-coded to the canonical `practice@expandtesting.com` / `214365` pair, so no other email can reach `/secure`. Documented as a CLAUDE.md gotcha instead ("OTP login has one hard-coded email/code pair").

## Decision-table revisit — complete

Reviewed `form-validation`, `register`, `login`, `otp-login`. **No new TCs added.** The only candidate (otp-login TC12 above) turned out to be unreachable because of the site's hard-coded OTP pair. All four specs already exercise every distinct outcome reachable on the practice site.

## Out of scope (confirmed, not planned)

- Dynamic/wait pages: `/dynamic-loading`, `/dynamic-controls`, `/slow`, `/shifting-content`, `/disappearing-elements`, `/infinite-scroll`, `/scrollbars`
- DOM-robustness pages: `/shadowdom`, `/challenging-dom`, `/large`, `/dynamic-id`
- Visual snapshots (`toHaveScreenshot`), accessibility scans, network interception, storage/cookie inspection
- Integration between UI and API phases (phases stay independent)

## Decisions locked

- Hovers + tooltips → one combined spec, not two
- Keyboard → event-capture only, no Tab-focus retrofits in other specs
- HTTP auth → `newContext({ httpCredentials })` only (no URL-embedded credentials variant)
- File download → demonstrate `saveAs()` to a project path with cleanup
