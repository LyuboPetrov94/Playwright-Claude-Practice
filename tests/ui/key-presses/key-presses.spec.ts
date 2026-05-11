import { test, expect } from '../../../fixtures';
import { KeyPressesPage } from '../../../pages/KeyPressesPage';

/**
 * Key presses tests for https://practice.expandtesting.com/key-presses
 *
 * Page source (/assets/js/key-presses.js):
 *   $(document).keydown(function (event) {
 *     output = keyboardMap[event.which];
 *     log("You entered: " + output);
 *   });
 *
 * `event.which` is the legacy jQuery keyCode (the physical key), not
 * the character. So pressing 'a' (no Shift) yields 65 → "A". Pressing
 * 'Shift+a' fires two keydowns — Shift first ("SHIFT"), then 'a' ("A").
 * Last keydown wins.
 *
 * Demonstrates: `page.keyboard.press()` for named/single keys,
 * `page.keyboard.type()` for sequences, modifier chords via `'Shift+a'`,
 * focus-aware vs focus-agnostic capture (handler is on document so it
 * fires regardless of focus, but tests focus `#target` for consistency).
 *
 * Test cases:
 *   - Smoke                                       (TC01)
 *   - Alphanumeric BVA (a/z/0/9)                  (TC02–TC05)
 *   - Specials (Enter, Tab, Escape, Space, BS)    (TC06–TC10)
 *   - Arrow keys                                  (TC11–TC14)
 *   - Modifiers pressed alone                     (TC15–TC18)
 *   - Combo (Shift+a) — last keydown wins         (TC19)
 *   - State transition `a`+`b` with #target check (TC20)
 *   - Typed alphanumeric sequence                 (TC21)
 *   - Typed unshifted-special sequence            (TC22)
 */

// Data-driven cases. Each row carries its TC number explicitly — keeps
// the generated test titles sequential and easy to scan.
const ALPHANUMERIC_BVA = [
  { tc: 'TC02', key: 'a', expected: 'A' },
  { tc: 'TC03', key: 'z', expected: 'Z' },
  { tc: 'TC04', key: '0', expected: '0' },
  { tc: 'TC05', key: '9', expected: '9' },
] as const;

const SPECIAL_KEYS = [
  { tc: 'TC06', key: 'Enter', expected: 'ENTER' },
  { tc: 'TC07', key: 'Tab', expected: 'TAB' },
  { tc: 'TC08', key: 'Escape', expected: 'ESCAPE' },
  { tc: 'TC09', key: 'Space', expected: 'SPACE' },
  { tc: 'TC10', key: 'Backspace', expected: 'BACK_SPACE' },
] as const;

const ARROW_KEYS = [
  { tc: 'TC11', key: 'ArrowLeft', expected: 'LEFT' },
  { tc: 'TC12', key: 'ArrowUp', expected: 'UP' },
  { tc: 'TC13', key: 'ArrowRight', expected: 'RIGHT' },
  { tc: 'TC14', key: 'ArrowDown', expected: 'DOWN' },
] as const;

const MODIFIER_KEYS = [
  { tc: 'TC15', key: 'Shift', expected: 'SHIFT' },
  { tc: 'TC16', key: 'Control', expected: 'CONTROL' },
  { tc: 'TC17', key: 'Alt', expected: 'ALT' },
  // Meta → keyCode 91 → keyboardMap[91] = "WIN" (the practice site's
  // naming reflects Windows-key heritage; same code on Mac for Cmd).
  { tc: 'TC18', key: 'Meta', expected: 'WIN' },
] as const;

test.describe('Key Presses — /key-presses', () => {
  let keyPressesPage: KeyPressesPage;

  test.beforeEach(async ({ page }) => {
    keyPressesPage = new KeyPressesPage(page);
    await keyPressesPage.goto();
    // Do NOT auto-focus #target here. The input is wrapped in a hidden
    // <form> (not visible in the accessibility tree), so pressing Enter
    // while the input has focus submits the form and reloads the page
    // to "/key-presses?", wiping #result before the assertion runs. The
    // handler is bound to `document.keydown` and fires regardless of
    // focus, so single-key TCs work fine without it. Tests that need
    // to read #target.value (TC19–TC22) focus the input explicitly.
  });

  // ─── Smoke ────────────────────────────────────────────────────────────────

  test('TC01 - Page renders an empty input and an empty result', async () => {
    await expect(keyPressesPage.getInput()).toHaveValue('');
    await expect(keyPressesPage.getResult()).toBeEmpty();
  });

  // ─── Alphanumeric (BVA: a, z, 0, 9) ───────────────────────────────────────

  for (const { tc, key, expected } of ALPHANUMERIC_BVA) {
    test(`${tc} - Press '${key}' shows "${expected}"`, async ({ page }) => {
      await page.keyboard.press(key);
      await expect(keyPressesPage.getResult()).toHaveText(keyPressesPage.expectedResult(expected));
    });
  }

  // ─── Specials (Enter, Tab, Escape, Space, Backspace) ──────────────────────

  for (const { tc, key, expected } of SPECIAL_KEYS) {
    test(`${tc} - Press '${key}' shows "${expected}"`, async ({ page }) => {
      await page.keyboard.press(key);
      await expect(keyPressesPage.getResult()).toHaveText(keyPressesPage.expectedResult(expected));
    });
  }

  // ─── Arrow keys ───────────────────────────────────────────────────────────

  for (const { tc, key, expected } of ARROW_KEYS) {
    test(`${tc} - Press '${key}' shows "${expected}"`, async ({ page }) => {
      await page.keyboard.press(key);
      await expect(keyPressesPage.getResult()).toHaveText(keyPressesPage.expectedResult(expected));
    });
  }

  // ─── Modifiers pressed alone (Shift / Control / Alt / Meta) ───────────────

  for (const { tc, key, expected } of MODIFIER_KEYS) {
    test(`${tc} - Press '${key}' alone shows "${expected}"`, async ({ page }) => {
      await page.keyboard.press(key);
      await expect(keyPressesPage.getResult()).toHaveText(keyPressesPage.expectedResult(expected));
    });
  }

  // ─── Modifier combo ───────────────────────────────────────────────────────

  test('TC19 - Press Shift+a — handler fires twice; last keydown wins; input still receives lowercase \'a\'', async ({ page }) => {
    // Playwright dispatches: keydown(Shift) → keydown(a) → keyup(a) → keyup(Shift).
    // The handler runs on every keydown and writes to #result via
    // innerHTML, so after both keydowns the final state reflects the
    // last one — the letter (keyCode 65 → "A"), not the modifier.
    //
    // Subtle quirk: although Shift is held during the `a` keydown,
    // Playwright's `press('Shift+a')` chord still types lowercase 'a'
    // into the focused input. The chord syntax is for combos like
    // Shift+Tab or Ctrl+C — it does NOT compose uppercase characters.
    // To actually type 'A', call `press('A')` and Playwright handles
    // the Shift internally. This TC asserts the lowercase 'a' that
    // the chord actually produces so the behaviour is captured, not
    // just stumbled on.
    await keyPressesPage.focusInput();
    await page.keyboard.press('Shift+a');
    await expect(keyPressesPage.getResult()).toHaveText(keyPressesPage.expectedResult('A'));
    await expect(keyPressesPage.getInput()).toHaveValue('a');
  });

  // ─── State transition + input value ───────────────────────────────────────

  test('TC20 - Press \'a\' then \'b\' — #result reflects the last key; #target accumulates both', async ({ page }) => {
    // Two distinct presses, two keydown events. The handler overwrites
    // #result each time. Meanwhile the focused input accumulates the
    // typed characters, so the final input value is "ab".
    await keyPressesPage.focusInput();
    await page.keyboard.press('a');
    await page.keyboard.press('b');
    await expect(keyPressesPage.getResult()).toHaveText(keyPressesPage.expectedResult('B'));
    await expect(keyPressesPage.getInput()).toHaveValue('ab');
  });

  // ─── Typed sequences ──────────────────────────────────────────────────────

  test('TC21 - Type alphanumeric "abc123" — #target gets the full string; #result holds last keycode name', async ({ page }) => {
    await keyPressesPage.focusInput();
    await page.keyboard.type('abc123');
    await expect(keyPressesPage.getInput()).toHaveValue('abc123');
    await expect(keyPressesPage.getResult()).toHaveText(keyPressesPage.expectedResult('3'));
  });

  test('TC22 - Type unshifted specials ".,/" — #target gets the chars; #result holds the last keycode name "SLASH"', async ({ page }) => {
    // These three symbols all sit on un-shifted physical keys, so each
    // keydown's event.which maps cleanly to a friendly name:
    //   "." → 190 → PERIOD
    //   "," → 188 → COMMA
    //   "/" → 191 → SLASH
    // Shifted symbols like "!" would muddy the assertion because
    // event.which is the keycode (e.g. 49 for "1"), not the character.
    await keyPressesPage.focusInput();
    await page.keyboard.type('.,/');
    await expect(keyPressesPage.getInput()).toHaveValue('.,/');
    await expect(keyPressesPage.getResult()).toHaveText(keyPressesPage.expectedResult('SLASH'));
  });
});
