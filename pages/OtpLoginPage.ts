import { Page, Locator } from '@playwright/test';

export class OtpLoginPage {
  // Email entry screen
  private readonly emailInput: Locator;
  private readonly sendOtpButton: Locator;

  // OTP verification screen
  private readonly otpInput: Locator;
  private readonly verifyOtpButton: Locator;
  private readonly otpMessage: Locator;

  // Shared across screens (Bootstrap client-side validation)
  private readonly validationFeedback: Locator;

  // Post-login (secure page)
  private readonly flashMessage: Locator;
  private readonly logoutButton: Locator;

  constructor(private page: Page) {
    this.emailInput = page.locator('#email');
    this.sendOtpButton = page.locator('#btn-send-otp');
    this.otpInput = page.locator('#otp');
    this.verifyOtpButton = page.locator('#btn-send-verify');
    this.otpMessage = page.locator('#otp-message');
    this.validationFeedback = page.locator('.invalid-feedback');
    this.flashMessage = page.locator('#flash');
    this.logoutButton = page.locator('a[href="/logout"]');
  }

  async goto() {
    await this.page.goto('/otp-login', { waitUntil: 'domcontentloaded' });
  }

  async submitEmail(email: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
    await this.sendOtpButton.click();
  }

  async submitEmptyEmail() {
    await this.sendOtpButton.click();
  }

  async submitOtp(otp: string) {
    await this.otpInput.clear();
    await this.otpInput.fill(otp);
    await this.verifyOtpButton.click();
  }

  async submitEmptyOtp() {
    await this.verifyOtpButton.click();
  }

  getValidationFeedback(): Locator {
    return this.validationFeedback;
  }

  getOtpMessage(): Locator {
    return this.otpMessage;
  }

  getFlashMessage(): Locator {
    return this.flashMessage;
  }

  getLogoutButton(): Locator {
    return this.logoutButton;
  }
}
