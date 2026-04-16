import { Page, Locator } from '@playwright/test';

export class DynamicPaginationTablePage {
  private readonly table: Locator;
  private readonly tableHeaders: Locator;
  private readonly tableRows: Locator;
  private readonly lengthSelect: Locator;
  private readonly searchInput: Locator;
  private readonly infoText: Locator;
  private readonly previousButton: Locator;
  private readonly nextButton: Locator;
  private readonly paginationButtons: Locator;
  private readonly emptyRow: Locator;

  constructor(private page: Page) {
    this.table = page.locator('#example');
    this.tableHeaders = this.table.locator('thead th');
    this.tableRows = this.table.locator('tbody tr');
    this.lengthSelect = page.locator('[name="example_length"]');
    this.searchInput = page.locator('#example_filter input');
    this.infoText = page.locator('#example_info');
    this.previousButton = page.locator('#example_previous');
    this.nextButton = page.locator('#example_next');
    this.paginationButtons = page.locator('#example_paginate .page-item');
    this.emptyRow = this.table.locator('tbody td.dataTables_empty');
  }

  async goto() {
    await this.page.goto('/dynamic-pagination-table');
  }

  // ─── Pagination ──────────────────────────────────────────────────────────────

  async clickNext() {
    await this.nextButton.locator('a').click();
  }

  async clickPrevious() {
    await this.previousButton.locator('a').click();
  }

  async clickPageNumber(pageNum: number) {
    await this.page
      .locator('#example_paginate .page-item', { hasText: String(pageNum) })
      .locator('a')
      .click();
  }

  getActivePageNumber(): Locator {
    return this.page.locator('#example_paginate .page-item.active');
  }

  getPreviousButton(): Locator {
    return this.previousButton;
  }

  getNextButton(): Locator {
    return this.nextButton;
  }

  // ─── Rows Per Page ───────────────────────────────────────────────────────────

  async selectRowsPerPage(value: '3' | '5' | '10' | '-1') {
    await this.lengthSelect.selectOption(value);
  }

  // ─── Search ──────────────────────────────────────────────────────────────────

  async search(text: string) {
    await this.searchInput.clear();
    await this.searchInput.fill(text);
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.searchInput.dispatchEvent('input');
  }

  // ─── Sorting ─────────────────────────────────────────────────────────────────

  async clickColumnHeader(columnName: string) {
    await this.tableHeaders.filter({ hasText: columnName }).click();
  }

  getColumnHeader(columnName: string): Locator {
    return this.tableHeaders.filter({ hasText: columnName });
  }

  // ─── Table Data ──────────────────────────────────────────────────────────────

  async getVisibleRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  /** Returns visible cell values for a given column name. */
  async getColumnValues(columnName: string): Promise<string[]> {
    const headers = await this.tableHeaders.allTextContents();
    const colIndex = headers.indexOf(columnName);
    if (colIndex === -1) {
      throw new Error(`Column "${columnName}" not found. Available: ${headers.join(', ')}`);
    }
    const rows = await this.tableRows.all();
    const values: string[] = [];
    for (const row of rows) {
      const cells = await row.locator('td').allTextContents();
      values.push(cells[colIndex]);
    }
    return values;
  }

  /** Returns all visible rows as arrays of cell text. */
  async getVisibleRows(): Promise<string[][]> {
    const rows = await this.tableRows.all();
    const data: string[][] = [];
    for (const row of rows) {
      data.push(await row.locator('td').allTextContents());
    }
    return data;
  }

  // ─── Output Locators ─────────────────────────────────────────────────────────

  getInfoText(): Locator {
    return this.infoText;
  }

  getTable(): Locator {
    return this.table;
  }

  getTableRows(): Locator {
    return this.tableRows;
  }

  getEmptyRow(): Locator {
    return this.emptyRow;
  }

  getPaginationButtons(): Locator {
    return this.paginationButtons;
  }
}
