import { Page, Locator } from '@playwright/test';

// All three users render the same DOM shape — exported as a tuple so the
// spec can loop over them without re-declaring the range.
export const USER_IDS = [1, 2, 3] as const;
export type UserId = typeof USER_IDS[number];

export class HoversPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/hovers', { waitUntil: 'domcontentloaded' });
  }

  // All figures at once — used for the smoke-test count assertion. Prefix
  // matches `user-1|2|3` set by the practice site as data-testid.
  getFigures(): Locator {
    return this.page.locator('[data-testid^="user-"]');
  }

  // Scoped to the figure to keep the caption locator stable across re-renders.
  getFigure(id: UserId): Locator {
    return this.page.locator(`[data-testid="user-${id}"]`);
  }

  // .figcaption is `display:none` by default and `display:block` only while
  // the parent .figure is hovered — toBeVisible / toBeHidden handle the
  // computed-style assertion without manual probing.
  getFigcaption(id: UserId): Locator {
    return this.getFigure(id).locator('.figcaption');
  }

  // "View profile" anchor inside the (revealed) caption. Hidden parents
  // disable Playwright's auto-actionability waits, so callers must hover
  // the figure before calling click(); a `force: true` workaround would
  // mask the very behaviour under test.
  getViewProfileLink(id: UserId): Locator {
    return this.getFigcaption(id).getByRole('link', { name: 'View profile' });
  }

  async hoverUser(id: UserId) {
    await this.getFigure(id).hover();
  }
}
