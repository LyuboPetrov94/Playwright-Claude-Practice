import { Page, Locator } from '@playwright/test';

export class FileUploadPage {
  // Upload form
  private readonly fileInput: Locator;
  private readonly uploadButton: Locator;

  // Error state (client-side rejection via fileValidation())
  private readonly errorFlash: Locator;

  // Page heading — text differs between the upload form
  // ("File Uploader page…") and the success page ("File Uploaded!")
  private readonly pageHeading: Locator;

  // Success page — shows the server-timestamped filename inside #uploaded-files
  private readonly uploadedFileName: Locator;

  constructor(private page: Page) {
    this.fileInput = page.locator('#fileInput');
    this.uploadButton = page.locator('#fileSubmit');
    this.errorFlash = page.locator('#flash');
    this.pageHeading = page.locator('h1');
    this.uploadedFileName = page.locator('#uploaded-files p');
  }

  async goto() {
    await this.page.goto('/upload', { waitUntil: 'domcontentloaded' });
  }

  async uploadFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
    await this.uploadButton.click();
  }

  async selectFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  async submitEmpty() {
    await this.uploadButton.click();
  }

  getFileInput(): Locator {
    return this.fileInput;
  }

  getUploadButton(): Locator {
    return this.uploadButton;
  }

  getPageHeading(): Locator {
    return this.pageHeading;
  }

  getErrorFlash(): Locator {
    return this.errorFlash;
  }

  getUploadedFileName(): Locator {
    return this.uploadedFileName;
  }

  // Native HTML5 `required` validation: no DOM tooltip to query, so we read
  // the ValidityState directly to prove the browser blocked submission.
  async isValueMissing(): Promise<boolean> {
    return this.fileInput.evaluate(
      (el) => (el as HTMLInputElement).validity.valueMissing
    );
  }
}
