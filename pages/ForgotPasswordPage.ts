import { Page, Locator } from '@playwright/test';

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
    await this.emailInput.clear();
    await this.emailInput.fill(email);
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
