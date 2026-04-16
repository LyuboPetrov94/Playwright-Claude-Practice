import { test, expect } from '../../../fixtures';
import { DynamicPaginationTablePage } from '../../../pages/DynamicPaginationTablePage';

/**
 * Dynamic Pagination Table tests for
 * https://practice.expandtesting.com/dynamic-pagination-table
 *
 * DataTables-powered student table with 10 predefined rows.
 * Features: pagination, rows-per-page selector, column sorting, live search.
 *
 * Test cases:
 *   - Pagination           (TC01–TC06)
 *   - Rows per page        (TC07–TC10)
 *   - Sorting              (TC11–TC17)
 *   - Search / Filter      (TC18–TC21)
 */

// All 10 student names in default ascending order
const ALL_NAMES_ASC = [
  'Alice Johnson',
  'Bob Williams',
  'Daniel Martinez',
  'Emma Brown',
  'Ethan Thomas',
  'Jane Smith',
  'John Doe',
  'Michael Davis',
  'Olivia Wilson',
  'Sophia Anderson',
];

test.describe('Dynamic Pagination Table', () => {
  let tablePage: DynamicPaginationTablePage;

  test.beforeEach(async ({ page }) => {
    tablePage = new DynamicPaginationTablePage(page);
    await tablePage.goto();
  });

  // ─── Pagination ──────────────────────────────────────────────────────────────

  test('TC01 - Default state: 3 rows visible, page 1 active, Previous disabled, Next enabled', async () => {
    // Equivalence Partitioning: initial page load state
    expect(await tablePage.getVisibleRowCount()).toBe(3);
    await expect(tablePage.getActivePageNumber()).toHaveText('1');
    await expect(tablePage.getPreviousButton()).toHaveClass(/disabled/);
    await expect(tablePage.getNextButton()).not.toHaveClass(/disabled/);
  });

  test('TC02 - Click Next: page 2 shows next 3 rows, Previous becomes enabled', async () => {
    // State Transition: page 1 → page 2
    await tablePage.clickNext();

    await expect(tablePage.getActivePageNumber()).toHaveText('2');
    expect(await tablePage.getVisibleRowCount()).toBe(3);
    await expect(tablePage.getPreviousButton()).not.toHaveClass(/disabled/);

    // Verify these are different rows (page 2 = names at index 3–5)
    const names = await tablePage.getColumnValues('Student Name');
    expect(names).toEqual(ALL_NAMES_ASC.slice(3, 6));
  });

  test('TC03 - Navigate to last page: Next disabled, shows remaining 1 row', async () => {
    // Boundary Value: last page with 10 rows / 3 per page = page 4 has 1 row
    await tablePage.clickPageNumber(4);

    await expect(tablePage.getActivePageNumber()).toHaveText('4');
    await expect(tablePage.getNextButton()).toHaveClass(/disabled/);
    await expect(tablePage.getPreviousButton()).not.toHaveClass(/disabled/);
    expect(await tablePage.getVisibleRowCount()).toBe(1);

    const names = await tablePage.getColumnValues('Student Name');
    expect(names).toEqual(['Sophia Anderson']);
  });

  test('TC04 - Click Previous from page 2: returns to page 1, Previous disabled', async () => {
    // State Transition: page 2 → page 1
    await tablePage.clickNext();
    await expect(tablePage.getActivePageNumber()).toHaveText('2');

    await tablePage.clickPrevious();

    await expect(tablePage.getActivePageNumber()).toHaveText('1');
    await expect(tablePage.getPreviousButton()).toHaveClass(/disabled/);
  });

  test('TC05 - Click page number directly: correct rows displayed', async () => {
    // Equivalence Partitioning: direct page navigation
    await tablePage.clickPageNumber(3);

    await expect(tablePage.getActivePageNumber()).toHaveText('3');
    const names = await tablePage.getColumnValues('Student Name');
    expect(names).toEqual(ALL_NAMES_ASC.slice(6, 9));
  });

  test('TC06 - Info text updates correctly on each page', async () => {
    // Equivalence Partitioning: info text reflects current page range
    await expect(tablePage.getInfoText()).toHaveText('Showing 1 to 3 of 10 entries');

    await tablePage.clickPageNumber(2);
    await expect(tablePage.getInfoText()).toHaveText('Showing 4 to 6 of 10 entries');

    await tablePage.clickPageNumber(4);
    await expect(tablePage.getInfoText()).toHaveText('Showing 10 to 10 of 10 entries');
  });

  // ─── Rows Per Page ───────────────────────────────────────────────────────────

  test('TC07 - Select 5 rows per page: shows 5 rows, pagination has 2 pages', async () => {
    // Equivalence Partitioning: change page size
    await tablePage.selectRowsPerPage('5');

    expect(await tablePage.getVisibleRowCount()).toBe(5);
    await expect(tablePage.getInfoText()).toHaveText('Showing 1 to 5 of 10 entries');
  });

  test('TC08 - Select 10 rows per page: all rows on 1 page, both Previous and Next disabled', async () => {
    // Boundary Value: page size equals total rows
    await tablePage.selectRowsPerPage('10');

    expect(await tablePage.getVisibleRowCount()).toBe(10);
    await expect(tablePage.getPreviousButton()).toHaveClass(/disabled/);
    await expect(tablePage.getNextButton()).toHaveClass(/disabled/);
    await expect(tablePage.getInfoText()).toHaveText('Showing 1 to 10 of 10 entries');
  });

  test('TC09 - Select All: shows all 10 rows, only page 1 in pagination', async () => {
    // Equivalence Partitioning: "All" option
    await tablePage.selectRowsPerPage('-1');

    expect(await tablePage.getVisibleRowCount()).toBe(10);
    await expect(tablePage.getPreviousButton()).toHaveClass(/disabled/);
    await expect(tablePage.getNextButton()).toHaveClass(/disabled/);
  });

  test('TC10 - Change from All back to 3: pagination reappears with 4 pages', async () => {
    // State Transition: All → 3 restores original pagination
    await tablePage.selectRowsPerPage('-1');
    expect(await tablePage.getVisibleRowCount()).toBe(10);

    await tablePage.selectRowsPerPage('3');

    expect(await tablePage.getVisibleRowCount()).toBe(3);
    await expect(tablePage.getActivePageNumber()).toHaveText('1');
    await expect(tablePage.getNextButton()).not.toHaveClass(/disabled/);
  });

  // ─── Sorting ─────────────────────────────────────────────────────────────────

  test('TC11 - Default sort: Student Name ascending', async () => {
    // Equivalence Partitioning: initial sort state
    await expect(tablePage.getColumnHeader('Student Name')).toHaveClass(/sorting_asc/);

    // Show all rows to verify full order
    await tablePage.selectRowsPerPage('-1');
    const names = await tablePage.getColumnValues('Student Name');
    expect(names).toEqual(ALL_NAMES_ASC);
  });

  test('TC12 - Click Student Name: toggles to descending', async () => {
    // State Transition: ascending → descending
    await tablePage.clickColumnHeader('Student Name');

    await expect(tablePage.getColumnHeader('Student Name')).toHaveClass(/sorting_desc/);

    await tablePage.selectRowsPerPage('-1');
    const names = await tablePage.getColumnValues('Student Name');
    expect(names).toEqual([...ALL_NAMES_ASC].reverse());
  });

  test('TC13 - Sort by Gender ascending', async () => {
    // Equivalence Partitioning: sort by Gender
    await tablePage.clickColumnHeader('Gender');

    await expect(tablePage.getColumnHeader('Gender')).toHaveClass(/sorting_asc/);

    await tablePage.selectRowsPerPage('-1');
    const values = await tablePage.getColumnValues('Gender');
    expect(values).toEqual([...values].sort());
  });

  test('TC14 - Sort by Class Level ascending', async () => {
    // Equivalence Partitioning: sort by Class Level
    await tablePage.clickColumnHeader('Class Level');

    await expect(tablePage.getColumnHeader('Class Level')).toHaveClass(/sorting_asc/);

    await tablePage.selectRowsPerPage('-1');
    const values = await tablePage.getColumnValues('Class Level');
    expect(values).toEqual([...values].sort());
  });

  test('TC15 - Sort by Home State ascending', async () => {
    // Equivalence Partitioning: sort by Home State
    await tablePage.clickColumnHeader('Home State');

    await expect(tablePage.getColumnHeader('Home State')).toHaveClass(/sorting_asc/);

    await tablePage.selectRowsPerPage('-1');
    const values = await tablePage.getColumnValues('Home State');
    expect(values).toEqual([...values].sort());
  });

  test('TC16 - Sort by Major ascending', async () => {
    // Equivalence Partitioning: sort by Major
    await tablePage.clickColumnHeader('Major');

    await expect(tablePage.getColumnHeader('Major')).toHaveClass(/sorting_asc/);

    await tablePage.selectRowsPerPage('-1');
    const values = await tablePage.getColumnValues('Major');
    expect(values).toEqual([...values].sort());
  });

  test('TC17 - Sort by Extracurricular Activity ascending', async () => {
    // Equivalence Partitioning: sort by Extracurricular Activity
    await tablePage.clickColumnHeader('Extracurricular Activity');

    await expect(tablePage.getColumnHeader('Extracurricular Activity')).toHaveClass(/sorting_asc/);

    await tablePage.selectRowsPerPage('-1');
    const values = await tablePage.getColumnValues('Extracurricular Activity');
    expect(values).toEqual([...values].sort());
  });

  // ─── Search / Filter ─────────────────────────────────────────────────────────

  test('TC18 - Search by name: filters to matching rows', async () => {
    // Equivalence Partitioning: search matches name column
    await tablePage.search('John');

    const names = await tablePage.getColumnValues('Student Name');
    expect(names).toEqual(['Alice Johnson', 'John Doe']);
    await expect(tablePage.getInfoText()).toContainText('filtered from 10 total entries');
  });

  test('TC19 - Search matches across columns', async () => {
    // Equivalence Partitioning: search by Home State value
    await tablePage.search('California');

    const names = await tablePage.getColumnValues('Student Name');
    expect(names).toEqual(['John Doe']);
    await expect(tablePage.getInfoText()).toContainText('filtered from 10 total entries');
  });

  test('TC20 - No match: shows empty state and filtered info', async () => {
    // Boundary Value: search with zero results
    await tablePage.search('ZZZZNOTEXIST');

    await expect(tablePage.getEmptyRow()).toHaveText('No matching records found');
    await expect(tablePage.getInfoText()).toHaveText(
      'Showing 0 to 0 of 0 entries (filtered from 10 total entries)'
    );
  });

  test('TC21 - Clear search: all rows restored, pagination resets', async () => {
    // State Transition: filtered → cleared
    await tablePage.search('John');
    await expect(tablePage.getInfoText()).toContainText('filtered from 10 total entries');

    await tablePage.clearSearch();

    // Wait for DataTables to re-render the unfiltered rows before asserting
    await expect(tablePage.getTableRows()).toHaveCount(3);
    await expect(tablePage.getActivePageNumber()).toHaveText('1');
    await expect(tablePage.getInfoText()).toHaveText('Showing 1 to 3 of 10 entries');
  });
});
