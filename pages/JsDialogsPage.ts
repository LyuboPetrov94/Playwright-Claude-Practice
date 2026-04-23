import { Page, Locator, Dialog } from '@playwright/test';

export type DialogAction = { accept: true } | { accept: false };

export type PromptAction =
  | { accept: true; text: string }
  | { accept: false };

export class JsDialogsPage {
  private readonly alertButton: Locator;
  private readonly confirmButton: Locator;
  private readonly promptButton: Locator;
  private readonly dialogResponse: Locator;

  constructor(private page: Page) {
    this.alertButton = page.locator('#js-alert');
    this.confirmButton = page.locator('#js-confirm');
    this.promptButton = page.locator('#js-prompt');
    this.dialogResponse = page.locator('#dialog-response');
  }

  async goto() {
    await this.page.goto('/js-dialogs', { waitUntil: 'domcontentloaded' });
  }

  async reload() {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  getAlertButton(): Locator {
    return this.alertButton;
  }

  getConfirmButton(): Locator {
    return this.confirmButton;
  }

  getPromptButton(): Locator {
    return this.promptButton;
  }

  getDialogResponse(): Locator {
    return this.dialogResponse;
  }

  async triggerAlert(opts: DialogAction = { accept: true }): Promise<Dialog> {
    return this.triggerDialog(this.alertButton, opts);
  }

  async triggerConfirm(opts: DialogAction): Promise<Dialog> {
    return this.triggerDialog(this.confirmButton, opts);
  }

  async triggerPrompt(opts: PromptAction): Promise<Dialog> {
    return this.triggerDialog(this.promptButton, opts);
  }

  /**
   * Attaches a one-shot dialog handler via waitForEvent BEFORE the click fires,
   * so the dialog is never auto-dismissed by Playwright's default behaviour.
   * Returns the captured Dialog so the test can assert type/message/defaultValue.
   */
  private async triggerDialog(
    button: Locator,
    opts: { accept: true; text?: string } | { accept: false },
  ): Promise<Dialog> {
    const [dialog] = await Promise.all([
      this.page.waitForEvent('dialog').then(async (dlg) => {
        if (opts.accept) {
          if ('text' in opts && opts.text !== undefined) {
            await dlg.accept(opts.text);
          } else {
            await dlg.accept();
          }
        } else {
          await dlg.dismiss();
        }
        return dlg;
      }),
      button.click(),
    ]);
    return dialog;
  }
}
