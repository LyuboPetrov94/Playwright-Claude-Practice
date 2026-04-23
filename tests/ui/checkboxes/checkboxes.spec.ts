import { test, expect } from '../../../fixtures';
import { CheckboxesPage } from '../../../pages/CheckboxesPage';

/**
 * Checkboxes tests for https://practice.expandtesting.com/checkboxes
 *
 * Page behaviour:
 *   - Two native <input type="checkbox"> elements with no JS handlers.
 *   - #checkbox1 starts unchecked; #checkbox2 starts checked (has `checked` attr).
 *   - Labels are wired via label[for="..."], so clicking a label toggles its checkbox.
 *   - No form, no submit, no server interaction — purely client-side state.
 *
 * Test design techniques applied (ISTQB):
 *   - Equivalence partitioning: starts-unchecked vs starts-checked
 *   - State transition: unchecked ⇄ checked, including round-trip
 *   - Independence: a toggle on one element must not affect the other
 */

test.describe('Checkboxes', () => {
  let checkboxesPage: CheckboxesPage;

  test.beforeEach(async ({ page }) => {
    checkboxesPage = new CheckboxesPage(page);
    await checkboxesPage.goto();
  });

  // ── Initial state ─────────────────────────────────────────────────────────

  test('TC01 - Checkbox 1 loads unchecked, enabled, with label "Checkbox 1"', async () => {
    await expect(checkboxesPage.getCheckbox1()).not.toBeChecked();
    await expect(checkboxesPage.getCheckbox1()).toBeEnabled();
    await expect(checkboxesPage.getLabel1()).toHaveText('Checkbox 1');
  });

  test('TC02 - Checkbox 2 loads checked, enabled, with label "Checkbox 2"', async () => {
    await expect(checkboxesPage.getCheckbox2()).toBeChecked();
    await expect(checkboxesPage.getCheckbox2()).toBeEnabled();
    await expect(checkboxesPage.getLabel2()).toHaveText('Checkbox 2');
  });

  // ── State transition: click the input ─────────────────────────────────────

  test('TC03 - Clicking unchecked Checkbox 1 checks it', async () => {
    await checkboxesPage.clickCheckbox1();

    await expect(checkboxesPage.getCheckbox1()).toBeChecked();
  });

  test('TC04 - Clicking checked Checkbox 2 unchecks it', async () => {
    await checkboxesPage.clickCheckbox2();

    await expect(checkboxesPage.getCheckbox2()).not.toBeChecked();
  });

  test('TC05 - Two clicks on Checkbox 2 return it to checked (checked → unchecked → checked)', async () => {
    await checkboxesPage.clickCheckbox2();
    await expect(checkboxesPage.getCheckbox2()).not.toBeChecked();

    await checkboxesPage.clickCheckbox2();
    await expect(checkboxesPage.getCheckbox2()).toBeChecked();
  });

  test('TC06 - Two clicks on Checkbox 1 return it to unchecked (unchecked → checked → unchecked)', async () => {
    await checkboxesPage.clickCheckbox1();
    await expect(checkboxesPage.getCheckbox1()).toBeChecked();

    await checkboxesPage.clickCheckbox1();
    await expect(checkboxesPage.getCheckbox1()).not.toBeChecked();
  });

  // ── Label interaction ─────────────────────────────────────────────────────

  test('TC07 - Clicking the "Checkbox 1" label toggles Checkbox 1', async () => {
    await checkboxesPage.clickLabel1();

    await expect(checkboxesPage.getCheckbox1()).toBeChecked();
  });

  test('TC08 - Clicking the "Checkbox 2" label toggles Checkbox 2', async () => {
    await checkboxesPage.clickLabel2();

    await expect(checkboxesPage.getCheckbox2()).not.toBeChecked();
  });

  // ── Keyboard interaction ──────────────────────────────────────────────────

  test('TC09 - Pressing Space on focused Checkbox 1 toggles it (unchecked → checked)', async () => {
    await checkboxesPage.pressSpaceOnCheckbox1();

    await expect(checkboxesPage.getCheckbox1()).toBeChecked();
  });

  test('TC10 - Pressing Space on focused Checkbox 2 toggles it (checked → unchecked)', async () => {
    await checkboxesPage.pressSpaceOnCheckbox2();

    await expect(checkboxesPage.getCheckbox2()).not.toBeChecked();
  });

  // ── Independence ──────────────────────────────────────────────────────────

  test('TC11 - Toggling Checkbox 1 does not change Checkbox 2', async () => {
    await checkboxesPage.clickCheckbox1();

    await expect(checkboxesPage.getCheckbox1()).toBeChecked();
    await expect(checkboxesPage.getCheckbox2()).toBeChecked();
  });

  test('TC12 - Toggling Checkbox 2 does not change Checkbox 1', async () => {
    await checkboxesPage.clickCheckbox2();

    await expect(checkboxesPage.getCheckbox2()).not.toBeChecked();
    await expect(checkboxesPage.getCheckbox1()).not.toBeChecked();
  });

  // ── Reload behaviour ──────────────────────────────────────────────────────

  test('TC13 - Reload restores defaults (cb1 unchecked, cb2 checked) after both are toggled', async () => {
    await checkboxesPage.clickCheckbox1();
    await checkboxesPage.clickCheckbox2();
    await expect(checkboxesPage.getCheckbox1()).toBeChecked();
    await expect(checkboxesPage.getCheckbox2()).not.toBeChecked();

    await checkboxesPage.reload();

    await expect(checkboxesPage.getCheckbox1()).not.toBeChecked();
    await expect(checkboxesPage.getCheckbox2()).toBeChecked();
  });
});
