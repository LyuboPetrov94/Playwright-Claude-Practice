import { Page, Locator } from '@playwright/test';

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
    await this.page.goto('/register');
  }

  async register(username: string, password: string, confirmPassword: string) {
    await this.usernameInput.clear();
    await this.usernameInput.fill(username);
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.clear();
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.registerButton.click();
  }

  getFlashMessage(): Locator {
    return this.flashMessage;
  }
}
