import { Page, Locator, expect } from '@playwright/test';

export class RegisterPage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly confirmPasswordInput: Locator;
  private readonly registerButton: Locator;
  private readonly flashMessage: Locator;

  constructor(private page: Page) {
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.confirmPasswordInput = page.locator('#confirmPassword');
    this.registerButton = page.locator('button[type="submit"]');
    this.flashMessage = page.locator('#flash');
  }

  async goto() {
    await this.page.goto('/register', { waitUntil: 'domcontentloaded' });
  }

  async register(username: string, password: string, confirmPassword: string) {
    await this.usernameInput.fill(username);
    await expect(this.usernameInput).toHaveValue(username);
    await this.passwordInput.fill(password);
    await expect(this.passwordInput).toHaveValue(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await expect(this.confirmPasswordInput).toHaveValue(confirmPassword);
    await this.registerButton.click();
  }

  getFlashMessage(): Locator {
    return this.flashMessage;
  }
}
