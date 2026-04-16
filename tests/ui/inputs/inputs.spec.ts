import { test, expect } from '../../../fixtures';
import { WebInputsPage } from '../../../pages/WebInputsPage';

/**
 * Web Inputs tests for https://practice.expandtesting.com/inputs
 *
 * Page has four input fields (number, text, password, date), a Display button
 * that reflects values in output elements, and a Clear button that resets everything.
 *
 * Test cases ordered by field:
 *   - Number input        (TC01–TC03)
 *   - Happy path          (TC04)
 *   - Text input          (TC05–TC06)
 *   - Password input      (TC07)
 *   - Date input          (TC08–TC09)
 *   - Buttons             (TC10–TC12)
 *   - Additional coverage (TC13–TC18)
 */

test.describe('Web Inputs', () => {
  let inputsPage: WebInputsPage;

  test.beforeEach(async ({ page }) => {
    inputsPage = new WebInputsPage(page);
    await inputsPage.goto();
  });

  // ─── Number Input ──────────────────────────────────────────────────────────

  test('TC01 - Number: positive integer is displayed correctly', async () => {
    // Equivalence class: valid numeric — positive integer
    await inputsPage.fillNumber('42');
    await inputsPage.clickDisplay();

    await expect(inputsPage.getNumberOutput()).toHaveText('42');
  });

  test('TC02 - Number: negative number is accepted and displayed', async () => {
    // Equivalence class: valid numeric — negative partition
    await inputsPage.fillNumber('-10');
    await inputsPage.clickDisplay();

    await expect(inputsPage.getNumberOutput()).toHaveText('-10');
  });

  test('TC03 - Number: decimal value is accepted and displayed', async () => {
    // Equivalence class: valid numeric — decimal partition
    await inputsPage.fillNumber('3.14');
    await inputsPage.clickDisplay();

    await expect(inputsPage.getNumberOutput()).toHaveText('3.14');
  });

  // ─── Happy Path ────────────────────────────────────────────────────────────

  test('TC04 - Happy path: all inputs filled display all correct outputs', async () => {
    // All four fields filled — assert every output matches its input
    // Playwright requires date input in YYYY-MM-DD format (HTML standard)
    await inputsPage.fillNumber('99');
    await inputsPage.fillText('hello');
    await inputsPage.fillPassword('secret');
    await inputsPage.fillDate('2024-06-15');
    await inputsPage.clickDisplay();

    await expect(inputsPage.getNumberOutput()).toHaveText('99');
    await expect(inputsPage.getTextOutput()).toHaveText('hello');
    await expect(inputsPage.getPasswordOutput()).toHaveText('secret');
    await expect(inputsPage.getDateOutput()).not.toBeEmpty();
  });

  // ─── Text Input ────────────────────────────────────────────────────────────

  test('TC05 - Text: standard alphanumeric string is displayed correctly', async () => {
    // Equivalence class: standard valid text
    await inputsPage.fillText('Hello World 123');
    await inputsPage.clickDisplay();

    await expect(inputsPage.getTextOutput()).toHaveText('Hello World 123');
  });

  test('TC06 - Text: special characters are accepted and displayed', async () => {
    // Equivalence class: special character partition
    await inputsPage.fillText('!@#$%^&*()');
    await inputsPage.clickDisplay();

    await expect(inputsPage.getTextOutput()).toHaveText('!@#$%^&*()');
  });

  // ─── Password Input ────────────────────────────────────────────────────────

  test('TC07 - Password: value is accepted and revealed in output', async () => {
    // Practice site reveals password values in the output display
    await inputsPage.fillPassword('MySecret123!');
    await inputsPage.clickDisplay();

    await expect(inputsPage.getPasswordOutput()).toHaveText('MySecret123!');
  });

  // ─── Date Input ────────────────────────────────────────────────────────────

  test('TC08 - Date: valid date is accepted and displayed', async () => {
    // Equivalence class: valid date
    // Playwright requires YYYY-MM-DD for date inputs (HTML standard)
    await inputsPage.fillDate('2024-06-15');
    await inputsPage.clickDisplay();

    await expect(inputsPage.getDateOutput()).toHaveText('2024-06-15');
  });

  test('TC09 - Date: invalid date is normalised to last day of the year', async () => {
    // Equivalence class: invalid date partition
    // Browser normalises out-of-range values to the last valid date of the year.
    // pressSequentially bypasses Playwright's format validation on date inputs.
    await inputsPage.pressDateSequentially('15/35/2024');
    await inputsPage.clickDisplay();

    await expect(inputsPage.getDateOutput()).toHaveText('2024-12-31');
  });

  // ─── Buttons ───────────────────────────────────────────────────────────────

  test('TC10 - Clear button resets all inputs and outputs', async () => {
    await inputsPage.fillNumber('5');
    await inputsPage.fillText('test');
    await inputsPage.fillPassword('pass');
    await inputsPage.fillDate('2024-01-01');
    await inputsPage.clickDisplay();
    await inputsPage.clickClear();

    // Input fields are cleared
    expect(await inputsPage.getNumberInputValue()).toBe('');
    expect(await inputsPage.getTextInputValue()).toBe('');
    expect(await inputsPage.getPasswordInputValue()).toBe('');
    expect(await inputsPage.getDateInputValue()).toBe('');

    // Result container stays in DOM but should be empty after clearing
    await expect(inputsPage.getResultContainer()).toBeEmpty();
  });

  test('TC11 - Modifying an input after display clears all outputs', async () => {
    // JS behaviour: any input change event empties all output elements
    await inputsPage.fillText('initial');
    await inputsPage.clickDisplay();

    // Verify output is shown first
    await expect(inputsPage.getTextOutput()).toHaveText('initial');

    // Modify one field — result container should be empty
    await inputsPage.fillText('changed');

    await expect(inputsPage.getResultContainer()).toBeEmpty();
  });

  test('TC12 - Display button with no inputs produces empty outputs', async () => {
    // Equivalence class: no input across all fields
    // #result container has child elements after Display is clicked — assert each output is empty
    await inputsPage.clickDisplay();

    await expect(inputsPage.getNumberOutput()).toHaveText('');
    await expect(inputsPage.getTextOutput()).toHaveText('');
    await expect(inputsPage.getPasswordOutput()).toHaveText('');
    await expect(inputsPage.getDateOutput()).toHaveText('');
  });

  // ─── Additional Coverage ──────────────────────────────────────────────────

  test('TC13 - Number: zero is displayed correctly', async () => {
    // BVA: boundary between positive and negative partitions
    await inputsPage.fillNumber('0');
    await inputsPage.clickDisplay();

    await expect(inputsPage.getNumberOutput()).toHaveText('0');
  });

  test('TC14 - Date: leap year date (Feb 29) is accepted and displayed', async () => {
    // BVA: classic date boundary — Feb 29 only valid in leap years
    await inputsPage.fillDate('2024-02-29');
    await inputsPage.clickDisplay();

    await expect(inputsPage.getDateOutput()).toHaveText('2024-02-29');
  });

  test('TC15 - Partial inputs: only some fields filled', async () => {
    // Decision table: mix of filled and empty fields
    await inputsPage.fillNumber('7');
    await inputsPage.fillText('partial');
    await inputsPage.clickDisplay();

    await expect(inputsPage.getNumberOutput()).toHaveText('7');
    await expect(inputsPage.getTextOutput()).toHaveText('partial');
    await expect(inputsPage.getPasswordOutput()).toHaveText('');
    await expect(inputsPage.getDateOutput()).toHaveText('');
  });

  test('TC16 - Modifying number input after display clears all outputs', async () => {
    // State transition: number input fires different browser events than text (TC11)
    await inputsPage.fillNumber('42');
    await inputsPage.clickDisplay();

    await expect(inputsPage.getNumberOutput()).toHaveText('42');

    // Modify number field — result container should be empty
    await inputsPage.fillNumber('99');

    await expect(inputsPage.getResultContainer()).toBeEmpty();
  });

  test('TC17 - Display updates after modifying and re-displaying', async () => {
    // State transition: Display → modify → Display again shows updated value
    await inputsPage.fillText('original');
    await inputsPage.clickDisplay();

    await expect(inputsPage.getTextOutput()).toHaveText('original');

    // Modify and re-display
    await inputsPage.fillText('updated');
    await inputsPage.clickDisplay();

    await expect(inputsPage.getTextOutput()).toHaveText('updated');
  });

  test('TC18 - Clear without prior display keeps everything empty', async () => {
    // Edge case: clearing when result is already empty should not error
    await inputsPage.clickClear();

    expect(await inputsPage.getNumberInputValue()).toBe('');
    expect(await inputsPage.getTextInputValue()).toBe('');
    expect(await inputsPage.getPasswordInputValue()).toBe('');
    expect(await inputsPage.getDateInputValue()).toBe('');
    await expect(inputsPage.getResultContainer()).toBeEmpty();
  });
});
