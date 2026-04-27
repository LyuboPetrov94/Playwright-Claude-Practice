import { Page, Locator, type Download } from '@playwright/test';

// Canonical Promise.all + waitForEvent('download') pattern. Use from any
// POM whose `downloadFile` triggers a browser download by clicking an
// element — the pattern itself is page-agnostic, only the trigger varies.
export async function triggerDownload(page: Page, trigger: Locator): Promise<Download> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    trigger.click(),
  ]);
  return download;
}
