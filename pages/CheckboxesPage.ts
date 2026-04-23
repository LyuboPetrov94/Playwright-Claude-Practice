import { Page, Locator } from '@playwright/test';

export class CheckboxesPage {
  private readonly checkbox1: Locator;
  private readonly checkbox2: Locator;
  private readonly label1: Locator;
  private readonly label2: Locator;

  constructor(private page: Page) {
    this.checkbox1 = page.locator('#checkbox1');
    this.checkbox2 = page.locator('#checkbox2');
    this.label1 = page.locator('label[for="checkbox1"]');
    this.label2 = page.locator('label[for="checkbox2"]');
  }

  async goto() {
    await this.page.goto('/checkboxes', { waitUntil: 'domcontentloaded' });
  }

  async reload() {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  getCheckbox1(): Locator {
    return this.checkbox1;
  }

  getCheckbox2(): Locator {
    return this.checkbox2;
  }

  getLabel1(): Locator {
    return this.label1;
  }

  getLabel2(): Locator {
    return this.label2;
  }

  async clickCheckbox1() {
    await this.checkbox1.click();
  }

  async clickCheckbox2() {
    await this.checkbox2.click();
  }

  async clickLabel1() {
    await this.label1.click();
  }

  async clickLabel2() {
    await this.label2.click();
  }

  async pressSpaceOnCheckbox1() {
    await this.checkbox1.focus();
    await this.page.keyboard.press('Space');
  }

  async pressSpaceOnCheckbox2() {
    await this.checkbox2.focus();
    await this.page.keyboard.press('Space');
  }
}
