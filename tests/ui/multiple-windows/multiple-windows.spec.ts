import { test, expect } from '../../../fixtures';
import {
  MultipleWindowsPage,
  OPENER_HEADING,
  NEW_WINDOW_HEADING,
  NEW_WINDOW_TITLE,
  NEW_WINDOW_PATH,
} from '../../../pages/MultipleWindowsPage';

/**
 * Multiple windows tests for https://practice.expandtesting.com/windows
 *
 * Page facts:
 *   - Opener `/windows` has one H1 and one anchor:
 *       <a href="/windows/new" target="_blank">Click Here</a>
 *     No id/class, no JS `window.open` — pure HTML target="_blank".
 *   - Popup `/windows/new` is minimal: title "Example of a new window",
 *     a single H1, no nav/footer. Same-origin to the opener.
 *
 * Demonstrates: `context.waitForEvent('page')` via the canonical
 * Promise.all pattern, `newPage.waitForLoadState()`, `context.pages()`
 * lifecycle, `page.bringToFront()`, and shared BrowserContext between
 * opener and popup.
 *
 * No input fields → EP/BVA/decision-table don't apply. The natural
 * ISTQB lens here is state transition (no popup → open → closed →
 * reopened), covered in TC06.
 *
 * Test cases:
 *   - Opener smoke                                      (TC01)
 *   - Popup opens, loads, shares context                (TC02)
 *   - context.pages() lifecycle (1 → 2 → 1)            (TC03)
 *   - Opener stays interactive; bringToFront returns    (TC04)
 *   - Multiple popups (N=3) open/close                  (TC05)
 *   - State transition: open → close → re-open         (TC06)
 */

test.describe('Multiple Windows', () => {
  let windowsPage: MultipleWindowsPage;

  test.beforeEach(async ({ page }) => {
    windowsPage = new MultipleWindowsPage(page);
    await windowsPage.goto();
  });

  // ─── Smoke ────────────────────────────────────────────────────────────────

  test('TC01 - Opener page shows the H1 and the Click Here link', async () => {
    await expect(windowsPage.getOpenerHeading()).toHaveText(OPENER_HEADING);
    await expect(windowsPage.getOpenLink()).toBeVisible();
  });

  // ─── Opening a popup ──────────────────────────────────────────────────────

  test('TC02 - Click opens a fully loaded popup at /windows/new sharing the same context', async ({ page }) => {
    const popup = await windowsPage.openNewWindow();

    // Same BrowserContext → cookies, storage, and auth carry over.
    // Synchronous equality check; not async since context() is not a Promise.
    expect(popup.context()).toBe(page.context());

    await expect(popup).toHaveURL(new RegExp(`${NEW_WINDOW_PATH}$`));
    await expect(popup).toHaveTitle(NEW_WINDOW_TITLE);
    await expect(windowsPage.getPopupHeading(popup)).toHaveText(NEW_WINDOW_HEADING);
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  test('TC03 - context.pages() reflects the open and close lifecycle', async ({ page }) => {
    const context = page.context();

    // Each test starts with exactly the fixture's page.
    expect(context.pages()).toHaveLength(1);

    const popup = await windowsPage.openNewWindow();
    expect(context.pages()).toHaveLength(2);
    expect(context.pages()).toContain(popup);

    await popup.close();
    expect(context.pages()).toHaveLength(1);
    expect(context.pages()).not.toContain(popup);
  });

  // ─── Concurrent pages ─────────────────────────────────────────────────────

  test('TC04 - Opener stays interactive while popup is open; bringToFront switches focus', async ({ page }) => {
    const popup = await windowsPage.openNewWindow();
    await expect(windowsPage.getPopupHeading(popup)).toHaveText(NEW_WINDOW_HEADING);

    // Switch focus to the opener and prove it is still usable.
    await page.bringToFront();
    await expect(windowsPage.getOpenerHeading()).toHaveText(OPENER_HEADING);
    await expect(windowsPage.getOpenLink()).toBeVisible();

    // The popup handle remains valid — it was not garbage-collected.
    await popup.bringToFront();
    await expect(popup).toHaveTitle(NEW_WINDOW_TITLE);
  });

  // ─── Multi-window handling ────────────────────────────────────────────────

  test('TC05 - Opening three popups yields four pages; closing all leaves only the opener', async ({ page }) => {
    const context = page.context();
    const popups = await windowsPage.openMultipleWindows(3);

    expect(context.pages()).toHaveLength(4);
    for (const popup of popups) {
      await expect(popup).toHaveURL(new RegExp(`${NEW_WINDOW_PATH}$`));
      await expect(windowsPage.getPopupHeading(popup)).toHaveText(NEW_WINDOW_HEADING);
    }

    for (const popup of popups) {
      await popup.close();
    }
    expect(context.pages()).toHaveLength(1);
  });

  // ─── State transition ────────────────────────────────────────────────────

  test('TC06 - Open → close → re-open succeeds', async ({ page }) => {
    // State Transition: opener → popup → opener → popup. Proves the
    // open flow is idempotent and the page event keeps firing after a close.
    const first = await windowsPage.openNewWindow();
    await expect(windowsPage.getPopupHeading(first)).toHaveText(NEW_WINDOW_HEADING);
    await first.close();
    expect(page.context().pages()).toHaveLength(1);

    const second = await windowsPage.openNewWindow();
    await expect(windowsPage.getPopupHeading(second)).toHaveText(NEW_WINDOW_HEADING);
    expect(page.context().pages()).toHaveLength(2);
  });
});
