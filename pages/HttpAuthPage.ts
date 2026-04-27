import { Page, Locator, type Download, type Response } from '@playwright/test';
import { triggerDownload } from '../helpers/downloads';

// Expected texts surfaced as exports so the spec can assert against them
// without re-declaring strings.
export const BASIC_AUTH_HEADING = 'Basic Auth page for Automation Testing Practice';
export const DIGEST_AUTH_HEADING = 'Digest Auth page for Automation Testing Practice';
export const SUCCESS_ALERT_TEXT = 'Congratulations! You must have the proper credentials.';
export const UNAUTHORIZED_BODY = 'Not authorized';

export class HttpAuthPage {
  private readonly heading: Locator;
  private readonly successAlert: Locator;

  constructor(private page: Page) {
    this.heading = page.locator('h1');
    this.successAlert = page.locator('.alert-success');
  }

  // goto methods return the navigation Response so negative-path tests can
  // assert on the status code (e.g. 401 for unauthorized requests).
  async gotoBasicAuth(): Promise<Response | null> {
    return this.page.goto('/basic-auth', { waitUntil: 'domcontentloaded' });
  }

  // The /digest-auth page is mislabeled on this practice site — see
  // CLAUDE.md gotcha. The server actually uses Basic auth with the same
  // realm as /basic-auth, so the same httpCredentials context handles both.
  async gotoDigestAuth(): Promise<Response | null> {
    return this.page.goto('/digest-auth', { waitUntil: 'domcontentloaded' });
  }

  async gotoDownloadSecure(): Promise<Response | null> {
    return this.page.goto('/download-secure', { waitUntil: 'domcontentloaded' });
  }

  getHeading(): Locator {
    return this.heading;
  }

  getSuccessAlert(): Locator {
    return this.successAlert;
  }

  // The 401 response from a Basic-auth-protected endpoint is plain text
  // ("Not authorized\n") with no HTML structure — the whole body IS the
  // message. Negative-path tests assert toContainText(UNAUTHORIZED_BODY)
  // against this locator alongside a status-code check.
  getBody(): Locator {
    return this.page.locator('body');
  }

  // /download-secure mirrors the public /download page's anchor structure.
  // Located by accessible name (link text = filename) — matches user
  // behavior and is consistent with FileDownloadPage's locator strategy.
  fileLink(filename: string): Locator {
    return this.page.getByRole('link', { name: filename, exact: true });
  }

  // Authorization header is sent automatically on the file fetch because
  // httpCredentials applies at the context level — that is what TC06 verifies.
  async downloadFile(filename: string): Promise<Download> {
    return triggerDownload(this.page, this.fileLink(filename));
  }
}
