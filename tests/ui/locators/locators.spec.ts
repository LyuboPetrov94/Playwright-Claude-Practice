import { test, expect } from '../../../fixtures';
import { LocatorsPage } from '../../../pages/LocatorsPage';

/**
 * Locators Test Page tests for
 * https://practice.expandtesting.com/locators
 *
 * Practice page demonstrating Playwright's built-in locator strategies
 * and legacy CSS/XPath selectors.
 *
 * Test cases:
 *   - getByRole          (TC01–TC03)
 *   - getByText          (TC04–TC05)
 *   - getByLabel         (TC06–TC09)
 *   - getByPlaceholder   (TC10–TC11)
 *   - getByAltText       (TC12)
 *   - getByTitle         (TC13–TC14)
 *   - getByTestId        (TC15–TC16)
 *   - Legacy CSS         (TC17–TC18)
 *   - XPath List         (TC19–TC21)
 *   - XPath Table        (TC22–TC26)
 */

test.describe('Locators Test Page', () => {
  let locatorsPage: LocatorsPage;

  test.beforeEach(async ({ page }) => {
    locatorsPage = new LocatorsPage(page);
    await locatorsPage.goto();
  });

  // ─── getByRole ──────────────────────────────────────────────────────────────

  test('TC01 - "Add Item" button is visible and clickable', async () => {
    // Equivalence Partitioning: button located by role
    await expect(locatorsPage.getAddItemButton()).toBeVisible();
    await expect(locatorsPage.getAddItemButton()).toBeEnabled();
    await expect(locatorsPage.getAddItemButton()).toHaveText('Add Item');
  });

  test('TC02 - "Contact" link is visible and has correct role', async () => {
    // Equivalence Partitioning: link located by role
    await expect(locatorsPage.getContactLink()).toBeVisible();
    await expect(locatorsPage.getContactLink()).toHaveText('Contact');
    await expect(locatorsPage.getContactLink()).toHaveAttribute('role', 'link');
  });

  test('TC03 - Clicking "Contact" link navigates to Contact page', async ({ page }) => {
    // State Transition: locators page → contact page
    await locatorsPage.clickContactLink();

    await expect(page).toHaveURL('/contact');
    await expect(locatorsPage.getContactPageHeading()).toBeVisible();
    await expect(locatorsPage.getContactForm()).toBeVisible();
  });

  // ─── getByText ──────────────────────────────────────────────────────────────

  test('TC04 - Promotional text "Hot Deal: Buy 1 Get 1 Free" is visible', async () => {
    // Equivalence Partitioning: element located by text content
    await expect(locatorsPage.getHotDealText()).toBeVisible();
  });

  test('TC05 - "Latest news and updates" text is visible', async () => {
    // Equivalence Partitioning: element located by text content
    await expect(locatorsPage.getLatestNewsText()).toBeVisible();
  });

  // ─── getByLabel ─────────────────────────────────────────────────────────────

  test('TC06 - "Choose a country" dropdown is visible with default value "France"', async () => {
    // Equivalence Partitioning: select located by label, default state
    await expect(locatorsPage.getCountrySelect()).toBeVisible();
    await expect(locatorsPage.getCountrySelect()).toHaveValue('France');
  });

  test('TC07 - Select each country option: value updates correctly', async () => {
    // Equivalence Partitioning: valid options
    const countries = ['France', 'Japan', 'Brazil'];
    for (const country of countries) {
      await locatorsPage.selectCountry(country);
      await expect(locatorsPage.getCountrySelect()).toHaveValue(country);
    }
  });

  test('TC08 - "Email for newsletter" input is visible and accepts text', async () => {
    // Equivalence Partitioning: input located by label
    await expect(locatorsPage.getNewsletterEmail()).toBeVisible();
    await locatorsPage.fillNewsletterEmail('test@example.com');
    expect(await locatorsPage.getNewsletterEmail().inputValue()).toBe('test@example.com');
  });

  test('TC09 - "Email for newsletter" input can be cleared and refilled', async () => {
    // State Transition: empty → filled → cleared → refilled
    await locatorsPage.fillNewsletterEmail('first@example.com');
    expect(await locatorsPage.getNewsletterEmail().inputValue()).toBe('first@example.com');

    await locatorsPage.fillNewsletterEmail('second@example.com');
    expect(await locatorsPage.getNewsletterEmail().inputValue()).toBe('second@example.com');
  });

  // ─── getByPlaceholder ───────────────────────────────────────────────────────

  test('TC10 - "Search the site" input is visible and empty by default', async () => {
    // Equivalence Partitioning: input located by placeholder
    await expect(locatorsPage.getSearchInput()).toBeVisible();
    expect(await locatorsPage.getSearchInput().inputValue()).toBe('');
  });

  test('TC11 - "Filter by tag" input accepts and displays typed text', async () => {
    // Equivalence Partitioning: input located by placeholder
    await expect(locatorsPage.getFilterInput()).toBeVisible();
    await locatorsPage.fillFilterInput('automation');
    expect(await locatorsPage.getFilterInput().inputValue()).toBe('automation');
  });

  // ─── getByAltText ───────────────────────────────────────────────────────────

  test('TC12 - Image with alt text "User avatar" is visible', async () => {
    // Equivalence Partitioning: image located by alt text
    await expect(locatorsPage.getUserAvatar()).toBeVisible();
    await expect(locatorsPage.getUserAvatar()).toHaveAttribute('alt', 'User avatar');
  });

  // ─── getByTitle ─────────────────────────────────────────────────────────────

  test('TC13 - Button with title "Refresh content" is visible and clickable', async () => {
    // Equivalence Partitioning: button located by title attribute
    await expect(locatorsPage.getRefreshButton()).toBeVisible();
    await expect(locatorsPage.getRefreshButton()).toHaveText('Reload');
    await expect(locatorsPage.getRefreshButton()).toBeEnabled();
    await locatorsPage.clickRefreshButton();
  });

  test('TC14 - Span with title "Settings panel" is visible', async () => {
    // Equivalence Partitioning: span located by title attribute
    await expect(locatorsPage.getSettingsSpan()).toBeVisible();
    await expect(locatorsPage.getSettingsSpan()).toHaveText('Settings');
  });

  // ─── getByTestId ────────────────────────────────────────────────────────────

  test('TC15 - "All systems operational" status text is visible (by test ID)', async () => {
    // Equivalence Partitioning: element located by data-testid
    await expect(locatorsPage.getStatusMessage()).toBeVisible();
    await expect(locatorsPage.getStatusMessage()).toHaveText('All systems operational');
  });

  test('TC16 - "Username: Alice" text is visible (by test ID)', async () => {
    // Equivalence Partitioning: element located by data-testid
    await expect(locatorsPage.getUserName()).toBeVisible();
    await expect(locatorsPage.getUserName()).toHaveText('Username: Alice');
  });

  // ─── Legacy CSS ─────────────────────────────────────────────────────────────

  test('TC17 - Legacy CSS target element is visible', async () => {
    // Equivalence Partitioning: element located by CSS class
    await expect(locatorsPage.getLegacyCssTarget()).toBeVisible();
  });

  test('TC18 - Legacy CSS target element has correct text', async () => {
    // Equivalence Partitioning: verify text content
    await expect(locatorsPage.getLegacyCssTarget()).toHaveText('This is a legacy CSS target');
  });

  // ─── XPath Practice: List ───────────────────────────────────────────────────

  test('TC19 - Task list contains exactly 3 items', async () => {
    // Equivalence Partitioning: list item count
    await expect(locatorsPage.getTaskListItems()).toHaveCount(3);
  });

  test('TC20 - Task list items have correct text', async () => {
    // Equivalence Partitioning: verify all list item values
    const items = locatorsPage.getTaskListItems();
    await expect(items.nth(0)).toHaveText('Task 1: Review');
    await expect(items.nth(1)).toHaveText('Task 2: Implement');
    await expect(items.nth(2)).toHaveText('Task 3: Deploy');
  });

  test('TC21 - Each list item is visible', async () => {
    // Equivalence Partitioning: visibility of each item
    const items = locatorsPage.getTaskListItems();
    for (let i = 0; i < 3; i++) {
      await expect(items.nth(i)).toBeVisible();
    }
  });

  // ─── XPath Practice: Table ──────────────────────────────────────────────────

  test('TC22 - Table has correct column headers: Product, Status, Stock', async () => {
    // Equivalence Partitioning: table structure
    const headers = locatorsPage.getProductTableHeaders();
    await expect(headers).toHaveCount(3);
    await expect(headers.nth(0)).toHaveText('Product');
    await expect(headers.nth(1)).toHaveText('Status');
    await expect(headers.nth(2)).toHaveText('Stock');
  });

  test('TC23 - Table contains exactly 3 data rows', async () => {
    // Equivalence Partitioning: row count
    await expect(locatorsPage.getProductTableRows()).toHaveCount(3);
  });

  test('TC24 - Row "Headphones": Status "Available", Stock "12"', async () => {
    // Equivalence Partitioning: valid product with stock
    const statuses = await locatorsPage.getProductColumnValues('Status');
    const stocks = await locatorsPage.getProductColumnValues('Stock');
    const products = await locatorsPage.getProductColumnValues('Product');
    const idx = products.indexOf('Headphones');
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(statuses[idx]).toBe('Available');
    expect(stocks[idx]).toBe('12');
  });

  test('TC25 - Row "Monitor": Status "Out of stock", Stock "0"', async () => {
    // Equivalence Partitioning: product with zero stock (distinct class)
    const statuses = await locatorsPage.getProductColumnValues('Status');
    const stocks = await locatorsPage.getProductColumnValues('Stock');
    const products = await locatorsPage.getProductColumnValues('Product');
    const idx = products.indexOf('Monitor');
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(statuses[idx]).toBe('Out of stock');
    expect(stocks[idx]).toBe('0');
  });

  test('TC26 - Row "Keyboard": Status "Available", Stock "5"', async () => {
    // Equivalence Partitioning: valid product with stock
    const statuses = await locatorsPage.getProductColumnValues('Status');
    const stocks = await locatorsPage.getProductColumnValues('Stock');
    const products = await locatorsPage.getProductColumnValues('Product');
    const idx = products.indexOf('Keyboard');
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(statuses[idx]).toBe('Available');
    expect(stocks[idx]).toBe('5');
  });
});
