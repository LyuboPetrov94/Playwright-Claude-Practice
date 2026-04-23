import { EventEmitter } from 'events';
import { test, expect } from '../../../fixtures';
import { JsDialogsPage } from '../../../pages/JsDialogsPage';

/**
 * JavaScript Dialogs tests for https://practice.expandtesting.com/js-dialogs
 *
 * Page behaviour (from source inspection):
 *   - #js-alert   → alert("I am a Js Alert");     log("OK")    // always "OK"
 *   - #js-confirm → confirm("I am a Js Confirm"); log("Ok" | "Cancel")
 *   - #js-prompt  → prompt("I am a Js prompt");   log(value | "" | "null")
 *   - log(msg) writes to #dialog-response via `innerHTML = msg` — NOT textContent.
 *     This makes the response field HTML-rendering (XSS-susceptible); TC08/TC09 pin it.
 *
 * Quirks pinned by these tests:
 *   - Alert logs "OK" even when dismissed (return value ignored by jsAlert)
 *   - Confirm logs "Ok" (not "OK" — casing differs from Alert)
 *   - Dismissed prompt is indistinguishable in the DOM from an empty-accept:
 *     log(null) does result.innerHTML = null, and innerHTML's WebIDL attribute
 *     [LegacyNullToEmptyString] converts null to "" (not to the string "null")
 *
 * Test design techniques applied (ISTQB):
 *   - Equivalence partitioning: dialog type × accept/dismiss, prompt input classes
 *   - Boundary value analysis (3-point): prompt input length 999 / 1000 / 1001
 *   - State transition: response field value across sequential dialog triggers
 */

test.describe('JavaScript Dialogs', () => {
  let jsDialogsPage: JsDialogsPage;

  test.beforeEach(async ({ page }) => {
    jsDialogsPage = new JsDialogsPage(page);
    await jsDialogsPage.goto();
  });

  // ── Alert ─────────────────────────────────────────────────────────────────

  test('TC01 - Alert accept shows message and logs "OK"', async () => {
    const dialog = await jsDialogsPage.triggerAlert({ accept: true });

    expect(dialog.type()).toBe('alert');
    expect(dialog.message()).toBe('I am a Js Alert');
    await expect(jsDialogsPage.getDialogResponse()).toHaveText('OK');
  });

  test('TC02 - Alert dismiss still logs "OK" (return value ignored)', async () => {
    await jsDialogsPage.triggerAlert({ accept: false });

    await expect(jsDialogsPage.getDialogResponse()).toHaveText('OK');
  });

  // ── Confirm ───────────────────────────────────────────────────────────────

  test('TC03 - Confirm accept shows message and logs "Ok"', async () => {
    const dialog = await jsDialogsPage.triggerConfirm({ accept: true });

    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toBe('I am a Js Confirm');
    await expect(jsDialogsPage.getDialogResponse()).toHaveText('Ok');
  });

  test('TC04 - Confirm dismiss logs "Cancel"', async () => {
    await jsDialogsPage.triggerConfirm({ accept: false });

    await expect(jsDialogsPage.getDialogResponse()).toHaveText('Cancel');
  });

  // ── Prompt: basic accept/dismiss ──────────────────────────────────────────

  test('TC05 - Prompt accept with text logs the entered value', async () => {
    const dialog = await jsDialogsPage.triggerPrompt({ accept: true, text: 'Hello Playwright' });

    expect(dialog.type()).toBe('prompt');
    expect(dialog.message()).toBe('I am a Js prompt');
    expect(dialog.defaultValue()).toBe('');
    await expect(jsDialogsPage.getDialogResponse()).toHaveText('Hello Playwright');
  });

  test('TC06 - Prompt accept with empty string clears the response to empty', async () => {
    await jsDialogsPage.triggerPrompt({ accept: true, text: '' });

    await expect(jsDialogsPage.getDialogResponse()).toBeEmpty();
  });

  test('TC07 - Prompt dismiss clears the response to empty (indistinguishable from empty-accept)', async () => {
    // prompt() returns null on dismiss. The site does `result.innerHTML = null`.
    // Per HTML spec, innerHTML is `[LegacyNullToEmptyString] DOMString`, so null
    // becomes "" at the IDL layer — NOT the string "null" that String(null) gives.
    // Observable DOM state here matches TC06 exactly; only the captured Dialog
    // (asserted below) distinguishes dismiss from accept("").
    const dialog = await jsDialogsPage.triggerPrompt({ accept: false });

    expect(dialog.type()).toBe('prompt');
    await expect(jsDialogsPage.getDialogResponse()).toBeEmpty();
  });

  // ── Prompt: input robustness ──────────────────────────────────────────────

  test('TC08 - HTML tags in prompt input are rendered as HTML, not escaped (vulnerability pin)', async ({ page }) => {
    // log() uses innerHTML = msg, so <b>bold text</b> becomes a real <b> child.
    // If someone later switches to textContent this test will flag the change.
    await jsDialogsPage.triggerPrompt({ accept: true, text: '<b>bold text</b>' });

    const boldChild = page.locator('#dialog-response b');
    await expect(boldChild).toHaveCount(1);
    await expect(boldChild).toHaveText('bold text');
    await expect(jsDialogsPage.getDialogResponse()).toHaveText('bold text');
  });

  test('TC09 - <script> injected via innerHTML is parsed into the DOM but does not execute', async ({ page }) => {
    // HTML5 spec: <script> elements created via innerHTML do not run.
    // Pins the exact XSS-vector space for this page.
    await jsDialogsPage.triggerPrompt({
      accept: true,
      text: "<script>window.__xssFired = true</script>",
    });

    const scriptChild = page.locator('#dialog-response script');
    await expect(scriptChild).toHaveCount(1);

    const flag = await page.evaluate(() => (window as unknown as { __xssFired?: boolean }).__xssFired);
    expect(flag).toBeUndefined();
  });

  test('TC10 - Prompt preserves quote and SQL-ish characters verbatim', async () => {
    const input = `'; DROP TABLE users; --`;
    await jsDialogsPage.triggerPrompt({ accept: true, text: input });

    await expect(jsDialogsPage.getDialogResponse()).toHaveText(input);
  });

  test('TC11 - Prompt preserves multi-byte unicode (Japanese + emoji)', async () => {
    const input = '日本語 🎉';
    await jsDialogsPage.triggerPrompt({ accept: true, text: input });

    await expect(jsDialogsPage.getDialogResponse()).toHaveText(input);
  });

  test('TC12 - Prompt preserves right-to-left (Arabic) text', async () => {
    const input = 'مرحبا بالعالم';
    await jsDialogsPage.triggerPrompt({ accept: true, text: input });

    await expect(jsDialogsPage.getDialogResponse()).toHaveText(input);
  });

  test('TC13 - Prompt preserves whitespace-only input', async ({ page }) => {
    // toHaveText normalises whitespace, so it cannot distinguish '   ' from ''.
    // Poll raw textContent to assert the exact three-space string.
    await jsDialogsPage.triggerPrompt({ accept: true, text: '   ' });

    await expect
      .poll(async () => await page.locator('#dialog-response').textContent())
      .toBe('   ');
  });

  // ── Prompt length: 3-point BVA around 1000 chars ──────────────────────────

  test('TC14 - Prompt with 999 chars (below boundary) is rendered in full', async ({ page }) => {
    const input = 'a'.repeat(999);
    await jsDialogsPage.triggerPrompt({ accept: true, text: input });

    await expect
      .poll(async () => (await page.locator('#dialog-response').textContent())?.length)
      .toBe(999);
  });

  test('TC15 - Prompt with 1000 chars (at boundary) is rendered in full', async ({ page }) => {
    const input = 'a'.repeat(1000);
    await jsDialogsPage.triggerPrompt({ accept: true, text: input });

    await expect
      .poll(async () => (await page.locator('#dialog-response').textContent())?.length)
      .toBe(1000);
  });

  test('TC16 - Prompt with 1001 chars (above boundary) is rendered without truncation', async ({ page }) => {
    const input = 'a'.repeat(1001);
    await jsDialogsPage.triggerPrompt({ accept: true, text: input });

    await expect
      .poll(async () => (await page.locator('#dialog-response').textContent())?.length)
      .toBe(1001);
  });

  // ── Cross-dialog behaviour ────────────────────────────────────────────────

  test('TC17 - Response field overwrites between sequential dialog triggers', async () => {
    await jsDialogsPage.triggerAlert({ accept: true });
    await expect(jsDialogsPage.getDialogResponse()).toHaveText('OK');

    await jsDialogsPage.triggerConfirm({ accept: false });
    await expect(jsDialogsPage.getDialogResponse()).toHaveText('Cancel');

    await jsDialogsPage.triggerPrompt({ accept: true, text: 'abc' });
    await expect(jsDialogsPage.getDialogResponse()).toHaveText('abc');
  });

  test('TC18 - Initial response is "Waiting" with green styling', async () => {
    const response = jsDialogsPage.getDialogResponse();

    await expect(response).toHaveText('Waiting');
    await expect(response).toHaveAttribute('style', /color:\s*green/);
  });

  test('TC19 - Each trigger uses a one-shot listener (no leaked dialog handlers)', async ({ page }) => {
    // Two consecutive prompt triggers must not accumulate listeners on the `dialog` event.
    await jsDialogsPage.triggerPrompt({ accept: true, text: 'first' });
    await expect(jsDialogsPage.getDialogResponse()).toHaveText('first');
    expect((page as unknown as EventEmitter).listenerCount('dialog')).toBe(0);

    await jsDialogsPage.triggerPrompt({ accept: true, text: 'second' });
    await expect(jsDialogsPage.getDialogResponse()).toHaveText('second');
    expect((page as unknown as EventEmitter).listenerCount('dialog')).toBe(0);
  });
});
