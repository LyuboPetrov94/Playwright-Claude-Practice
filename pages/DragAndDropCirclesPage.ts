import { Page, Locator } from '@playwright/test';

type CircleColor = 'red' | 'green' | 'blue';

export class DragAndDropCirclesPage {
  private readonly source: Locator;
  private readonly target: Locator;

  constructor(private page: Page) {
    this.source = page.locator('#source');
    this.target = page.locator('#target');
  }

  async goto() {
    await this.page.goto('/drag-and-drop-circles');
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

  getTarget(): Locator {
    return this.target;
  }

  getSourceCircles(): Locator {
    return this.source.locator('div');
  }

  getTargetItems(): Locator {
    return this.target.locator('div');
  }

  getSourceCircle(color: CircleColor): Locator {
    return this.source.locator(`.${color}`);
  }

  getTargetItem(color: CircleColor): Locator {
    return this.target.locator(`.${color}`);
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  /**
   * Simulates HTML5 drag-and-drop by dispatching DataTransfer events manually.
   * Playwright's built-in dragTo() targets the centre of the drop zone, which
   * can land on already-dropped child elements that lack a drop listener.
   * Dispatching events directly on the target container guarantees the page's
   * dropIt() handler fires reliably.
   */
  private async dispatchDrag(sourceLocator: Locator, targetLocator: Locator) {
    const srcHandle = await sourceLocator.elementHandle();
    const tgtHandle = await targetLocator.elementHandle();
    await this.page.evaluate(([src, tgt]) => {
      const dt = new DataTransfer();
      dt.setData('text', src!.className);

      src!.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
      tgt!.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true }));
      tgt!.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
      src!.dispatchEvent(new DragEvent('dragend', { dataTransfer: dt, bubbles: true }));
    }, [srcHandle, tgtHandle]);
  }

  async dragCircleToTarget(color: CircleColor) {
    await this.dispatchDrag(this.source.locator(`.${color}`), this.target);
  }

  async dragTargetItemToSource(color: CircleColor) {
    await this.dispatchDrag(this.target.locator(`.${color}`), this.source);
  }

  async dragTargetItemWithinTarget(color: CircleColor) {
    await this.dispatchDrag(this.target.locator(`.${color}`), this.target);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Returns the ordered list of color class names of circles inside the target. */
  async getTargetItemColors(): Promise<string[]> {
    const circles = await this.target.locator('div').all();
    const colors: string[] = [];
    for (const circle of circles) {
      const className = await circle.getAttribute('class');
      colors.push(className!.trim());
    }
    return colors;
  }

  /** Returns the ordered list of color class names of circles remaining in the source. */
  async getSourceCircleColors(): Promise<string[]> {
    const circles = await this.source.locator('div').all();
    const colors: string[] = [];
    for (const circle of circles) {
      const className = await circle.getAttribute('class');
      colors.push(className!.trim());
    }
    return colors;
  }
}
