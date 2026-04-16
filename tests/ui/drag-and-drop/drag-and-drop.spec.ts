import { test, expect } from '../../../fixtures';
import { DragAndDropPage } from '../../../pages/DragAndDropPage';

/**
 * Drag and Drop tests for
 * https://practice.expandtesting.com/drag-and-drop
 *
 * Two draggable columns (A and B) whose inner header text swaps on drop.
 *
 * Test cases:
 *   - Default state       (TC01–TC02)
 *   - Drag A to B         (TC03–TC04)
 *   - Drag B to A         (TC05)
 *   - Drag to self        (TC06)
 */

test.describe('Drag and Drop', () => {
  let dndPage: DragAndDropPage;

  test.beforeEach(async ({ page }) => {
    dndPage = new DragAndDropPage(page);
    await dndPage.goto();
  });

  // ─── Default State ──────────────────────────────────────────────────────────

  test('TC01 - Default state: column A displays "A", column B displays "B"', async () => {
    // Equivalence Partitioning: initial state
    await expect(dndPage.getColumnAHeader()).toHaveText('A');
    await expect(dndPage.getColumnBHeader()).toHaveText('B');
  });

  test('TC02 - Both columns are visible and have the draggable attribute', async () => {
    // Equivalence Partitioning: element attributes
    await expect(dndPage.getColumnA()).toBeVisible();
    await expect(dndPage.getColumnB()).toBeVisible();
    await expect(dndPage.getColumnA()).toHaveAttribute('draggable', 'true');
    await expect(dndPage.getColumnB()).toHaveAttribute('draggable', 'true');
  });

  // ─── Drag A to B ───────────────────────────────────────────────────────────

  test('TC03 - Drag A to B: headers swap', async () => {
    // State Transition: A→B swap
    await dndPage.dragAToB();

    await expect(dndPage.getColumnAHeader()).toHaveText('B');
    await expect(dndPage.getColumnBHeader()).toHaveText('A');
  });

  test('TC04 - Drag A→B then drag back: columns return to original state', async () => {
    // State Transition: swap → swap back → original
    await dndPage.dragAToB();
    await expect(dndPage.getColumnAHeader()).toHaveText('B');
    await expect(dndPage.getColumnBHeader()).toHaveText('A');

    await dndPage.dragAToB();
    await expect(dndPage.getColumnAHeader()).toHaveText('A');
    await expect(dndPage.getColumnBHeader()).toHaveText('B');
  });

  // ─── Drag B to A ───────────────────────────────────────────────────────────

  test('TC05 - Drag B to A: headers swap (opposite direction)', async () => {
    // Equivalence Partitioning: same result, opposite drag direction
    await dndPage.dragBToA();

    await expect(dndPage.getColumnAHeader()).toHaveText('B');
    await expect(dndPage.getColumnBHeader()).toHaveText('A');
  });

  // ─── Drag to Self ──────────────────────────────────────────────────────────

  test('TC06 - Drag A onto itself: no change', async () => {
    // Equivalence Partitioning: no-op action
    await dndPage.dragAToSelf();

    await expect(dndPage.getColumnAHeader()).toHaveText('A');
    await expect(dndPage.getColumnBHeader()).toHaveText('B');
  });
});
