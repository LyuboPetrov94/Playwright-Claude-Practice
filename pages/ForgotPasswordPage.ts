import { Page, Locator, expect } from '@playwright/test';

export class ForgotPasswordPage {
  private readonly emailInput: Locator;
  private readonly submitButton: Locator;
  private readonly validationFeedback: Locator;
  private readonly flashMessage: Locator;
  private readonly confirmationAlert: Locator;

  constructor(private page: Page) {
    this.emailInput = page.locator('#email');
    this.submitButton = page.locator('button[type="submit"]');
    this.validationFeedback = page.locator('.invalid-feedback');
    this.flashMessage = page.locator('#flash');
    this.confirmationAlert = page.locator('#confirmation-alert');
  }

  async goto() {
    await this.page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });
  }

  async submitEmail(email: string) {
    await this.emailInput.fill(email);
    // `<input type="email">` strips leading/trailing whitespace per HTML spec,
    // so the committed value is `email.trim()`. Asserting on the sanitized
    // value still catches the Firefox fill→click commit race.
    await expect(this.emailInput).toHaveValue(email.trim());
    await this.submitButton.click();
  }

  async submitEmpty() {
    await this.submitButton.click();
  }

  getValidationFeedback(): Locator {
    return this.validationFeedback;
  }

  getFlashMessage(): Locator {
    return this.flashMessage;
  }

  getConfirmationAlert(): Locator {
    return this.confirmationAlert;
  }
}
