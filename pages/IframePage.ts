import { Page, Locator, FrameLocator } from '@playwright/test';

// Expected texts surfaced as exports so the spec can assert against them
// without re-declaring strings.
export const FRAME_HEADING = 'Send updates to my inbox ...';
export const VALIDATION_ERROR = 'Please enter a valid email address.';
export const SUCCESS_MESSAGE = 'You are now subscribed!';

export class IframePage {
  private readonly emailFrame: FrameLocator;
  private readonly emailInput: Locator;
  private readonly subscribeButton: Locator;

  constructor(private page: Page) {
    this.emailFrame = page.frameLocator('#email-subscribe');
    this.emailInput = this.emailFrame.locator('#email');
    this.subscribeButton = this.emailFrame.locator('#btn-subscribe');
  }

  async goto() {
    await this.page.goto('/iframe', { waitUntil: 'domcontentloaded' });
  }

  getHeading(): Locator {
    return this.emailFrame.locator('#prompt-message');
  }

  // .invalid-feedback is in the DOM from page load but hidden via CSS until
  // Bootstrap's `was-validated` class is added to the form on a failed submit.
  // Tests must assert toBeVisible() to verify the user-facing state change —
  // toHaveText() alone passes from the start and proves nothing.
  getValidationError(): Locator {
    return this.emailFrame.locator('.invalid-feedback');
  }

  // The success message replaces the form's parent #subscribe div on submit
  // success — see the iframe's inline script. After success, the input and
  // button are no longer in the DOM; only #success-message remains.
  getSuccessMessage(): Locator {
    return this.emailFrame.locator('#success-message');
  }

  async subscribe(email: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
    await this.subscribeButton.click();
  }

  async submitEmpty() {
    await this.subscribeButton.click();
  }
}
