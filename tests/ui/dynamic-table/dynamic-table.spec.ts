import { test, expect } from '../../../fixtures';
import { DynamicTablePage } from '../../../pages/DynamicTablePage';

/**
 * Dynamic Table tests for https://practice.expandtesting.com/dynamic-table
 *
 * The page displays a Task Manager table whose column order, row order,
 * and cell values are randomised on every page load. A yellow label shows
 * Chrome's CPU value for comparison.
 *
 * Test cases:
 *   - Core challenge      (TC01)
 *   - Table structure      (TC02–TC04)
 *   - Value formats        (TC05–TC07)
 *   - Dynamic behaviour    (TC08–TC10)
 */

const EXPECTED_COLUMNS = ['Name', 'CPU', 'Memory', 'Disk', 'Network'];
const EXPECTED_PROCESSES = ['System', 'Internet Explorer', 'Firefox', 'Chrome'];

test.describe('Dynamic Table', () => {
  let tablePage: DynamicTablePage;

  test.beforeEach(async ({ page }) => {
    tablePage = new DynamicTablePage(page);
    await tablePage.goto();
  });

  // ─── Core Challenge ──────────────────────────────────────────────────────────

  test('TC01 - Chrome CPU value in the table matches the yellow label', async () => {
    // Equivalence Partitioning: the stated challenge — extract Chrome's CPU from
    // a table with shuffled columns/rows and compare to the label
    const cpuFromTable = await tablePage.getCellValue('Chrome', 'CPU');
    const cpuFromLabel = await tablePage.getChromeCpuLabelValue();

    expect(cpuFromTable).toBe(cpuFromLabel);
  });

  // ─── Table Structure ─────────────────────────────────────────────────────────

  test('TC02 - Table contains all expected column headers', async () => {
    // Equivalence Partitioning: verify header presence regardless of order
    const headers = await tablePage.getColumnHeaders();

    expect(headers.sort()).toEqual([...EXPECTED_COLUMNS].sort());
  });

  test('TC03 - Table contains all expected process names', async () => {
    // Equivalence Partitioning: verify all 4 processes appear regardless of row order
    const names = await tablePage.getProcessNames();

    expect(names.sort()).toEqual([...EXPECTED_PROCESSES].sort());
  });

  test('TC04 - Every table cell is non-empty', async () => {
    // Boundary Value: no cell should be blank despite random generation
    const allValues = await tablePage.getAllCellValues();

    for (const row of allValues) {
      for (const cell of row) {
        expect(cell.trim()).not.toBe('');
      }
    }
  });

  // ─── Value Formats ───────────────────────────────────────────────────────────

  test('TC05 - CPU values match numeric percentage format', async () => {
    // Equivalence Partitioning: CPU values should be like "1.4%" or "0%"
    for (const process of EXPECTED_PROCESSES) {
      const value = await tablePage.getCellValue(process, 'CPU');
      expect(value).toMatch(/^\d+(\.\d+)?%$/);
    }
  });

  test('TC06 - Memory values match expected format', async () => {
    // Equivalence Partitioning: Memory values should be like "39 MB" or "1,200 MB"
    for (const process of EXPECTED_PROCESSES) {
      const value = await tablePage.getCellValue(process, 'Memory');
      expect(value).toMatch(/^[\d,]+(\.\d+)?\s*MB$/);
    }
  });

  test('TC07 - Disk and Network values match expected formats', async () => {
    // Equivalence Partitioning: Disk = "X MB/s", Network = "X Mbps"
    for (const process of EXPECTED_PROCESSES) {
      const disk = await tablePage.getCellValue(process, 'Disk');
      expect(disk).toMatch(/^[\d,]+(\.\d+)?\s*MB\/s$/);

      const network = await tablePage.getCellValue(process, 'Network');
      expect(network).toMatch(/^[\d,]+(\.\d+)?\s*Mbps$/);
    }
  });

  // ─── Dynamic Behaviour ───────────────────────────────────────────────────────

  test('TC08 - Column order can change on reload', async () => {
    // State Transition: columns should shuffle across reloads
    const orders = new Set<string>();

    for (let i = 0; i < 10; i++) {
      const headers = await tablePage.getColumnHeaders();
      orders.add(headers.join(','));
      await tablePage.reload();
    }

    expect(orders.size).toBeGreaterThan(1);
  });

  test('TC09 - Row order can change on reload', async () => {
    // State Transition: process rows should shuffle across reloads
    const orders = new Set<string>();

    for (let i = 0; i < 10; i++) {
      const names = await tablePage.getProcessNames();
      orders.add(names.join(','));
      await tablePage.reload();
    }

    expect(orders.size).toBeGreaterThan(1);
  });

  test('TC10 - Yellow label matches Chrome CPU after reload', async () => {
    // State Transition: after reload, the label should still reflect the new table data
    await tablePage.reload();

    const cpuFromTable = await tablePage.getCellValue('Chrome', 'CPU');
    const cpuFromLabel = await tablePage.getChromeCpuLabelValue();

    expect(cpuFromTable).toBe(cpuFromLabel);
  });
});
