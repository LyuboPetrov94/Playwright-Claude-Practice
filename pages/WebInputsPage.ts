import { Page, Locator } from '@playwright/test';

export class WebInputsPage {
  private readonly numberInput: Locator;
  private readonly textInput: Locator;
  private readonly passwordInput: Locator;
  private readonly dateInput: Locator;

  private readonly displayButton: Locator;
  private readonly clearButton: Locator;

  private readonly numberOutput: Locator;
  private readonly textOutput: Locator;
  private readonly passwordOutput: Locator;
  private readonly dateOutput: Locator;
  private readonly resultContainer: Locator;

  constructor(private page: Page) {
    this.numberInput = page.locator('#input-number');
    this.textInput = page.locator('#input-text');
    this.passwordInput = page.locator('#input-password');
    this.dateInput = page.locator('#input-date');

    this.displayButton = page.locator('#btn-display-inputs');
    this.clearButton = page.locator('#btn-clear-inputs');

    this.numberOutput = page.locator('#output-number');
    this.textOutput = page.locator('#output-text');
    this.passwordOutput = page.locator('#output-password');
    this.dateOutput = page.locator('#output-date');
    this.resultContainer = page.locator('#result');
  }

  async goto() {
    await this.page.goto('/inputs', { waitUntil: 'domcontentloaded' });
  }

  async fillNumber(value: string) {
    await this.numberInput.clear();
    await this.numberInput.fill(value);
  }

  async fillText(value: string) {
    await this.textInput.clear();
    await this.textInput.fill(value);
  }

  async fillPassword(value: string) {
    await this.passwordInput.clear();
    await this.passwordInput.fill(value);
  }

  async fillDate(value: string) {
    await this.dateInput.clear();
    await this.dateInput.fill(value);
  }

  // Use for invalid date strings that Playwright's fill() would reject.
  // pressSequentially types characters directly, bypassing format validation.
  async pressDateSequentially(value: string) {
    await this.dateInput.click();
    await this.dateInput.pressSequentially(value);
  }

  async clickDisplay() {
    await this.displayButton.click();
  }

  async clickClear() {
    await this.clearButton.click();
  }

  getNumberOutput(): Locator {
    return this.numberOutput;
  }

  getTextOutput(): Locator {
    return this.textOutput;
  }

  getPasswordOutput(): Locator {
    return this.passwordOutput;
  }

  getDateOutput(): Locator {
    return this.dateOutput;
  }

  async getNumberInputValue(): Promise<string> {
    return this.numberInput.inputValue();
  }

  async getTextInputValue(): Promise<string> {
    return this.textInput.inputValue();
  }

  async getPasswordInputValue(): Promise<string> {
    return this.passwordInput.inputValue();
  }

  async getDateInputValue(): Promise<string> {
    return this.dateInput.inputValue();
  }

  getResultContainer(): Locator {
    return this.resultContainer;
  }
}
