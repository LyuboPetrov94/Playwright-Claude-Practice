import { test, expect } from '../../../fixtures';
import { RadioButtonsPage } from '../../../pages/RadioButtonsPage';

/**
 * Radio Buttons tests for
 * https://practice.expandtesting.com/radio-buttons
 *
 * Two radio button groups: Favorite Color (5 options, 1 disabled)
 * and Favorite Sport (3 options).
 *
 * Test cases:
 *   - Color default state      (TC01–TC03)
 *   - Color selection           (TC04–TC06)
 *   - Sport default state       (TC07–TC08)
 *   - Sport selection           (TC09–TC10)
 *   - Cross-group independence  (TC11)
 */

test.describe('Radio Buttons', () => {
  let radioPage: RadioButtonsPage;

  test.beforeEach(async ({ page }) => {
    radioPage = new RadioButtonsPage(page);
    await radioPage.goto();
  });

  // ─── Favorite Color — Default State ─────────────────────────────────────────

  test('TC01 - Default state: "Blue" is checked, all other enabled options are unchecked', async () => {
    // Equivalence Partitioning: initial checked state
    await expect(radioPage.getBlueRadio()).toBeChecked();
    await expect(radioPage.getRedRadio()).not.toBeChecked();
    await expect(radioPage.getYellowRadio()).not.toBeChecked();
    await expect(radioPage.getBlackRadio()).not.toBeChecked();
    await expect(radioPage.getGreenRadio()).not.toBeChecked();
  });

  test('TC02 - "Green" radio button is disabled', async () => {
    // Equivalence Partitioning: disabled option (distinct class)
    await expect(radioPage.getGreenRadio()).toBeDisabled();
  });

  test('TC03 - All 5 color radio buttons are visible with correct labels', async () => {
    // Equivalence Partitioning: visibility and label correctness
    const colors = [
      { id: 'blue', label: 'Blue' },
      { id: 'red', label: 'Red' },
      { id: 'yellow', label: 'Yellow' },
      { id: 'black', label: 'Black' },
      { id: 'green', label: 'Green' },
    ];

    for (const { id, label } of colors) {
      await expect(radioPage.getColorLabel(id)).toBeVisible();
      await expect(radioPage.getColorLabel(id)).toHaveText(label);
    }
  });

  // ─── Favorite Color — Selection ─────────────────────────────────────────────

  test('TC04 - Click "Red": "Red" becomes checked, "Blue" becomes unchecked', async () => {
    // State Transition: Blue (checked) → Red (checked), mutual exclusion
    await radioPage.selectColor('red');

    await expect(radioPage.getRedRadio()).toBeChecked();
    await expect(radioPage.getBlueRadio()).not.toBeChecked();
  });

  test('TC05 - Click each enabled option in sequence: only the last clicked remains checked', async () => {
    // State Transition: cycle through all enabled options
    const colors: ('blue' | 'red' | 'yellow' | 'black')[] = ['red', 'yellow', 'black', 'blue'];

    for (const color of colors) {
      await radioPage.selectColor(color);
    }

    // Only the last selected ("blue") should be checked
    await expect(radioPage.getBlueRadio()).toBeChecked();
    await expect(radioPage.getRedRadio()).not.toBeChecked();
    await expect(radioPage.getYellowRadio()).not.toBeChecked();
    await expect(radioPage.getBlackRadio()).not.toBeChecked();
  });

  test('TC06 - Click disabled "Green": it remains unchecked, previous selection unchanged', async () => {
    // Equivalence Partitioning: invalid action on disabled element
    await expect(radioPage.getGreenRadio()).toBeDisabled();

    // force: true bypasses the actionability check so Playwright sends
    // the click — but the browser must still ignore it on a disabled input
    await radioPage.getGreenRadio().click({ force: true });

    await expect(radioPage.getGreenRadio()).not.toBeChecked();
    await expect(radioPage.getBlueRadio()).toBeChecked();
  });

  // ─── Favorite Sport — Default State ─────────────────────────────────────────

  test('TC07 - Default state: "Tennis" is checked, others are unchecked', async () => {
    // Equivalence Partitioning: initial checked state
    await expect(radioPage.getTennisRadio()).toBeChecked();
    await expect(radioPage.getBasketballRadio()).not.toBeChecked();
    await expect(radioPage.getFootballRadio()).not.toBeChecked();
  });

  test('TC08 - All 3 sport radio buttons are visible, enabled, with correct labels', async () => {
    // Equivalence Partitioning: visibility, enabled state, label correctness
    const sports = [
      { id: 'basketball', label: 'Basketball' },
      { id: 'football', label: 'Football' },
      { id: 'tennis', label: 'Tennis' },
    ];

    for (const { id, label } of sports) {
      await expect(radioPage.getSportLabel(id)).toBeVisible();
      await expect(radioPage.getSportLabel(id)).toHaveText(label);
    }

    await expect(radioPage.getBasketballRadio()).toBeEnabled();
    await expect(radioPage.getFootballRadio()).toBeEnabled();
    await expect(radioPage.getTennisRadio()).toBeEnabled();
  });

  // ─── Favorite Sport — Selection ─────────────────────────────────────────────

  test('TC09 - Click "Basketball": "Basketball" becomes checked, "Tennis" becomes unchecked', async () => {
    // State Transition: Tennis (checked) → Basketball (checked), mutual exclusion
    await radioPage.selectSport('basketball');

    await expect(radioPage.getBasketballRadio()).toBeChecked();
    await expect(radioPage.getTennisRadio()).not.toBeChecked();
  });

  test('TC10 - Click each sport option in sequence: only the last clicked remains checked', async () => {
    // State Transition: cycle through all options
    await radioPage.selectSport('basketball');
    await radioPage.selectSport('football');
    await radioPage.selectSport('tennis');

    await expect(radioPage.getTennisRadio()).toBeChecked();
    await expect(radioPage.getBasketballRadio()).not.toBeChecked();
    await expect(radioPage.getFootballRadio()).not.toBeChecked();
  });

  // ─── Cross-Group Independence ───────────────────────────────────────────────

  test('TC11 - Selecting a color does not affect sport selection, and vice versa', async () => {
    // Equivalence Partitioning: group independence
    // Change color → sport should remain unchanged
    await radioPage.selectColor('red');
    await expect(radioPage.getRedRadio()).toBeChecked();
    await expect(radioPage.getTennisRadio()).toBeChecked();

    // Change sport → color should remain unchanged
    await radioPage.selectSport('football');
    await expect(radioPage.getFootballRadio()).toBeChecked();
    await expect(radioPage.getRedRadio()).toBeChecked();
  });
});
