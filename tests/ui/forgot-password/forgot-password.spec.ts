import { test, expect } from '../../../fixtures';
import { ForgotPasswordPage } from '../../../pages/ForgotPasswordPage';

/**
 * Forgot Password tests for https://practice.expandtesting.com/forgot-password
 *
 * Single field: email (type="email", required).
 * Two validation layers:
 *   - Client-side: Bootstrap + HTML5 constraint validation prevents submission
 *     and shows ".invalid-feedback" when email is empty or malformed.
 *   - Server-side: rejects emails that pass HTML5 but lack a TLD, etc.
 *
 * Success: HTTP 200 renders confirmation page with #confirmation-alert.
 * Server error: 302 redirect to /forgot-password with #flash error.
 *
 * Test cases:
 *   - Equivalence Partitioning: valid classes   (TC01, TC05–TC06)
 *   - Equivalence Partitioning: invalid classes  (TC02–TC04)
 */

test.describe('Forgot Password', () => {
  let forgotPasswordPage: ForgotPasswordPage;

  test.beforeEach(async ({ page }) => {
    forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();
  });

  // ─── Equivalence Partitioning: Valid classes ──────────────────────────────

  test('TC01 - Successful password reset with valid email', async () => {
    // EP: valid class — properly formatted email
    await forgotPasswordPage.submitEmail('test@example.com');

    await expect(forgotPasswordPage.getConfirmationAlert()).toContainText(
      'An e-mail has been sent to you'
    );
  });

  // ─── Equivalence Partitioning: Invalid classes ────────────────────────────

  test('TC02 - Empty email shows client-side validation error', async () => {
    // EP: invalid class — empty required field (client-side blocks submission)
    await forgotPasswordPage.submitEmpty();

    await expect(forgotPasswordPage.getValidationFeedback()).toBeVisible();
  });

  test('TC03 - Invalid email format shows client-side validation error', async () => {
    // EP: invalid class — no @ sign (client-side blocks submission)
    await forgotPasswordPage.submitEmail('notanemail');

    await expect(forgotPasswordPage.getValidationFeedback()).toBeVisible();
  });

  test('TC04 - Email without TLD passes client-side but server rejects', async () => {
    // EP: invalid class — HTML5 email validation accepts "user@domain" (no TLD required),
    // but the server enforces stricter rules and rejects it.
    await forgotPasswordPage.submitEmail('user@domain');

    await expect(forgotPasswordPage.getFlashMessage()).toContainText(
      'Your email is invalid!'
    );
  });

  // ─── Equivalence Partitioning: Additional valid classes ───────────────────

  test('TC05 - Email with leading and trailing spaces is accepted', async () => {
    // EP: whitespace edge case — browser sanitises type="email" values by
    // stripping leading/trailing whitespace before submission.
    await forgotPasswordPage.submitEmail(' test@example.com ');

    await expect(forgotPasswordPage.getConfirmationAlert()).toContainText(
      'An e-mail has been sent to you'
    );
  });

  test('TC06 - Non-existent email with valid format is accepted', async () => {
    // EP: valid class — server does not verify email existence,
    // only format. Any properly formatted email triggers the confirmation.
    await forgotPasswordPage.submitEmail(`fake${Date.now()}@nonexistent.org`);

    await expect(forgotPasswordPage.getConfirmationAlert()).toContainText(
      'An e-mail has been sent to you'
    );
  });
});
