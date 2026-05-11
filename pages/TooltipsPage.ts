import { Page, Locator } from '@playwright/test';

// Plain-text trigger buttons (#btn1..#btn4). #btn5 has data-bs-html=true
// and is treated as a separate EP class — kept out of this tuple.
export const TEXT_TOOLTIP_BUTTON_IDS = [1, 2, 3, 4] as const;

// Includes #btn5 — used by the mouse-leave state transition test that
// covers every button.
export const ALL_TOOLTIP_BUTTON_IDS = [1, 2, 3, 4, 5] as const;
export type TooltipButtonId = typeof ALL_TOOLTIP_BUTTON_IDS[number];

// Title attribute for #btn5 — the literal HTML markup string that
// data-bs-html=true causes Bootstrap to render as DOM rather than text.
export const HTML_TOOLTIP_TITLE = '<em>Tooltip</em> <u>with</u> <b>HTML</b>';

export class TooltipsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/tooltips', { waitUntil: 'domcontentloaded' });
  }

  // All five tooltip-trigger buttons at once — for the smoke count check.
  getButtons(): Locator {
    return this.page.locator('button[data-bs-toggle="tooltip"]');
  }

  getButton(id: TooltipButtonId): Locator {
    return this.page.locator(`#btn${id}`);
  }

  // Bootstrap inserts <div class="tooltip" role="tooltip"> on the body when
  // a tooltip is shown and removes it after the fade-out finishes. The
  // selector combines tag + class + role to exclude unrelated `role="tooltip"`
  // nodes that third-party widgets on the practice site add to the DOM
  // (a consent-management UI uses <button role="tooltip" class="fc-help-tip">,
  // and a broad `[role="tooltip"]` query trips Playwright's strict mode).
  getTooltip(): Locator {
    return this.page.locator('div.tooltip[role="tooltip"]');
  }

  // `.tooltip-inner` carries the rendered title content (text or HTML).
  getTooltipInner(): Locator {
    return this.getTooltip().locator('.tooltip-inner');
  }

  // Hover only — no eager attach assertion. Callers' own auto-retrying
  // assertions (toHaveText, toHaveCount, toBeAttached) drive the wait;
  // an internal assertion would trip strict mode while the previously
  // focused button's tooltip is still fading.
  async hoverButton(id: TooltipButtonId) {
    await this.getButton(id).hover();
  }

  /**
   * Move the pointer to viewport origin (0, 0) — a safe location outside
   * every trigger button. `page.mouse.move` is the standard way to fire
   * mouseleave on the previously hovered element.
   */
  async leaveButtons() {
    await this.page.mouse.move(0, 0);
  }
}
