import { test, expect } from '../../../fixtures';
import { AddRemoveElementsPage } from '../../../pages/AddRemoveElementsPage';

/**
 * Add/Remove Elements tests for https://practice.expandtesting.com/add-remove-elements
 *
 * Behaviour:
 *   - Clicking "Add Element" appends a Delete button (class="added-manually btn btn-info")
 *     to the #elements container.
 *   - Clicking any Delete button removes #elements button:first-child — the site's
 *     handler does not use event context, so every Delete click removes the FIRST
 *     button regardless of which was clicked. TC06 pins this behaviour.
 *
 * Test cases:
 *   - Initial state                      (TC01)
 *   - EP: add one                        (TC02)
 *   - Scale                              (TC03)
 *   - State transition: Sn → Sn-1        (TC04–TC05)
 *   - Site-specific behaviour            (TC06)
 *   - State recovery                     (TC07)
 *   - Reload behaviour                   (TC08)
 */

test.describe('Add/Remove Elements', () => {
  let addRemovePage: AddRemoveElementsPage;

  test.beforeEach(async ({ page }) => {
    addRemovePage = new AddRemoveElementsPage(page);
    await addRemovePage.goto();
  });

  // ─── Initial state ────────────────────────────────────────────────────────

  test('TC01 - Initial state has no Delete buttons and Add button is enabled', async () => {
    await expect(addRemovePage.getElementsContainer()).toBeEmpty();
    await expect(addRemovePage.getDeleteButtons()).toHaveCount(0);
    await expect(addRemovePage.getAddButton()).toBeVisible();
    await expect(addRemovePage.getAddButton()).toBeEnabled();
  });

  // ─── EP: valid class — one Add click ──────────────────────────────────────

  test('TC02 - Clicking Add once creates a Delete button with expected text and class', async () => {
    await addRemovePage.clickAdd();

    const deleteButtons = addRemovePage.getDeleteButtons();
    await expect(deleteButtons).toHaveCount(1);
    await expect(deleteButtons.first()).toHaveText('Delete');
    await expect(deleteButtons.first()).toHaveClass(/added-manually/);
  });

  // ─── Scale ────────────────────────────────────────────────────────────────

  test('TC03 - Clicking Add ten times creates ten Delete buttons', async () => {
    await addRemovePage.clickAdd(10);

    await expect(addRemovePage.getDeleteButtons()).toHaveCount(10);
  });

  // ─── State transition: Sn → Sn-1 ──────────────────────────────────────────

  test('TC04 - Adding one then deleting one returns the count to zero', async () => {
    await addRemovePage.clickAdd();
    await expect(addRemovePage.getDeleteButtons()).toHaveCount(1);

    await addRemovePage.clickDeleteAt(0);
    await expect(addRemovePage.getDeleteButtons()).toHaveCount(0);
  });

  test('TC05 - Adding three then deleting three walks the count 3 → 2 → 1 → 0', async () => {
    await addRemovePage.clickAdd(3);
    await expect(addRemovePage.getDeleteButtons()).toHaveCount(3);

    await addRemovePage.clickDeleteAt(0);
    await expect(addRemovePage.getDeleteButtons()).toHaveCount(2);

    await addRemovePage.clickDeleteAt(0);
    await expect(addRemovePage.getDeleteButtons()).toHaveCount(1);

    await addRemovePage.clickDeleteAt(0);
    await expect(addRemovePage.getDeleteButtons()).toHaveCount(0);
  });

  // ─── Site-specific behaviour ──────────────────────────────────────────────

  test('TC06 - Clicking the last Delete button removes the first (site quirk)', async () => {
    // The site's deleteElement() always removes #elements button:first-child,
    // ignoring which button fired the event. Pin that behaviour here.
    await addRemovePage.clickAdd(3);
    const tagged = await addRemovePage.tagDeleteButtons();

    // Sanity: all three tagged buttons are present before the click.
    await expect(tagged(0)).toBeVisible();
    await expect(tagged(1)).toBeVisible();
    await expect(tagged(2)).toBeVisible();

    // Click the LAST Delete button.
    await tagged(2).click();

    // The FIRST is the one that was removed; the other two remain.
    await expect(tagged(0)).toHaveCount(0);
    await expect(tagged(1)).toBeVisible();
    await expect(tagged(2)).toBeVisible();
    await expect(addRemovePage.getDeleteButtons()).toHaveCount(2);
  });

  // ─── State recovery ───────────────────────────────────────────────────────

  test('TC07 - Add button still works after adding and deleting all buttons', async () => {
    await addRemovePage.clickAdd(2);
    await addRemovePage.clickDeleteAt(0);
    await addRemovePage.clickDeleteAt(0);
    await expect(addRemovePage.getDeleteButtons()).toHaveCount(0);

    await addRemovePage.clickAdd();
    await expect(addRemovePage.getDeleteButtons()).toHaveCount(1);
  });

  // ─── Reload behaviour ─────────────────────────────────────────────────────

  test('TC08 - Page reload resets the Delete buttons to zero', async () => {
    await addRemovePage.clickAdd(5);
    await expect(addRemovePage.getDeleteButtons()).toHaveCount(5);

    await addRemovePage.reload();

    await expect(addRemovePage.getDeleteButtons()).toHaveCount(0);
    await expect(addRemovePage.getElementsContainer()).toBeEmpty();
  });
});
