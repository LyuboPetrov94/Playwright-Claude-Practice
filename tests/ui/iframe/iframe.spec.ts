import { test, expect } from '../../../fixtures';
import {
  IframePage,
  FRAME_HEADING,
  VALIDATION_ERROR,
  SUCCESS_MESSAGE,
} from '../../../pages/IframePage';

/**
 * IFrame tests for https://practice.expandtesting.com/iframe
 *
 * The page advertises three "iframe" sections, but only one is testable —
 * see CLAUDE.md gotcha for the YouTube/TinyMCE caveats. The tests target
 * the email-subscribe iframe (#email-subscribe, same-origin).
 *
 * The iframe embeds a Bootstrap `needs-validation` form:
 *   - h1#prompt-message ("Send updates to my inbox ...")
 *   - input#email (type=email, required)
 *   - button#btn-subscribe (submit)
 *   - .invalid-feedback ("Please enter a valid email address.")
 *
 * Behavior is purely client-side. On submit the iframe's inline JS runs
 * emailInput.checkValidity():
 *   - Invalid → form prevents default, .invalid-feedback becomes visible.
 *   - Valid   → form's parent #subscribe div is replaced with
 *               <div id="success-message" class="alert alert-info">
 *                 You are now subscribed!
 *               </div>
 *
 * Demonstrates: page.frameLocator() to enter a frame, scoped Locators for
 * frame-internal interactions and assertions.
 *
 * Test cases:
 *   - Frame access smoke test           (TC01)
 *   - Negative paths (empty, malformed) (TC02–TC03)
 *   - Happy path                        (TC04)
 *   - State transition (recovery)       (TC05)
 */

test.describe('IFrame', () => {
  let iframePage: IframePage;

  test.beforeEach(async ({ page }) => {
    iframePage = new IframePage(page);
    await iframePage.goto();
  });

  // ─── Frame access ─────────────────────────────────────────────────────────

  test('TC01 - frameLocator finds the iframe heading', async () => {
    // Smoke test: page.frameLocator('#email-subscribe') resolves and a
    // Locator scoped to the frame returns the expected heading. toHaveText
    // auto-retries until the iframe's DOM is loaded — no explicit wait needed.
    await expect(iframePage.getHeading()).toHaveText(FRAME_HEADING);
  });

  // ─── Negative paths ───────────────────────────────────────────────────────

  test('TC02 - Submit empty input shows validation error inside the frame', async () => {
    // EP: invalid class — empty (HTML5 `required` violation).
    // Bootstrap needs-validation pattern: form has novalidate + JS that
    // blocks submit on !checkValidity() and adds `was-validated` to the
    // form, which un-hides .invalid-feedback via CSS.
    await iframePage.submitEmpty();

    await expect(iframePage.getValidationError()).toBeVisible();
    await expect(iframePage.getValidationError()).toHaveText(VALIDATION_ERROR);
  });

  test('TC03 - Submit malformed email shows validation error inside the frame', async () => {
    // EP: invalid class — present-but-malformed (HTML5 `type=email` violation).
    // Distinct from TC02's "empty" class — different validity violation, same
    // visible outcome. EP rule keeps both.
    await iframePage.subscribe('notanemail');

    await expect(iframePage.getValidationError()).toBeVisible();
    await expect(iframePage.getValidationError()).toHaveText(VALIDATION_ERROR);
  });

  // ─── Happy path ───────────────────────────────────────────────────────────

  test('TC04 - Subscribe with a valid email replaces the form with a success message', async () => {
    // EP: valid class. The script replaces #subscribe innerHTML on success,
    // so the form (and its input + button) disappears and only
    // #success-message remains.
    await iframePage.subscribe('test@example.com');

    await expect(iframePage.getSuccessMessage()).toBeVisible();
    await expect(iframePage.getSuccessMessage()).toHaveText(SUCCESS_MESSAGE);
  });

  // ─── State transition ────────────────────────────────────────────────────

  test('TC05 - Empty submit error recovers when a valid email is supplied', async () => {
    // State Transition: empty → error → recovery → success.
    // Exercises the full flow inside a single iframe in one test.
    await iframePage.submitEmpty();
    await expect(iframePage.getValidationError()).toBeVisible();

    await iframePage.subscribe('test@example.com');
    await expect(iframePage.getSuccessMessage()).toBeVisible();
  });
});
