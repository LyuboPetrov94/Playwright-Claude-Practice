import { Page, Locator } from '@playwright/test';

export class DragAndDropPage {
  private readonly columnA: Locator;
  private readonly columnB: Locator;
  private readonly columnAHeader: Locator;
  private readonly columnBHeader: Locator;

  constructor(private page: Page) {
    this.columnA = page.locator('#column-a');
    this.columnB = page.locator('#column-b');
    this.columnAHeader = this.columnA.locator('header');
    this.columnBHeader = this.columnB.locator('header');
  }

  async goto() {
    await this.page.goto('/drag-and-drop', { waitUntil: 'domcontentloaded' });
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

  getColumnA(): Locator {
    return this.columnA;
  }

  getColumnB(): Locator {
    return this.columnB;
  }

  getColumnAHeader(): Locator {
    return this.columnAHeader;
  }

  getColumnBHeader(): Locator {
    return this.columnBHeader;
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  async dragAToB() {
    await this.columnA.dragTo(this.columnB);
  }

  async dragBToA() {
    await this.columnB.dragTo(this.columnA);
  }

  async dragAToSelf() {
    await this.columnA.dragTo(this.columnA);
  }
}
