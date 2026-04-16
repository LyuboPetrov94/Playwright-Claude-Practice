import { test, expect } from '../../../fixtures';
import { DragAndDropCirclesPage } from '../../../pages/DragAndDropCirclesPage';

/**
 * Drag and Drop Circles tests for
 * https://practice.expandtesting.com/drag-and-drop-circles
 *
 * Three colored circles (red, green, blue) in a source area that can be
 * dragged into a target drop zone. Circles are appended in drag order.
 *
 * Test cases:
 *   - Default state             (TC01–TC03)
 *   - Drag single circle        (TC04–TC06)
 *   - Drag all 3 (order)        (TC07–TC12)
 *   - Drag 2 (order + remaining)(TC13–TC18)
 *   - Re-drag back to source    (TC19–TC21)
 *   - Re-drag from full target  (TC22–TC24)
 *   - Re-drag within target     (TC25–TC27)
 */

test.describe('Drag and Drop Circles', () => {
  let dndPage: DragAndDropCirclesPage;

  test.beforeEach(async ({ page }) => {
    dndPage = new DragAndDropCirclesPage(page);
    await dndPage.goto();
  });

  // ─── Default State ──────────────────────────────────────────────────────────

  test('TC01 - Default state: 3 circles are visible in the source area', async () => {
    // Equivalence Partitioning: initial source state
    await expect(dndPage.getSourceCircles()).toHaveCount(3);
    await expect(dndPage.getSourceCircle('red')).toBeVisible();
    await expect(dndPage.getSourceCircle('green')).toBeVisible();
    await expect(dndPage.getSourceCircle('blue')).toBeVisible();
  });

  test('TC02 - Target drop zone is visible and empty', async () => {
    // Equivalence Partitioning: initial target state
    await expect(dndPage.getTarget()).toBeVisible();
    await expect(dndPage.getTargetItems()).toHaveCount(0);
  });

  test('TC03 - All circles have the draggable attribute', async () => {
    // Equivalence Partitioning: draggable attribute
    await expect(dndPage.getSourceCircle('red')).toHaveAttribute('draggable', 'true');
    await expect(dndPage.getSourceCircle('green')).toHaveAttribute('draggable', 'true');
    await expect(dndPage.getSourceCircle('blue')).toHaveAttribute('draggable', 'true');
  });

  // ─── Drag Single Circle ─────────────────────────────────────────────────────

  test('TC04 - Drag red to target: red in target, 2 remaining in source', async () => {
    // State Transition: single circle drag
    await dndPage.dragCircleToTarget('red');

    await expect(dndPage.getTargetItems()).toHaveCount(1);
    await expect(dndPage.getTargetItem('red')).toBeVisible();
    await expect(dndPage.getSourceCircles()).toHaveCount(2);
    expect(await dndPage.getSourceCircleColors()).toEqual(['green', 'blue']);
  });

  test('TC05 - Drag green to target: green in target, 2 remaining in source', async () => {
    // State Transition: single circle drag
    await dndPage.dragCircleToTarget('green');

    await expect(dndPage.getTargetItems()).toHaveCount(1);
    await expect(dndPage.getTargetItem('green')).toBeVisible();
    await expect(dndPage.getSourceCircles()).toHaveCount(2);
    expect(await dndPage.getSourceCircleColors()).toEqual(['red', 'blue']);
  });

  test('TC06 - Drag blue to target: blue in target, 2 remaining in source', async () => {
    // State Transition: single circle drag
    await dndPage.dragCircleToTarget('blue');

    await expect(dndPage.getTargetItems()).toHaveCount(1);
    await expect(dndPage.getTargetItem('blue')).toBeVisible();
    await expect(dndPage.getSourceCircles()).toHaveCount(2);
    expect(await dndPage.getSourceCircleColors()).toEqual(['red', 'green']);
  });

  // ─── Drag All 3 — Order Assertions ──────────────────────────────────────────

  test('TC07 - Drag all 3: red → green → blue', async () => {
    // State Transition: all permutations — target order matches drag order
    await dndPage.dragCircleToTarget('red');
    await dndPage.dragCircleToTarget('green');
    await dndPage.dragCircleToTarget('blue');

    expect(await dndPage.getTargetItemColors()).toEqual(['red', 'green', 'blue']);
    await expect(dndPage.getSourceCircles()).toHaveCount(0);
  });

  test('TC08 - Drag all 3: red → blue → green', async () => {
    // State Transition: all permutations
    await dndPage.dragCircleToTarget('red');
    await dndPage.dragCircleToTarget('blue');
    await dndPage.dragCircleToTarget('green');

    expect(await dndPage.getTargetItemColors()).toEqual(['red', 'blue', 'green']);
    await expect(dndPage.getSourceCircles()).toHaveCount(0);
  });

  test('TC09 - Drag all 3: green → red → blue', async () => {
    // State Transition: all permutations
    await dndPage.dragCircleToTarget('green');
    await dndPage.dragCircleToTarget('red');
    await dndPage.dragCircleToTarget('blue');

    expect(await dndPage.getTargetItemColors()).toEqual(['green', 'red', 'blue']);
    await expect(dndPage.getSourceCircles()).toHaveCount(0);
  });

  test('TC10 - Drag all 3: green → blue → red', async () => {
    // State Transition: all permutations
    await dndPage.dragCircleToTarget('green');
    await dndPage.dragCircleToTarget('blue');
    await dndPage.dragCircleToTarget('red');

    expect(await dndPage.getTargetItemColors()).toEqual(['green', 'blue', 'red']);
    await expect(dndPage.getSourceCircles()).toHaveCount(0);
  });

  test('TC11 - Drag all 3: blue → red → green', async () => {
    // State Transition: all permutations
    await dndPage.dragCircleToTarget('blue');
    await dndPage.dragCircleToTarget('red');
    await dndPage.dragCircleToTarget('green');

    expect(await dndPage.getTargetItemColors()).toEqual(['blue', 'red', 'green']);
    await expect(dndPage.getSourceCircles()).toHaveCount(0);
  });

  test('TC12 - Drag all 3: blue → green → red', async () => {
    // State Transition: all permutations
    await dndPage.dragCircleToTarget('blue');
    await dndPage.dragCircleToTarget('green');
    await dndPage.dragCircleToTarget('red');

    expect(await dndPage.getTargetItemColors()).toEqual(['blue', 'green', 'red']);
    await expect(dndPage.getSourceCircles()).toHaveCount(0);
  });

  // ─── Drag 2 Circles — Order + Remaining ─────────────────────────────────────

  test('TC13 - Drag 2: red → green; blue remains in source', async () => {
    // State Transition: 2 of 3 dragged, 1 remaining
    await dndPage.dragCircleToTarget('red');
    await dndPage.dragCircleToTarget('green');

    expect(await dndPage.getTargetItemColors()).toEqual(['red', 'green']);
    await expect(dndPage.getSourceCircles()).toHaveCount(1);
    expect(await dndPage.getSourceCircleColors()).toEqual(['blue']);
  });

  test('TC14 - Drag 2: red → blue; green remains in source', async () => {
    // State Transition: 2 of 3 dragged, 1 remaining
    await dndPage.dragCircleToTarget('red');
    await dndPage.dragCircleToTarget('blue');

    expect(await dndPage.getTargetItemColors()).toEqual(['red', 'blue']);
    await expect(dndPage.getSourceCircles()).toHaveCount(1);
    expect(await dndPage.getSourceCircleColors()).toEqual(['green']);
  });

  test('TC15 - Drag 2: green → red; blue remains in source', async () => {
    // State Transition: 2 of 3 dragged, 1 remaining
    await dndPage.dragCircleToTarget('green');
    await dndPage.dragCircleToTarget('red');

    expect(await dndPage.getTargetItemColors()).toEqual(['green', 'red']);
    await expect(dndPage.getSourceCircles()).toHaveCount(1);
    expect(await dndPage.getSourceCircleColors()).toEqual(['blue']);
  });

  test('TC16 - Drag 2: green → blue; red remains in source', async () => {
    // State Transition: 2 of 3 dragged, 1 remaining
    await dndPage.dragCircleToTarget('green');
    await dndPage.dragCircleToTarget('blue');

    expect(await dndPage.getTargetItemColors()).toEqual(['green', 'blue']);
    await expect(dndPage.getSourceCircles()).toHaveCount(1);
    expect(await dndPage.getSourceCircleColors()).toEqual(['red']);
  });

  test('TC17 - Drag 2: blue → red; green remains in source', async () => {
    // State Transition: 2 of 3 dragged, 1 remaining
    await dndPage.dragCircleToTarget('blue');
    await dndPage.dragCircleToTarget('red');

    expect(await dndPage.getTargetItemColors()).toEqual(['blue', 'red']);
    await expect(dndPage.getSourceCircles()).toHaveCount(1);
    expect(await dndPage.getSourceCircleColors()).toEqual(['green']);
  });

  test('TC18 - Drag 2: blue → green; red remains in source', async () => {
    // State Transition: 2 of 3 dragged, 1 remaining
    await dndPage.dragCircleToTarget('blue');
    await dndPage.dragCircleToTarget('green');

    expect(await dndPage.getTargetItemColors()).toEqual(['blue', 'green']);
    await expect(dndPage.getSourceCircles()).toHaveCount(1);
    expect(await dndPage.getSourceCircleColors()).toEqual(['red']);
  });

  // ─── Re-drag from Target — Cannot Drop Back to Source ───────────────────────

  test('TC19 - Drag red to target, drag red back to source: red remains in target', async () => {
    // State Transition: invalid transition — source does not accept drops
    await dndPage.dragCircleToTarget('red');
    await expect(dndPage.getTargetItems()).toHaveCount(1);

    await dndPage.dragTargetItemToSource('red');

    await expect(dndPage.getTargetItems()).toHaveCount(1);
    await expect(dndPage.getTargetItem('red')).toBeVisible();
    await expect(dndPage.getSourceCircles()).toHaveCount(2);
    expect(await dndPage.getSourceCircleColors()).toEqual(['green', 'blue']);
  });

  test('TC20 - Drag green to target, drag green back to source: green remains in target', async () => {
    // State Transition: invalid transition — source does not accept drops
    await dndPage.dragCircleToTarget('green');
    await expect(dndPage.getTargetItems()).toHaveCount(1);

    await dndPage.dragTargetItemToSource('green');

    await expect(dndPage.getTargetItems()).toHaveCount(1);
    await expect(dndPage.getTargetItem('green')).toBeVisible();
    await expect(dndPage.getSourceCircles()).toHaveCount(2);
    expect(await dndPage.getSourceCircleColors()).toEqual(['red', 'blue']);
  });

  test('TC21 - Drag blue to target, drag blue back to source: blue remains in target', async () => {
    // State Transition: invalid transition — source does not accept drops
    await dndPage.dragCircleToTarget('blue');
    await expect(dndPage.getTargetItems()).toHaveCount(1);

    await dndPage.dragTargetItemToSource('blue');

    await expect(dndPage.getTargetItems()).toHaveCount(1);
    await expect(dndPage.getTargetItem('blue')).toBeVisible();
    await expect(dndPage.getSourceCircles()).toHaveCount(2);
    expect(await dndPage.getSourceCircleColors()).toEqual(['red', 'green']);
  });

  // ─── Re-drag from Full Target — Drag Each Back ──────────────────────────────

  test('TC22 - Drag all 3 to target, drag red back to source: all 3 remain in target', async () => {
    // State Transition: invalid transition with full target
    await dndPage.dragCircleToTarget('red');
    await dndPage.dragCircleToTarget('green');
    await dndPage.dragCircleToTarget('blue');
    await expect(dndPage.getTargetItems()).toHaveCount(3);

    await dndPage.dragTargetItemToSource('red');

    await expect(dndPage.getTargetItems()).toHaveCount(3);
    await expect(dndPage.getSourceCircles()).toHaveCount(0);
  });

  test('TC23 - Drag all 3 to target, drag green back to source: all 3 remain in target', async () => {
    // State Transition: invalid transition with full target
    await dndPage.dragCircleToTarget('red');
    await dndPage.dragCircleToTarget('green');
    await dndPage.dragCircleToTarget('blue');
    await expect(dndPage.getTargetItems()).toHaveCount(3);

    await dndPage.dragTargetItemToSource('green');

    await expect(dndPage.getTargetItems()).toHaveCount(3);
    await expect(dndPage.getSourceCircles()).toHaveCount(0);
  });

  test('TC24 - Drag all 3 to target, drag blue back to source: all 3 remain in target', async () => {
    // State Transition: invalid transition with full target
    await dndPage.dragCircleToTarget('red');
    await dndPage.dragCircleToTarget('green');
    await dndPage.dragCircleToTarget('blue');
    await expect(dndPage.getTargetItems()).toHaveCount(3);

    await dndPage.dragTargetItemToSource('blue');

    await expect(dndPage.getTargetItems()).toHaveCount(3);
    await expect(dndPage.getSourceCircles()).toHaveCount(0);
  });

  // ─── Re-drag Within Target ──────────────────────────────────────────────────

  test('TC25 - Drag red to target, drag red within target: no duplication', async () => {
    // State Transition: re-drag within same zone
    await dndPage.dragCircleToTarget('red');
    await expect(dndPage.getTargetItems()).toHaveCount(1);

    await dndPage.dragTargetItemWithinTarget('red');

    await expect(dndPage.getTargetItems()).toHaveCount(1);
    await expect(dndPage.getTargetItem('red')).toBeVisible();
  });

  test('TC26 - Drag green to target, drag green within target: no duplication', async () => {
    // State Transition: re-drag within same zone
    await dndPage.dragCircleToTarget('green');
    await expect(dndPage.getTargetItems()).toHaveCount(1);

    await dndPage.dragTargetItemWithinTarget('green');

    await expect(dndPage.getTargetItems()).toHaveCount(1);
    await expect(dndPage.getTargetItem('green')).toBeVisible();
  });

  test('TC27 - Drag blue to target, drag blue within target: no duplication', async () => {
    // State Transition: re-drag within same zone
    await dndPage.dragCircleToTarget('blue');
    await expect(dndPage.getTargetItems()).toHaveCount(1);

    await dndPage.dragTargetItemWithinTarget('blue');

    await expect(dndPage.getTargetItems()).toHaveCount(1);
    await expect(dndPage.getTargetItem('blue')).toBeVisible();
  });
});
