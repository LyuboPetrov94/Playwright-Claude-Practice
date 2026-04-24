import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '../../../fixtures';
import { FileUploadPage } from '../../../pages/FileUploadPage';

/**
 * File Upload tests for https://practice.expandtesting.com/upload
 *
 * Form: single-file input (#fileInput, name="file"), Upload submit (#fileSubmit).
 * No `accept` attribute, so any file type is allowed client-side.
 *
 * Client-side validator fileValidation() runs on the input's change event and
 * rejects files where Math.round(sizeBytes / 1024) >= 500. On rejection, a
 * flash error appears in #flash and the input is cleared (fi.value = '').
 *
 * On success, the server responds with a page whose H1 is "File Uploaded!"
 * and a #uploaded-files container holding a <p> with the uploaded filename
 * prepended by a server-side timestamp (e.g. "1777030572689_small.txt").
 *
 * Test cases:
 *   - Valid uploads           (TC01–TC02)
 *   - Size boundary BVA       (TC03–TC05)
 *   - Empty submission        (TC06)
 *   - Recovery after error    (TC07–TC08)
 */

const ARTIFACTS_DIR = path.join(process.cwd(), 'test-artifacts', 'upload');
const SMALL_TXT = path.join(ARTIFACTS_DIR, 'small.txt');
const SMALL_PNG = path.join(ARTIFACTS_DIR, 'small.png');
const KB_499 = path.join(ARTIFACTS_DIR, '499kb.txt');
const KB_500 = path.join(ARTIFACTS_DIR, '500kb.txt');
const KB_501 = path.join(ARTIFACTS_DIR, '501kb.txt');

const SIZE_ERROR = 'File too large, please select a file less than 500KB';

test.describe('File Upload', () => {
  let fileUploadPage: FileUploadPage;

  test.beforeAll(() => {
    // Buffer.alloc(n) produces a file of exactly n bytes. The upload form
    // rounds sizeBytes / 1024 via Math.round, so N * 1024 lands on rounded KB = N.
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    fs.writeFileSync(SMALL_TXT, Buffer.alloc(16));
    fs.writeFileSync(SMALL_PNG, Buffer.alloc(16));
    fs.writeFileSync(KB_499, Buffer.alloc(499 * 1024));
    fs.writeFileSync(KB_500, Buffer.alloc(500 * 1024));
    fs.writeFileSync(KB_501, Buffer.alloc(501 * 1024));
  });

  test.afterAll(() => {
    fs.rmSync(ARTIFACTS_DIR, { recursive: true, force: true });
  });

  test.beforeEach(async ({ page }) => {
    fileUploadPage = new FileUploadPage(page);
    await fileUploadPage.goto();
  });

  // ─── Valid uploads ────────────────────────────────────────────────────────

  test('TC01 - Upload valid small text file succeeds', async () => {
    // EP: valid class — small file, common extension
    await fileUploadPage.uploadFile(SMALL_TXT);

    await expect(fileUploadPage.getPageHeading()).toHaveText('File Uploaded!');
    await expect(fileUploadPage.getUploadedFileName()).toContainText('small.txt');
  });

  test('TC02 - Upload valid PNG file succeeds (no type filter)', async () => {
    // EP: valid class — different extension; form has no `accept` filter
    await fileUploadPage.uploadFile(SMALL_PNG);

    await expect(fileUploadPage.getPageHeading()).toHaveText('File Uploaded!');
    await expect(fileUploadPage.getUploadedFileName()).toContainText('small.png');
  });

  // ─── Size boundary (3-point BVA at 500KB) ─────────────────────────────────

  test('TC03 - Upload 499KB file succeeds (below boundary)', async () => {
    // BVA: just below — rounded KB = 499, accepted by fileValidation()
    await fileUploadPage.uploadFile(KB_499);

    await expect(fileUploadPage.getPageHeading()).toHaveText('File Uploaded!');
    await expect(fileUploadPage.getUploadedFileName()).toContainText('499kb.txt');
  });

  test('TC04 - Upload 500KB file is rejected client-side (at boundary)', async () => {
    // BVA: at boundary — rounded KB = 500, first rejected size
    await fileUploadPage.selectFile(KB_500);

    await expect(fileUploadPage.getErrorFlash()).toContainText(SIZE_ERROR);
    await expect(fileUploadPage.getFileInput()).toHaveValue('');
  });

  test('TC05 - Upload 501KB file is rejected client-side (above boundary)', async () => {
    // BVA: just above — rounded KB = 501, rejected
    await fileUploadPage.selectFile(KB_501);

    await expect(fileUploadPage.getErrorFlash()).toContainText(SIZE_ERROR);
    await expect(fileUploadPage.getFileInput()).toHaveValue('');
  });

  // ─── Empty submission ─────────────────────────────────────────────────────

  test('TC06 - Submit without a file is blocked by HTML5 required validation', async () => {
    // EP: invalid class — empty required field. The browser shows a native
    // tooltip that is not queryable from the DOM, so we assert the underlying
    // ValidityState and that we remain on the upload form.
    await fileUploadPage.submitEmpty();

    await expect(fileUploadPage.getUploadButton()).toBeVisible();
    await expect(fileUploadPage.getPageHeading()).not.toHaveText('File Uploaded!');
    expect(await fileUploadPage.isValueMissing()).toBe(true);
  });

  // ─── Recovery after error ─────────────────────────────────────────────────

  test('TC07 - After rejection, selecting a valid file recovers and uploads', async () => {
    // State Transition: error → recovery → success.
    // Selecting any file triggers fileValidation(), which clears the error
    // when the new file is under the size limit.
    await fileUploadPage.selectFile(KB_500);
    await expect(fileUploadPage.getErrorFlash()).toContainText(SIZE_ERROR);

    await fileUploadPage.uploadFile(SMALL_TXT);

    await expect(fileUploadPage.getErrorFlash()).toBeHidden();
    await expect(fileUploadPage.getPageHeading()).toHaveText('File Uploaded!');
    await expect(fileUploadPage.getUploadedFileName()).toContainText('small.txt');
  });

  test('TC08 - After empty submit is blocked, selecting a valid file recovers and uploads', async ({ page }) => {
    // State Transition: empty → required-blocked → valid → success.
    // Complements TC07 by exercising recovery from native HTML5 `required`
    // validation (different mechanism than the #flash-based size error).
    await fileUploadPage.submitEmpty();
    expect(await fileUploadPage.isValueMissing()).toBe(true);

    // Dismiss the browser's native validation popover before the next click.
    // Chromium keeps it active after a blocked submit, and it can consume the
    // next click on the submit button instead of letting the form submit.
    await page.keyboard.press('Escape');

    await fileUploadPage.uploadFile(SMALL_TXT);

    await expect(fileUploadPage.getPageHeading()).toHaveText('File Uploaded!');
    await expect(fileUploadPage.getUploadedFileName()).toContainText('small.txt');
  });
});
