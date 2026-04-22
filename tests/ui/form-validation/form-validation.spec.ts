import { test, expect } from '../../../fixtures';
import { FormValidationPage } from '../../../pages/FormValidationPage';

/**
 * Form validation tests for https://practice.expandtesting.com/form-validation
 *
 * Form uses Bootstrap client-side validation (class="needs-validation" + novalidate).
 * Fields:
 *   - Contact Name  — required text, pre-filled with "dodo"
 *   - Contact Number — required tel, pattern [0-9]{3}-[0-9]{7}
 *   - PickUp Date   — required date (YYYY-MM-DD per HTML5 spec)
 *   - Payment       — required select (cashondelivery | card)
 *
 * On success the form POSTs to /form-confirmation which renders
 * an .alert.alert-info "Thank you for validating your ticket" notice.
 *
 * Test cases:
 *   - EP: valid classes                       (TC01–TC02)
 *   - EP: invalid required fields             (TC03–TC07)
 *   - BVA: Contact Number prefix/suffix       (TC08–TC12)
 *   - EP: Contact Number other invalid        (TC13–TC14)
 *   - EP: PickUp Date (past / today / future) (TC15–TC17)
 *   - Payment Method interaction              (TC18–TC19)
 *   - Initial state                           (TC20)
 *   - State Transition: recovery              (TC21)
 */

const VALID_NAME = 'John Doe';
const VALID_PHONE = '012-3456789';
const VALID_DATE = '2026-05-01';

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

test.describe('Form Validation', () => {
  let formPage: FormValidationPage;

  test.beforeEach(async ({ page }) => {
    formPage = new FormValidationPage(page);
    await formPage.goto();
  });

  // ─── EP: Valid classes ─────────────────────────────────────────────────────

  test('TC01 - Submit with all valid fields (card) redirects to confirmation', async ({ page }) => {
    await formPage.submitWith({
      contactName: VALID_NAME,
      contactNumber: VALID_PHONE,
      pickUpDate: VALID_DATE,
      payment: 'card',
    });

    await expect(page).toHaveURL(/\/form-confirmation/);
    await expect(formPage.getConfirmationAlert()).toContainText(
      'Thank you for validating your ticket'
    );
  });

  test('TC02 - Submit with all valid fields (cash on delivery) redirects to confirmation', async ({ page }) => {
    await formPage.submitWith({
      contactName: VALID_NAME,
      contactNumber: VALID_PHONE,
      pickUpDate: VALID_DATE,
      payment: 'cashondelivery',
    });

    await expect(page).toHaveURL(/\/form-confirmation/);
    await expect(formPage.getConfirmationAlert()).toContainText(
      'Thank you for validating your ticket'
    );
  });

  // ─── EP: Invalid required fields ──────────────────────────────────────────

  test('TC03 - Empty Contact Name shows required error', async ({ page }) => {
    // EP: invalid class — single missing required field
    await formPage.submitWith({
      contactName: '',
      contactNumber: VALID_PHONE,
      pickUpDate: VALID_DATE,
      payment: 'card',
    });

    await expect(formPage.getContactNameError()).toHaveText('Please enter your Contact name.');
    await expect(page).toHaveURL(/\/form-validation/);
  });

  test('TC04 - Empty Contact Number shows required error', async ({ page }) => {
    await formPage.submitWith({
      contactName: VALID_NAME,
      contactNumber: '',
      pickUpDate: VALID_DATE,
      payment: 'card',
    });

    await expect(formPage.getContactNumberError()).toHaveText(
      'Please provide your Contact number.'
    );
    await expect(page).toHaveURL(/\/form-validation/);
  });

  test('TC05 - Empty PickUp Date shows required error', async ({ page }) => {
    await formPage.submitWith({
      contactName: VALID_NAME,
      contactNumber: VALID_PHONE,
      pickUpDate: '',
      payment: 'card',
    });

    await expect(formPage.getPickUpDateError()).toHaveText('Please provide valid Date.');
    await expect(page).toHaveURL(/\/form-validation/);
  });

  test('TC06 - Payment Method not selected shows required error', async ({ page }) => {
    // Payment left at default "Choose..." option
    await formPage.fillForm({
      contactName: VALID_NAME,
      contactNumber: VALID_PHONE,
      pickUpDate: VALID_DATE,
    });
    await formPage.submit();

    // Preserves site-authored typo "Paymeny"
    await expect(formPage.getPaymentError()).toHaveText('Please select the Paymeny Method.');
    await expect(page).toHaveURL(/\/form-validation/);
  });

  test('TC07 - Submit fully empty shows all four errors', async ({ page }) => {
    await formPage.submitEmpty();

    await expect(formPage.getContactNameError()).toHaveText('Please enter your Contact name.');
    await expect(formPage.getContactNumberError()).toHaveText(
      'Please provide your Contact number.'
    );
    await expect(formPage.getPickUpDateError()).toHaveText('Please provide valid Date.');
    await expect(formPage.getPaymentError()).toHaveText('Please select the Paymeny Method.');
    await expect(page).toHaveURL(/\/form-validation/);
  });

  // ─── BVA: Contact Number pattern [0-9]{3}-[0-9]{7} ────────────────────────

  test('TC08 - Contact Number with 2-digit prefix is rejected', async ({ page }) => {
    // BVA: below minimum prefix length
    await formPage.submitWith({
      contactName: VALID_NAME,
      contactNumber: '12-3456789',
      pickUpDate: VALID_DATE,
      payment: 'card',
    });

    await expect(page).toHaveURL(/\/form-validation/);
    await expect(formPage.getContactNumberError()).toBeVisible();
  });

  test('TC09 - Contact Number at boundary (3-digit prefix + 7-digit suffix) is accepted', async ({ page }) => {
    // BVA: exact pattern match
    await formPage.submitWith({
      contactName: VALID_NAME,
      contactNumber: '123-3456789',
      pickUpDate: VALID_DATE,
      payment: 'card',
    });

    await expect(page).toHaveURL(/\/form-confirmation/);
  });

  test('TC10 - Contact Number with 4-digit prefix is rejected', async ({ page }) => {
    // BVA: above maximum prefix length
    await formPage.submitWith({
      contactName: VALID_NAME,
      contactNumber: '1234-3456789',
      pickUpDate: VALID_DATE,
      payment: 'card',
    });

    await expect(page).toHaveURL(/\/form-validation/);
    await expect(formPage.getContactNumberError()).toBeVisible();
  });

  test('TC11 - Contact Number with 6-digit suffix is rejected', async ({ page }) => {
    // BVA: below minimum suffix length
    await formPage.submitWith({
      contactName: VALID_NAME,
      contactNumber: '123-456789',
      pickUpDate: VALID_DATE,
      payment: 'card',
    });

    await expect(page).toHaveURL(/\/form-validation/);
    await expect(formPage.getContactNumberError()).toBeVisible();
  });

  test('TC12 - Contact Number with 8-digit suffix is rejected', async ({ page }) => {
    // BVA: above maximum suffix length
    await formPage.submitWith({
      contactName: VALID_NAME,
      contactNumber: '123-45678901',
      pickUpDate: VALID_DATE,
      payment: 'card',
    });

    await expect(page).toHaveURL(/\/form-validation/);
    await expect(formPage.getContactNumberError()).toBeVisible();
  });

  // ─── EP: Contact Number other invalid classes ─────────────────────────────

  test('TC13 - Contact Number without dash is rejected', async ({ page }) => {
    // EP: invalid class — missing required separator
    await formPage.submitWith({
      contactName: VALID_NAME,
      contactNumber: '1234567890',
      pickUpDate: VALID_DATE,
      payment: 'card',
    });

    await expect(page).toHaveURL(/\/form-validation/);
    await expect(formPage.getContactNumberError()).toBeVisible();
  });

  test('TC14 - Contact Number with letters is rejected', async ({ page }) => {
    // EP: invalid class — non-digit characters
    await formPage.submitWith({
      contactName: VALID_NAME,
      contactNumber: 'abc-1234567',
      pickUpDate: VALID_DATE,
      payment: 'card',
    });

    await expect(page).toHaveURL(/\/form-validation/);
    await expect(formPage.getContactNumberError()).toBeVisible();
  });

  // ─── EP: PickUp Date classes (no site-level min/max) ──────────────────────

  test('TC15 - Today\'s date is accepted', async ({ page }) => {
    // EP: valid class — current date
    await formPage.submitWith({
      contactName: VALID_NAME,
      contactNumber: VALID_PHONE,
      pickUpDate: isoDate(0),
      payment: 'card',
    });

    await expect(page).toHaveURL(/\/form-confirmation/);
  });

  test('TC16 - A past date is accepted (documents no past-date restriction)', async ({ page }) => {
    // EP: documents that the form does not restrict past dates
    await formPage.submitWith({
      contactName: VALID_NAME,
      contactNumber: VALID_PHONE,
      pickUpDate: isoDate(-30),
      payment: 'card',
    });

    await expect(page).toHaveURL(/\/form-confirmation/);
  });

  test('TC17 - A future date is accepted (documents no future-date restriction)', async ({ page }) => {
    // EP: documents that the form does not restrict future dates
    await formPage.submitWith({
      contactName: VALID_NAME,
      contactNumber: VALID_PHONE,
      pickUpDate: isoDate(30),
      payment: 'card',
    });

    await expect(page).toHaveURL(/\/form-confirmation/);
  });

  // ─── Payment Method interaction ───────────────────────────────────────────

  test('TC18 - Switching Payment Method from card to cash on delivery keeps the new value', async ({ page }) => {
    await formPage.fillForm({
      contactName: VALID_NAME,
      contactNumber: VALID_PHONE,
      pickUpDate: VALID_DATE,
      payment: 'card',
    });
    await expect(formPage.getPaymentSelect()).toHaveValue('card');

    await formPage.setPayment('cashondelivery');
    await expect(formPage.getPaymentSelect()).toHaveValue('cashondelivery');

    await formPage.submit();
    await expect(page).toHaveURL(/\/form-confirmation/);
  });

  test('TC19 - "Choose..." option is disabled and cannot be selected', async () => {
    // The placeholder option must be unreachable once a real choice has been made.
    await expect(formPage.getChooseOption()).toBeDisabled();

    await formPage.setPayment('card');
    await expect(formPage.getPaymentSelect()).toHaveValue('card');

    // Attempting to select the disabled option must throw; the select must stay on "card".
    await expect(
      formPage.getPaymentSelect().selectOption({ value: '' }, { timeout: 2000 })
    ).rejects.toThrow();
    await expect(formPage.getPaymentSelect()).toHaveValue('card');
  });

  // ─── Initial state ────────────────────────────────────────────────────────

  test('TC20 - Contact Name is pre-filled with "dodo" on initial load', async () => {
    // Documents the site's initial state so a regression that changes or clears it is caught.
    await expect(formPage.getContactNameInput()).toHaveValue('dodo');
  });

  // ─── State Transition: failed submit → correction → success ───────────────

  test('TC21 - Form recovers after a failed submit once fields are corrected', async ({ page }) => {
    await formPage.submitEmpty();

    await expect(formPage.getContactNameError()).toBeVisible();
    await expect(formPage.getContactNumberError()).toBeVisible();
    await expect(formPage.getPickUpDateError()).toBeVisible();
    await expect(formPage.getPaymentError()).toBeVisible();
    await expect(page).toHaveURL(/\/form-validation/);

    await formPage.submitWith({
      contactName: VALID_NAME,
      contactNumber: VALID_PHONE,
      pickUpDate: VALID_DATE,
      payment: 'card',
    });

    await expect(page).toHaveURL(/\/form-confirmation/);
    await expect(formPage.getConfirmationAlert()).toContainText(
      'Thank you for validating your ticket'
    );
  });
});
