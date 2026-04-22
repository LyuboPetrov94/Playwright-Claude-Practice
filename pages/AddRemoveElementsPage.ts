import { Page, Locator } from '@playwright/test';

export class AddRemoveElementsPage {
  private readonly addButton: Locator;
  private readonly elementsContainer: Locator;
  private readonly deleteButtons: Locator;

  constructor(private page: Page) {
    this.addButton = page.locator('button.btn-primary', { hasText: 'Add Element' });
    this.elementsContainer = page.locator('#elements');
    this.deleteButtons = this.elementsContainer.locator('button.added-manually');
  }

  async goto() {
    await this.page.goto('/add-remove-elements', { waitUntil: 'domcontentloaded' });
  }

  async reload() {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  async clickAdd(times = 1) {
    for (let i = 0; i < times; i++) {
      await this.addButton.click();
    }
  }

  async clickDeleteAt(index: number) {
    await this.deleteButtons.nth(index).click();
  }

  /**
   * Tags every currently-rendered Delete button with `data-tag="btn-<index>"`
   * so individual buttons can be addressed after the DOM mutates.
   * Returns a locator factory that resolves to the tagged button by original index.
   */
  async tagDeleteButtons(): Promise<(index: number) => Locator> {
    await this.page.evaluate(() => {
      document
        .querySelectorAll('#elements button.added-manually')
        .forEach((btn, i) => btn.setAttribute('data-tag', `btn-${i}`));
    });
    return (index: number) => this.page.locator(`[data-tag="btn-${index}"]`);
  }

  getAddButton(): Locator {
    return this.addButton;
  }

  getElementsContainer(): Locator {
    return this.elementsContainer;
  }

  getDeleteButtons(): Locator {
    return this.deleteButtons;
  }
}
