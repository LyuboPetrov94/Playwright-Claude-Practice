import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '../../../fixtures';
import { FileDownloadPage, STABLE_DOWNLOADS } from '../../../pages/FileDownloadPage';
import type { Download } from '@playwright/test';

/**
 * File Download tests for https://practice.expandtesting.com/download
 *
 * The page is a flat list of <a href="download/<filename>"> links served
 * from the same origin. Each click triggers a browser download (the server
 * responds with Content-Disposition: attachment), which Playwright surfaces
 * as a `download` event.
 *
 * Saved files land under `testInfo.outputDir` — a per-(spec, test, project)
 * directory that Playwright auto-isolates and cleans between runs (kept on
 * failure for debugging). Using it instead of a shared `test-artifacts/`
 * subfolder avoids parallel-write collisions across the four browser
 * projects and removes the need for any explicit per-test cleanup.
 *
 * Test cases:
 *   - File-content verification per type    (TC01–TC04)
 *   - Page-level invariants (url + failure) (TC05)
 *   - Multiple downloads in one test        (TC06)
 *   - page.on('download') listener API      (TC07)
 */

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const EXPECTED_MESSAGE = 'Welcome to the Practice Web App';

test.describe('File Download', () => {
  let downloadPage: FileDownloadPage;

  test.beforeEach(async ({ page }) => {
    downloadPage = new FileDownloadPage(page);
    await downloadPage.goto();
  });

  // ─── File-content verification per type ───────────────────────────────────

  test('TC01 - Download text file and verify content', async ({}, testInfo) => {
    // EP: text class — string-compare the saved bytes
    const filename = 'some-file.txt';
    const download = await downloadPage.downloadFile(filename);

    expect(download.suggestedFilename()).toBe(filename);

    const savePath = path.join(testInfo.outputDir, filename);
    await download.saveAs(savePath);

    const content = fs.readFileSync(savePath, 'utf8');
    expect(content).toContain(EXPECTED_MESSAGE);
  });

  test('TC02 - Download JSON file and verify parsed structure', async ({}, testInfo) => {
    // EP: structured-text class — parse and assert keys/values
    const filename = 'some-file.json';
    const download = await downloadPage.downloadFile(filename);

    expect(download.suggestedFilename()).toBe(filename);

    const savePath = path.join(testInfo.outputDir, filename);
    await download.saveAs(savePath);

    const parsed = JSON.parse(fs.readFileSync(savePath, 'utf8'));
    expect(parsed).toEqual({ Message: EXPECTED_MESSAGE });
  });

  test('TC03 - Download PNG file and verify magic bytes', async ({}, testInfo) => {
    // EP: binary-image class — PNG identified by an 8-byte signature
    const filename = 'wdio.png';
    const download = await downloadPage.downloadFile(filename);

    expect(download.suggestedFilename()).toBe(filename);

    const savePath = path.join(testInfo.outputDir, filename);
    await download.saveAs(savePath);

    const buf = fs.readFileSync(savePath);
    expect(buf.length).toBeGreaterThan(PNG_MAGIC.length);
    expect([...buf.subarray(0, PNG_MAGIC.length)]).toEqual(PNG_MAGIC);
  });

  test('TC04 - Download JPEG file and verify magic bytes', async ({}, testInfo) => {
    // EP: binary-image class — JPEG identified by a 3-byte signature.
    // Distinct EP from PNG: different signature, different decoder family.
    const filename = 'cdct.jpg';
    const download = await downloadPage.downloadFile(filename);

    expect(download.suggestedFilename()).toBe(filename);

    const savePath = path.join(testInfo.outputDir, filename);
    await download.saveAs(savePath);

    const buf = fs.readFileSync(savePath);
    expect(buf.length).toBeGreaterThan(JPEG_MAGIC.length);
    expect([...buf.subarray(0, JPEG_MAGIC.length)]).toEqual(JPEG_MAGIC);
  });

  // ─── Page-level invariants ────────────────────────────────────────────────

  test('TC05 - download.url() matches anchor href and download.failure() is null for every stable file', async ({ page }, testInfo) => {
    // url() and failure() are page-level invariants — they don't behave
    // differently per file. Looping over all 5 stable files documents the
    // invariant for the whole page rather than for a single representative.
    for (const filename of STABLE_DOWNLOADS) {
      const relativeHref = await downloadPage.getHref(filename);
      const expectedAbsoluteUrl = new URL(relativeHref, page.url()).toString();

      const download = await downloadPage.downloadFile(filename);

      expect(download.url()).toBe(expectedAbsoluteUrl);
      expect(await download.failure()).toBeNull();
      expect(download.suggestedFilename()).toBe(filename);

      // saveAs() also forces the download stream to drain — without it,
      // Playwright auto-deletes the temp file at context close and may warn.
      await download.saveAs(path.join(testInfo.outputDir, filename));
    }
  });

  // ─── State transition: multiple downloads in one test ─────────────────────

  test('TC06 - Two downloads in sequence both succeed', async ({}, testInfo) => {
    // State Transition: click → download A → click → download B.
    // Proves the download API holds no state between events and that the
    // page stays on /download after each download (downloads do not navigate).
    const txt = await downloadPage.downloadFile('some-file.txt');
    const txtPath = path.join(testInfo.outputDir, txt.suggestedFilename());
    await txt.saveAs(txtPath);

    const json = await downloadPage.downloadFile('some-file.json');
    const jsonPath = path.join(testInfo.outputDir, json.suggestedFilename());
    await json.saveAs(jsonPath);

    expect(fs.readFileSync(txtPath, 'utf8')).toContain(EXPECTED_MESSAGE);
    expect(JSON.parse(fs.readFileSync(jsonPath, 'utf8'))).toEqual({
      Message: EXPECTED_MESSAGE,
    });
  });

  // ─── Alternative API: page.on('download') listener ────────────────────────

  test("TC07 - page.on('download') listener captures the download", async ({ page }, testInfo) => {
    // Alternative to the canonical Promise.all + waitForEvent pattern.
    // Useful when the click that triggers the download is buried in a
    // helper or non-trivial flow where wrapping the trigger in Promise.all
    // would be awkward. `once` so we only capture this single download.
    const filename = 'xpath-css.png';

    const downloadPromise = new Promise<Download>((resolve) => {
      page.once('download', resolve);
    });

    await downloadPage.fileLink(filename).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(filename);

    const savePath = path.join(testInfo.outputDir, filename);
    await download.saveAs(savePath);

    const buf = fs.readFileSync(savePath);
    expect(buf.length).toBeGreaterThan(PNG_MAGIC.length);
    expect([...buf.subarray(0, PNG_MAGIC.length)]).toEqual(PNG_MAGIC);
  });
});
