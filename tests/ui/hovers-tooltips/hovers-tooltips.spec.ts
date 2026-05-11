import { test, expect } from '../../../fixtures';
import { HoversPage, USER_IDS } from '../../../pages/HoversPage';
import {
  TooltipsPage,
  TEXT_TOOLTIP_BUTTON_IDS,
  ALL_TOOLTIP_BUTTON_IDS,
  HTML_TOOLTIP_TITLE,
} from '../../../pages/TooltipsPage';

/**
 * Hovers & Tooltips tests covering two practice-site pages:
 *   - /hovers   — CSS-only `.figcaption` reveal on `.figure:hover`
 *   - /tooltips — Bootstrap 5 tooltips (`data-bs-toggle="tooltip"`)
 *
 * Demonstrates: `locator.hover()`, mouse-leave via `page.mouse.move(0, 0)`,
 * `toBeVisible/toBeHidden` against display:none, `toBeAttached/not.toBeAttached`
 * against Bootstrap's dynamic tooltip DOM, the Bootstrap focus-retention
 * behaviour (click-then-mouse-leave keeps tooltip; click-elsewhere hides it).
 *
 * Two `test.describe` blocks share the spec file because both pages are
 * tiny variations of the same hover-reveal concept.
 *
 * Test cases:
 *   Hovers:
 *     - Smoke                                    (TC01)
 *     - Hover user-N reveals only its caption    (TC02-TC04)
 *     - State transition across all three users  (TC05)
 *     - Click "View profile" navigates           (TC06-TC08)
 *   Tooltips:
 *     - Smoke                                    (TC09)
 *     - Per-button hover shows correct text      (TC10-TC13)
 *     - HTML tooltip renders inner markup        (TC14)
 *     - Mouse-leave detaches tooltip per button  (TC15)
 *     - Click retains tooltip on mouse-leave     (TC16)
 *     - Click another button / outside hides     (TC17)
 */

// ─────────────────────────────────────────────────────────────────────────────
// /hovers
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Hovers — /hovers', () => {
  let hoversPage: HoversPage;

  test.beforeEach(async ({ page }) => {
    hoversPage = new HoversPage(page);
    await hoversPage.goto();
  });

  test('TC01 - Page renders 3 figures and all captions are hidden initially', async () => {
    await expect(hoversPage.getFigures()).toHaveCount(3);
    for (const id of USER_IDS) {
      await expect(hoversPage.getFigcaption(id)).toBeHidden();
    }
  });

  // Per-user reveal-isolation tests. Same body, looped over [1, 2, 3].
  // EP rule says one test per class, but the user explicitly requested
  // coverage of each user — these are data points within the same class,
  // documented separately to make any per-user regression visible.
  for (const id of USER_IDS) {
    const others = USER_IDS.filter(other => other !== id);
    test(`TC0${id + 1} - Hover user-${id} reveals only its caption`, async () => {
      await hoversPage.hoverUser(id);
      await expect(hoversPage.getFigcaption(id)).toBeVisible();
      for (const other of others) {
        await expect(hoversPage.getFigcaption(other)).toBeHidden();
      }
    });
  }

  test('TC05 - State transition: user-1 → user-2 → user-3 reveal in sequence; prior caption hides', async () => {
    // State transition across all three users. After hovering user-N, only
    // user-N's caption should be visible. The previous user's caption
    // should hide automatically as the hover target changes.
    for (let i = 0; i < USER_IDS.length; i++) {
      const current = USER_IDS[i];
      await hoversPage.hoverUser(current);
      await expect(hoversPage.getFigcaption(current)).toBeVisible();
      for (const other of USER_IDS) {
        if (other !== current) {
          await expect(hoversPage.getFigcaption(other)).toBeHidden();
        }
      }
    }
  });

  // Per-user navigation tests — same flow, different target URL.
  for (const id of USER_IDS) {
    test(`TC0${id + 5} - Hover user-${id} and click "View profile" navigates to /users/${id}`, async ({ page }) => {
      await hoversPage.hoverUser(id);
      await hoversPage.getViewProfileLink(id).click();

      await expect(page).toHaveURL(new RegExp(`/users/${id}$`));
      // The page title is the most specific assertion of "right user" —
      // the H1 reads "User Profile..." with no number.
      await expect(page).toHaveTitle(new RegExp(`User #${id} Profile`));
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// /tooltips
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Tooltips — /tooltips', () => {
  let tooltipsPage: TooltipsPage;

  test.beforeEach(async ({ page }) => {
    tooltipsPage = new TooltipsPage(page);
    await tooltipsPage.goto();
  });

  test('TC09 - Page shows 5 tooltip buttons; no tooltip in the DOM initially', async () => {
    await expect(tooltipsPage.getButtons()).toHaveCount(5);
    await expect(tooltipsPage.getTooltip()).toHaveCount(0);
  });

  // Per-button plain-text hover assertions. Each button declares its
  // tooltip text via the `title` attribute, which Bootstrap copies into
  // .tooltip-inner on show. We read the live attribute rather than
  // hard-coding strings to keep the test data-driven.
  for (const id of TEXT_TOOLTIP_BUTTON_IDS) {
    test(`TC${10 + id - 1} - Hover #btn${id} shows a tooltip whose text equals the button title`, async () => {
      const expectedText = await tooltipsPage.getButton(id).getAttribute('title');
      // getAttribute returns string | null — null means the DOM was
      // mutated unexpectedly (Bootstrap normally preserves `title`).
      expect(expectedText).not.toBeNull();

      await tooltipsPage.hoverButton(id);
      await expect(tooltipsPage.getTooltipInner()).toHaveText(expectedText!);
    });
  }

  test('TC14 - Hover #btn5 (HTML tooltip) renders <em>, <u>, <b> inside .tooltip-inner', async () => {
    // data-bs-html=true makes Bootstrap render the title attribute as HTML
    // rather than text. The literal title string is the markup; toBeAttached
    // on each element proves the parser kept them as DOM nodes, not text.
    await tooltipsPage.hoverButton(5);

    await expect(tooltipsPage.getTooltipInner().locator('em')).toHaveText('Tooltip');
    await expect(tooltipsPage.getTooltipInner().locator('u')).toHaveText('with');
    await expect(tooltipsPage.getTooltipInner().locator('b')).toHaveText('HTML');

    // Sanity check: the literal markup never reaches the user as text.
    await expect(tooltipsPage.getTooltipInner()).not.toContainText(HTML_TOOLTIP_TITLE);
  });

  test('TC15 - State transition for each button: hover attaches tooltip; mouse-leave detaches it', async () => {
    // Cross-button mouse-leave coverage. Each iteration drives a full
    // attach/detach cycle; the next iteration's hover is preceded by the
    // implicit pointer move from `leaveButtons` keeping the state machine
    // clean.
    for (const id of ALL_TOOLTIP_BUTTON_IDS) {
      await tooltipsPage.hoverButton(id);
      await expect(tooltipsPage.getTooltip()).toBeAttached();

      await tooltipsPage.leaveButtons();
      await expect(tooltipsPage.getTooltip()).not.toBeAttached();
    }
  });

  test('TC16 - Click retains the tooltip after mouse-leave (focus retention)', async () => {
    // Bootstrap's default trigger is "hover focus". Hovering shows the
    // tooltip; clicking gives the button focus; the focus trigger keeps
    // the tooltip visible even after the pointer leaves.
    await tooltipsPage.hoverButton(1);
    await tooltipsPage.getButton(1).click();
    await tooltipsPage.leaveButtons();

    await expect(tooltipsPage.getTooltip()).toBeAttached();
  });

  test('TC17 - Click another button or outside the buttons hides the focused tooltip', async ({ page }) => {
    // Bootstrap 5 strips the `title` attribute the first time it shows a
    // tooltip on an element (so the browser doesn't render its own native
    // tooltip alongside Bootstrap's). Read both originals *before* any
    // hover so the captured strings outlive the DOM mutation.
    const btn1Title = await tooltipsPage.getButton(1).getAttribute('title');
    const btn2Title = await tooltipsPage.getButton(2).getAttribute('title');
    expect(btn1Title).not.toBeNull();
    expect(btn2Title).not.toBeNull();

    // State transition exercising both focus-blur paths in one chain:
    //   1. hover+click btn1 → btn1 tooltip persists via focus
    //   2. click btn2       → btn1 blurs (tooltip detaches), btn2 takes focus
    //   3. click <h1>       → btn2 blurs (tooltip detaches)
    await tooltipsPage.hoverButton(1);
    await tooltipsPage.getButton(1).click();
    await expect(tooltipsPage.getTooltipInner()).toHaveText(btn1Title!);

    // Hover before click ensures Bootstrap is in a consistent show-state
    // for btn2; relying on click alone can race the focus-driven show.
    await tooltipsPage.hoverButton(2);
    await tooltipsPage.getButton(2).click();
    await expect(tooltipsPage.getTooltip()).toHaveCount(1);
    await expect(tooltipsPage.getTooltipInner()).toHaveText(btn2Title!);

    // Click an out-of-button element. The page H1 is always present and
    // is not itself a tooltip trigger.
    await page.locator('main h1').click();
    await expect(tooltipsPage.getTooltip()).not.toBeAttached();
  });
});
