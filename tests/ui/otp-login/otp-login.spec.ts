import { test, expect } from '../../../fixtures';
import { OtpLoginPage } from '../../../pages/OtpLoginPage';

/**
 * OTP Login tests for https://practice.expandtesting.com/otp-login
 *
 * Two-step flow:
 *   1. Email entry — submit email to receive OTP code.
 *   2. OTP verification — enter 6-digit code to log in.
 *
 * Email validation: same two layers as forgot-password (client-side Bootstrap +
 * server-side). OTP input is type="number" with pattern="[0-9]{6}", required.
 *
 * Success: forwards to /secure with flash "You logged into a secure area!"
 * and visible logout button.
 *
 * Test cases:
 *   - Email submission  (TC01–TC06)
 *   - OTP verification  (TC07–TC11)
 */

const VALID_EMAIL = 'practice@expandtesting.com';
const VALID_OTP = '214365';

test.describe('OTP Login', () => {
  let otpLoginPage: OtpLoginPage;

  test.beforeEach(async ({ page }) => {
    otpLoginPage = new OtpLoginPage(page);
    await otpLoginPage.goto();
  });

  // ─── Email Submission: Valid classes ───────────────────────────────────────

  test('TC01 - Valid email shows OTP verification page', async () => {
    // EP: valid class — properly formatted email
    await otpLoginPage.submitEmail(VALID_EMAIL);

    await expect(otpLoginPage.getOtpMessage()).toContainText(
      "We've sent an OTP code to your email: practice@expandtesting.com"
    );
  });

  // ─── Email Submission: Invalid classes ────────────────────────────────────

  test('TC02 - Empty email shows client-side validation error', async () => {
    // EP: invalid class — empty required field (client-side blocks submission)
    await otpLoginPage.submitEmptyEmail();

    await expect(otpLoginPage.getValidationFeedback()).toBeVisible();
  });

  test('TC03 - Invalid email format shows client-side validation error', async () => {
    // EP: invalid class — no @ sign (client-side blocks submission)
    await otpLoginPage.submitEmail('notanemail');

    await expect(otpLoginPage.getValidationFeedback()).toBeVisible();
  });

  test('TC04 - Email without TLD is accepted', async () => {
    // EP: valid class — unlike forgot-password, the OTP login server
    // accepts emails without a TLD (e.g. "user@domain").
    await otpLoginPage.submitEmail('user@domain');

    await expect(otpLoginPage.getOtpMessage()).toContainText(
      "We've sent an OTP code to your email"
    );
  });

  // ─── Email Submission: Additional valid classes ───────────────────────────

  test('TC05 - Email with leading and trailing spaces is accepted', async () => {
    // EP: whitespace edge case — browser sanitises type="email" values
    await otpLoginPage.submitEmail(' practice@expandtesting.com ');

    await expect(otpLoginPage.getOtpMessage()).toContainText(
      "We've sent an OTP code to your email"
    );
  });

  test('TC06 - Non-existent email with valid format is accepted', async () => {
    // EP: valid class — server does not verify email existence
    await otpLoginPage.submitEmail(`fake${Date.now()}@nonexistent.org`);

    await expect(otpLoginPage.getOtpMessage()).toContainText(
      "We've sent an OTP code to your email"
    );
  });

  // ─── OTP Verification ────────────────────────────────────────────────────

  test.describe('OTP Verification', () => {
    test.beforeEach(async () => {
      await otpLoginPage.submitEmail(VALID_EMAIL);
    });

    test('TC07 - Valid OTP code logs in successfully', async ({ page }) => {
      // EP: valid class — correct 6-digit OTP
      await otpLoginPage.submitOtp(VALID_OTP);

      await expect(page).toHaveURL(/\/secure/);
      await expect(otpLoginPage.getFlashMessage()).toContainText(
        'You logged into a secure area!'
      );
      await expect(otpLoginPage.getLogoutButton()).toBeVisible();
    });

    test('TC08 - Invalid OTP code shows error', async () => {
      // EP: invalid class — wrong OTP code
      await otpLoginPage.submitOtp('000000');

      await expect(otpLoginPage.getOtpMessage()).toContainText(
        'The provided OTP code is incorrect. Please check your code and try again.'
      );
    });

    test('TC09 - Empty OTP shows client-side validation error', async () => {
      // EP: invalid class — empty required field (client-side blocks submission)
      await otpLoginPage.submitEmptyOtp();

      await expect(otpLoginPage.getValidationFeedback()).toBeVisible();
    });

    test('TC10 - OTP with fewer than 6 digits shows error', async () => {
      // EP: invalid class — short OTP (may trigger client-side pattern validation)
      await otpLoginPage.submitOtp('123');

      await expect(otpLoginPage.getOtpMessage()).toContainText(
        'The provided OTP code is incorrect. Please check your code and try again.'
      );
    });

    test('TC11 - Logout after successful OTP login redirects to login page', async ({ page }) => {
      // State Transition: logged-out → email → OTP → logged-in → logged-out
      await otpLoginPage.submitOtp(VALID_OTP);

      await expect(page).toHaveURL(/\/secure/);
      await expect(otpLoginPage.getLogoutButton()).toBeVisible();

      await otpLoginPage.getLogoutButton().click();

      await expect(page).toHaveURL(/\/login/);
      await expect(otpLoginPage.getFlashMessage()).toContainText(
        'You logged out of the secure area!'
      );
    });
  });
});
