import { Page, Locator } from '@playwright/test';

// Surfaced as exports so the spec can assert against expected strings
// without re-declaring them.
export const OPENER_HEADING = 'Opening a new window page for Automation Testing Practice';
export const NEW_WINDOW_HEADING = 'Example of a new window page for Automation Testing Practice';
export const NEW_WINDOW_TITLE = 'Example of a new window';
export const NEW_WINDOW_PATH = '/windows/new';

export class MultipleWindowsPage {
  private readonly openLink: Locator;

  constructor(private page: Page) {
    // The anchor has no id or class on the practice site; getByRole keeps
    // the selector semantic and stable against unrelated DOM tweaks.
    this.openLink = page.getByRole('link', { name: 'Click Here', exact: true });
  }

  async goto() {
    await this.page.goto('/windows', { waitUntil: 'domcontentloaded' });
  }

  getOpenerHeading(): Locator {
    return this.page.locator('h1');
  }

  getOpenLink(): Locator {
    return this.openLink;
  }

  // Each /windows/new page exposes a single H1 — owned here so the spec
  // doesn't poke at popup internals directly.
  getPopupHeading(popup: Page): Locator {
    return popup.locator('h1');
  }

  /**
   * Click "Click Here" and wait for the popup `page` event via the
   * canonical Promise.all pattern. Without Promise.all, the click could
   * complete and the page event fire before the listener attaches.
   */
  async openNewWindow(): Promise<Page> {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.openLink.click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    return newPage;
  }

  // Sequential opens — three parallel clicks could race the page-event
  // listener and miss a popup.
  async openMultipleWindows(count: number): Promise<Page[]> {
    const pages: Page[] = [];
    for (let i = 0; i < count; i++) {
      pages.push(await this.openNewWindow());
    }
    return pages;
  }
}
