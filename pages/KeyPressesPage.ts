import { Page, Locator } from '@playwright/test';

// The handler prepends this fixed string to the resolved key name.
// Kept private to the POM — the spec composes expected values via the
// `expectedResult(name)` helper rather than referencing the prefix
// directly.
const RESULT_PREFIX = 'You entered: ';

export class KeyPressesPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/key-presses', { waitUntil: 'domcontentloaded' });
  }

  // Focused input is convenient for tests that also want to verify text
  // entry into `#target` (e.g. state-transition `a`+`b` → "ab"). The page
  // handler itself is bound to `document.keydown`, so it fires regardless
  // of focus — but consistently focusing the input keeps tests aligned.
  async focusInput() {
    await this.getInput().focus();
  }

  getInput(): Locator {
    return this.page.locator('#target');
  }

  // The handler writes via `result.innerHTML = ...`, so toHaveText reads
  // the plain string content cleanly.
  getResult(): Locator {
    return this.page.locator('#result');
  }

  // Helper that mirrors the handler's output format: "You entered: <name>".
  expectedResult(name: string): string {
    return `${RESULT_PREFIX}${name}`;
  }
}
