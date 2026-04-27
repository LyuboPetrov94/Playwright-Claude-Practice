import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '../../../fixtures';
import {
  HttpAuthPage,
  BASIC_AUTH_HEADING,
  DIGEST_AUTH_HEADING,
  SUCCESS_ALERT_TEXT,
  UNAUTHORIZED_BODY,
} from '../../../pages/HttpAuthPage';
import { STABLE_DOWNLOADS } from '../../../pages/FileDownloadPage';

/**
 * HTTP Auth tests for https://practice.expandtesting.com
 *
 * Endpoints under test:
 *   - /basic-auth       Basic-auth-protected confirmation page
 *   - /digest-auth      Mislabeled — actually Basic auth (see CLAUDE.md gotcha).
 *                       Same realm and credentials as /basic-auth.
 *   - /download-secure  Basic-auth-protected mirror of /download. Lists the
 *                       same 5 stable files described as "secure and will
 *                       always be available and not deleted".
 *
 * Credentials: admin / admin. Realm: "Restricted Area".
 *
 * Auth is supplied via Playwright's `httpCredentials` context option, scoped
 * per describe block via `test.use()`. This demonstrates context-level
 * credential persistence: a single context's credentials apply automatically
 * to every request the page makes (page navigation, sub-resources, downloads).
 *
 * Negative paths use `page.goto()` and assert on the response status. Saved
 * downloads land in `testInfo.outputDir` — same convention as file-download.
 *
 * Test cases:
 *   - Negative paths (no creds, wrong creds)   (TC01–TC02)
 *   - Valid auth on confirmation pages         (TC03–TC04)
 *   - Protected file listing + download        (TC05–TC06)
 *   - Single-context persistence across URLs   (TC07)
 */

test.describe('HTTP Auth', () => {
  let httpAuthPage: HttpAuthPage;

  // Hoisted to the outer describe so every inner block (no-creds, wrong-creds,
  // valid-creds) shares one POM-construction line. The `page` fixture honors
  // the closest test.use({ httpCredentials }) for each test individually.
  test.beforeEach(async ({ page }) => {
    httpAuthPage = new HttpAuthPage(page);
  });

  // ─── Negative paths ───────────────────────────────────────────────────────

  test.describe('without credentials', () => {
    // No test.use({ httpCredentials }) — context has no credentials at all.
    test('TC01 - /basic-auth without credentials returns 401', async () => {
      // EP: invalid class — no Authorization header sent at all
      const response = await httpAuthPage.gotoBasicAuth();
      expect(response?.status()).toBe(401);
      await expect(httpAuthPage.getBody()).toContainText(UNAUTHORIZED_BODY);
    });
  });

  test.describe('with wrong credentials', () => {
    test.use({ httpCredentials: { username: 'wrong', password: 'wrong' } });

    test('TC02 - /basic-auth with wrong credentials returns 401', async () => {
      // EP: invalid class — Authorization header sent, but credentials rejected.
      // Distinct from TC01 in mechanism (creds attempted vs. omitted) even
      // though the server returns the same 401 for both.
      const response = await httpAuthPage.gotoBasicAuth();
      expect(response?.status()).toBe(401);
      await expect(httpAuthPage.getBody()).toContainText(UNAUTHORIZED_BODY);
    });
  });

  // ─── Valid credentials ────────────────────────────────────────────────────

  test.describe('with valid credentials', () => {
    test.use({ httpCredentials: { username: 'admin', password: 'admin' } });

    test('TC03 - /basic-auth with valid credentials shows confirmation page', async () => {
      // EP: valid class — correct creds for the Basic-auth realm
      await httpAuthPage.gotoBasicAuth();

      await expect(httpAuthPage.getHeading()).toHaveText(BASIC_AUTH_HEADING);
      await expect(httpAuthPage.getSuccessAlert()).toContainText(SUCCESS_ALERT_TEXT);
    });

    test('TC04 - /digest-auth with the same Basic credentials also succeeds', async () => {
      // The /digest-auth endpoint is mislabeled (CLAUDE.md gotcha). It uses
      // the same Basic realm as /basic-auth, so the same httpCredentials
      // context handles it — proving credentials are realm-scoped, not
      // path-scoped.
      await httpAuthPage.gotoDigestAuth();

      await expect(httpAuthPage.getHeading()).toHaveText(DIGEST_AUTH_HEADING);
      await expect(httpAuthPage.getSuccessAlert()).toContainText(SUCCESS_ALERT_TEXT);
    });

    test('TC05 - /download-secure renders the protected file list', async () => {
      // The page lists the same 5 stable files as /download. The site
      // explicitly documents them as "secure and will always be available
      // and not deleted", so the assertion is reliable across runs.
      await httpAuthPage.gotoDownloadSecure();

      for (const filename of STABLE_DOWNLOADS) {
        await expect(httpAuthPage.fileLink(filename)).toBeVisible();
      }
    });

    test('TC06 - Protected download via /download-secure persists credentials on the file fetch', async ({}, testInfo) => {
      // Clicking a link on /download-secure triggers a fetch of
      // /download/<filename>, which is also Basic-auth protected. The
      // download succeeds only if the context's credentials are reused on
      // the sub-resource request. This is the core demonstration of
      // context-level (vs. request-level) auth.
      await httpAuthPage.gotoDownloadSecure();
      const download = await httpAuthPage.downloadFile('some-file.txt');

      expect(download.suggestedFilename()).toBe('some-file.txt');

      const savePath = path.join(testInfo.outputDir, 'some-file.txt');
      await download.saveAs(savePath);

      const content = fs.readFileSync(savePath, 'utf8');
      expect(content).toContain('Welcome to the Practice Web App');
    });

    test('TC07 - Single context credentials persist across all three protected URLs', async () => {
      // State Transition: one context → /basic-auth → /digest-auth →
      // /download-secure, all in a single test. Proves httpCredentials
      // apply per-context (not per-page-load) and survive navigation
      // between distinct protected URLs that share a realm.
      await httpAuthPage.gotoBasicAuth();
      await expect(httpAuthPage.getSuccessAlert()).toContainText(SUCCESS_ALERT_TEXT);

      await httpAuthPage.gotoDigestAuth();
      await expect(httpAuthPage.getSuccessAlert()).toContainText(SUCCESS_ALERT_TEXT);

      await httpAuthPage.gotoDownloadSecure();
      await expect(httpAuthPage.fileLink('some-file.txt')).toBeVisible();
    });
  });
});
