import { Page, Locator } from '@playwright/test';

export class LocatorsPage {
  // ─── getByRole ─────────────────────────────────────────────────────────────
  private readonly addItemButton: Locator;
  private readonly contactLink: Locator;

  // ─── getByText ─────────────────────────────────────────────────────────────
  private readonly hotDealText: Locator;
  private readonly latestNewsText: Locator;

  // ─── getByLabel ────────────────────────────────────────────────────────────
  private readonly countrySelect: Locator;
  private readonly newsletterEmail: Locator;

  // ─── getByPlaceholder ──────────────────────────────────────────────────────
  private readonly searchInput: Locator;
  private readonly filterInput: Locator;

  // ─── getByAltText ──────────────────────────────────────────────────────────
  private readonly userAvatar: Locator;

  // ─── getByTitle ────────────────────────────────────────────────────────────
  private readonly refreshButton: Locator;
  private readonly settingsSpan: Locator;

  // ─── getByTestId ───────────────────────────────────────────────────────────
  private readonly statusMessage: Locator;
  private readonly userName: Locator;

  // ─── Legacy CSS ────────────────────────────────────────────────────────────
  private readonly legacyCssTarget: Locator;

  // ─── XPath Practice: List ──────────────────────────────────────────────────
  private readonly taskList: Locator;
  private readonly taskListItems: Locator;

  // ─── XPath Practice: Table ─────────────────────────────────────────────────
  private readonly productTable: Locator;
  private readonly productTableHeaders: Locator;
  private readonly productTableRows: Locator;

  constructor(private page: Page) {
    // getByRole
    this.addItemButton = page.getByRole('button', { name: 'Add Item' });
    this.contactLink = page.getByRole('link', { name: 'Contact' });

    // getByText
    this.hotDealText = page.getByText('Hot Deal: Buy 1 Get 1 Free');
    this.latestNewsText = page.getByText('Latest news and updates');

    // getByLabel
    this.countrySelect = page.getByLabel('Choose a country');
    this.newsletterEmail = page.getByLabel('Email for newsletter');

    // getByPlaceholder
    this.searchInput = page.getByPlaceholder('Search the site');
    this.filterInput = page.getByPlaceholder('Filter by tag');

    // getByAltText
    this.userAvatar = page.getByAltText('User avatar');

    // getByTitle
    this.refreshButton = page.getByTitle('Refresh content');
    this.settingsSpan = page.getByTitle('Settings panel');

    // getByTestId
    this.statusMessage = page.getByTestId('status-message');
    this.userName = page.getByTestId('user-name');

    // Legacy CSS
    this.legacyCssTarget = page.locator('.legacy-css');

    // XPath Practice: List
    this.taskList = page.locator('.legacy-list');
    this.taskListItems = this.taskList.locator('.list-group-item');

    // XPath Practice: Table
    this.productTable = page.locator('.legacy-table');
    this.productTableHeaders = this.productTable.locator('thead th');
    this.productTableRows = this.productTable.locator('tbody tr');
  }

  async goto() {
    await this.page.goto('/locators', { waitUntil: 'domcontentloaded' });
  }

  // ─── getByRole ─────────────────────────────────────────────────────────────

  getAddItemButton(): Locator {
    return this.addItemButton;
  }

  getContactLink(): Locator {
    return this.contactLink;
  }

  async clickContactLink() {
    await this.contactLink.click();
  }

  // ─── getByText ─────────────────────────────────────────────────────────────

  getHotDealText(): Locator {
    return this.hotDealText;
  }

  getLatestNewsText(): Locator {
    return this.latestNewsText;
  }

  // ─── getByLabel ────────────────────────────────────────────────────────────

  getCountrySelect(): Locator {
    return this.countrySelect;
  }

  async selectCountry(country: string) {
    await this.countrySelect.selectOption(country);
  }

  getNewsletterEmail(): Locator {
    return this.newsletterEmail;
  }

  async fillNewsletterEmail(email: string) {
    await this.newsletterEmail.clear();
    await this.newsletterEmail.fill(email);
  }

  // ─── getByPlaceholder ──────────────────────────────────────────────────────

  getSearchInput(): Locator {
    return this.searchInput;
  }

  async fillSearchInput(text: string) {
    await this.searchInput.clear();
    await this.searchInput.fill(text);
  }

  getFilterInput(): Locator {
    return this.filterInput;
  }

  async fillFilterInput(text: string) {
    await this.filterInput.clear();
    await this.filterInput.fill(text);
  }

  // ─── getByAltText ──────────────────────────────────────────────────────────

  getUserAvatar(): Locator {
    return this.userAvatar;
  }

  // ─── getByTitle ────────────────────────────────────────────────────────────

  getRefreshButton(): Locator {
    return this.refreshButton;
  }

  async clickRefreshButton() {
    await this.refreshButton.click();
  }

  getSettingsSpan(): Locator {
    return this.settingsSpan;
  }

  // ─── getByTestId ───────────────────────────────────────────────────────────

  getStatusMessage(): Locator {
    return this.statusMessage;
  }

  getUserName(): Locator {
    return this.userName;
  }

  // ─── Legacy CSS ────────────────────────────────────────────────────────────

  getLegacyCssTarget(): Locator {
    return this.legacyCssTarget;
  }

  // ─── XPath Practice: List ──────────────────────────────────────────────────

  getTaskListItems(): Locator {
    return this.taskListItems;
  }

  // ─── XPath Practice: Table ─────────────────────────────────────────────────

  getProductTableHeaders(): Locator {
    return this.productTableHeaders;
  }

  getProductTableRows(): Locator {
    return this.productTableRows;
  }

  /** Returns cell values for a given column name. */
  async getProductColumnValues(columnName: string): Promise<string[]> {
    const headers = await this.productTableHeaders.allTextContents();
    const colIndex = headers.indexOf(columnName);
    if (colIndex === -1) {
      throw new Error(`Column "${columnName}" not found. Available: ${headers.join(', ')}`);
    }
    const rows = await this.productTableRows.all();
    const values: string[] = [];
    for (const row of rows) {
      const cells = await row.locator('td').allTextContents();
      values.push(cells[colIndex]);
    }
    return values;
  }

  // ─── Contact Page (after navigation) ───────────────────────────────────────

  getContactPageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Contact page for Automation Testing Practice' });
  }

  getContactForm(): Locator {
    return this.page.getByRole('heading', { name: 'Contact Form' });
  }
}
