import { Page, Locator } from '@playwright/test';

export class LoginPage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly flashMessage: Locator;
  private readonly logoutButton: Locator;

  constructor(private page: Page) {
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('#submit-login');
    this.flashMessage = page.locator('#flash');
    this.logoutButton = page.locator('a[href="/logout"]');
  }

  async goto() {
    await this.page.goto('/login', { waitUntil: 'domcontentloaded' });
  }

  async gotoSecure() {
    await this.page.goto('/secure', { waitUntil: 'domcontentloaded' });
  }

  async reload() {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  async login(username: string, password: string) {
    // Use clear() before fill() to ensure the field is truly empty across all browsers,
    // particularly WebKit which handles fill('') differently on autocomplete fields.
    await this.usernameInput.clear();
    await this.usernameInput.fill(username);
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  getFlashMessage(): Locator {
    return this.flashMessage;
  }

  getLogoutButton(): Locator {
    return this.logoutButton;
  }
}
