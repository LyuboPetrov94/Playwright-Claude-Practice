import { Page, Locator, type Download } from '@playwright/test';
import { triggerDownload } from '../helpers/downloads';

// The /download page lists 13 files, but 8 are timestamped uploads that
// rotate as users add more via /upload. Only these 5 are stable enough to
// drive deterministic assertions across runs.
export const STABLE_DOWNLOADS = [
  'some-file.txt',
  'some-file.json',
  'wdio.png',
  'cdct.jpg',
  'xpath-css.png',
] as const;

export class FileDownloadPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/download', { waitUntil: 'domcontentloaded' });
  }

  // The download links have no stable id or class — getByRole keeps the
  // selector semantic and survives unrelated DOM tweaks better than an
  // attribute selector.
  fileLink(filename: string): Locator {
    return this.page.getByRole('link', { name: filename, exact: true });
  }

  async downloadFile(filename: string): Promise<Download> {
    return triggerDownload(this.page, this.fileLink(filename));
  }

  // Used when a test needs to compare the anchor's href with download.url().
  // Throws on missing href so the test fails loudly rather than asserting
  // against `null`.
  async getHref(filename: string): Promise<string> {
    const href = await this.fileLink(filename).getAttribute('href');
    if (href === null) {
      throw new Error(`Anchor for ${filename} has no href attribute`);
    }
    return href;
  }
}
