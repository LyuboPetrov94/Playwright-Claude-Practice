import type { ConsoleMessage, Page } from '@playwright/test';
import { test, expect } from '../../../fixtures';
import { ConsoleLogsPage, LogLevel } from '../../../pages/ConsoleLogsPage';

/**
 * Console Logs tests for https://practice.expandtesting.com/console-logs
 *
 * Page behaviour (from source inspection of /assets/js/console-logs.js):
 *   - 6 input/button pairs for console.log/.warn/.error/.info/.debug/.table
 *   - Text methods emit:  `[console.X()] <ISO timestamp> - <input.value>`
 *   - console.table splits the input on `", "` (comma-space) and logs an array
 *     of `{ id, text, date }` objects.
 *   - Every handler is guarded by `if (input.value)` — empty input emits nothing.
 *   - On page load, the script emits: `console.log("The page was successfully loaded")`
 *
 * Playwright console-type mapping verified on the page:
 *   log→'log', warn→'warning', error→'error', info→'info', debug→'debug', table→'table'
 *
 * Test design techniques applied (ISTQB):
 *   - Equivalence partitioning: empty-input class vs non-empty class (per method)
 *   - Routing coverage per method: each click must emit exactly one message of
 *     the correct type (catches cross-wiring regressions).
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

const APP_PREFIX = /^\[console\.(log|warn|error|info|debug)\(\)\] /;

function isAppMessage(msg: ConsoleMessage): boolean {
  if (msg.text() === 'The page was successfully loaded') return false;
  return APP_PREFIX.test(msg.text()) || msg.type() === 'table';
}

/** Attaches a console listener BEFORE the click and returns the array it will populate. */
function captureAppMessages(page: Page): ConsoleMessage[] {
  const captured: ConsoleMessage[] = [];
  page.on('console', (msg) => {
    if (isAppMessage(msg)) captured.push(msg);
  });
  return captured;
}

/**
 * Used only for negative assertions ("no message fired"). The click handler is
 * synchronous — if nothing has fired within this window, nothing will.
 */
async function allowConsoleFlush(page: Page) {
  await page.waitForTimeout(300);
}

/** Regex matching `[console.X()] <ISO-8601 timestamp> - <exact input>`. */
function expectedFormat(
  level: Exclude<LogLevel, 'table'>,
  value: string,
): RegExp {
  const esc = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `^\\[console\\.${level}\\(\\)\\] \\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z - ${esc}$`,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('Console Logs', () => {
  let consoleLogsPage: ConsoleLogsPage;

  test.beforeEach(async ({ page }) => {
    consoleLogsPage = new ConsoleLogsPage(page);
    await consoleLogsPage.goto();
  });

  // ── Page-level ────────────────────────────────────────────────────────────

  test.describe('Page-level', () => {
    test('TC01 - All 6 input/button pairs are present with their default values', async () => {
      const levels: LogLevel[] = ['log', 'warn', 'error', 'info', 'debug', 'table'];
      for (const level of levels) {
        await expect(consoleLogsPage.getButton(level)).toBeVisible();
        await expect(consoleLogsPage.getInput(level)).toHaveValue(
          consoleLogsPage.getDefaultValue(level),
        );
      }
    });

    test('TC02 - Page load emits `console.log("The page was successfully loaded")`', async ({ page }) => {
      // beforeEach already navigated, so the load log has already fired.
      // Reload with the listener in place to catch it.
      const captured: ConsoleMessage[] = [];
      page.on('console', (msg) => {
        if (msg.text() === 'The page was successfully loaded') captured.push(msg);
      });

      await consoleLogsPage.reload();

      await expect.poll(() => captured.length, { timeout: 5000 }).toBeGreaterThanOrEqual(1);
      expect(captured[0].type()).toBe('log');
    });

    test('TC03 - Log message timestamp matches ISO-8601 format', async ({ page }) => {
      const captured = captureAppMessages(page);
      await consoleLogsPage.clickButton('log');
      await expect.poll(() => captured.length).toBe(1);
      expect(captured[0].text()).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });
  });

  // ── Log button ────────────────────────────────────────────────────────────

  test.describe('Log button', () => {
    test('TC04 - Default input emits one `log` with expected format', async ({ page }) => {
      const captured = captureAppMessages(page);
      await consoleLogsPage.clickButton('log');

      await expect.poll(() => captured.length).toBe(1);
      expect(captured[0].type()).toBe('log');
      expect(captured[0].text()).toMatch(expectedFormat('log', 'simple message'));
    });

    test('TC05 - Custom text round-trips into the logged message', async ({ page }) => {
      const customText = 'my custom payload';
      await consoleLogsPage.fillInput('log', customText);

      const captured = captureAppMessages(page);
      await consoleLogsPage.clickButton('log');

      await expect.poll(() => captured.length).toBe(1);
      expect(captured[0].text()).toMatch(expectedFormat('log', customText));
    });

    test('TC06 - Special chars (<script>, quotes, unicode) appear literally in the message', async ({ page }) => {
      const customText = `<script>alert('x')</script> "quotes" 日本語 🎉`;
      await consoleLogsPage.fillInput('log', customText);

      const captured = captureAppMessages(page);
      await consoleLogsPage.clickButton('log');

      await expect.poll(() => captured.length).toBe(1);
      expect(captured[0].text()).toMatch(expectedFormat('log', customText));
    });

    test('TC07 - Empty input emits nothing (guard)', async ({ page }) => {
      await consoleLogsPage.clearInput('log');

      const captured = captureAppMessages(page);
      await consoleLogsPage.clickButton('log');
      await allowConsoleFlush(page);

      expect(captured).toHaveLength(0);
    });

    test('TC08 - Clicking Log emits only a `log` (no other console levels)', async ({ page }) => {
      const captured = captureAppMessages(page);
      await consoleLogsPage.clickButton('log');

      await expect.poll(() => captured.length).toBe(1);
      await allowConsoleFlush(page);

      expect(captured).toHaveLength(1);
      expect(captured[0].type()).toBe('log');
    });
  });

  // ── Warn / Error / Info / Debug — identical pattern per method ───────────

  const textLevels: Array<{
    level: Exclude<LogLevel, 'table' | 'log'>;
    describe: string;
    shortName: string;
    consoleType: 'warning' | 'error' | 'info' | 'debug';
    defaultValue: string;
    tc: [number, number, number];
  }> = [
    { level: 'warn',  describe: 'Warn button',  shortName: 'Warn',  consoleType: 'warning', defaultValue: 'warning message',   tc: [9, 10, 11] },
    { level: 'error', describe: 'Error button', shortName: 'Error', consoleType: 'error',   defaultValue: 'error message',     tc: [12, 13, 14] },
    { level: 'info',  describe: 'Info button',  shortName: 'Info',  consoleType: 'info',    defaultValue: 'info message',      tc: [15, 16, 17] },
    { level: 'debug', describe: 'Debug button', shortName: 'Debug', consoleType: 'debug',   defaultValue: 'debugging message', tc: [18, 19, 20] },
  ];

  for (const { level, describe: describeName, shortName, consoleType, defaultValue, tc } of textLevels) {
    test.describe(describeName, () => {
      test(`TC${tc[0]} - Default input emits one \`${consoleType}\` with expected format`, async ({ page }) => {
        const captured = captureAppMessages(page);
        await consoleLogsPage.clickButton(level);

        await expect.poll(() => captured.length).toBe(1);
        expect(captured[0].type()).toBe(consoleType);
        expect(captured[0].text()).toMatch(expectedFormat(level, defaultValue));
      });

      test(`TC${tc[1]} - Empty input emits nothing (guard)`, async ({ page }) => {
        await consoleLogsPage.clearInput(level);

        const captured = captureAppMessages(page);
        await consoleLogsPage.clickButton(level);
        await allowConsoleFlush(page);

        expect(captured).toHaveLength(0);
      });

      test(`TC${tc[2]} - Clicking ${shortName} emits only a \`${consoleType}\` (no other console levels)`, async ({ page }) => {
        const captured = captureAppMessages(page);
        await consoleLogsPage.clickButton(level);

        await expect.poll(() => captured.length).toBe(1);
        await allowConsoleFlush(page);

        expect(captured).toHaveLength(1);
        expect(captured[0].type()).toBe(consoleType);
      });
    });
  }

  // ── Table button ─────────────────────────────────────────────────────────

  test.describe('Table button', () => {
    type TableRow = { id: number; text: string; date: string };

    async function readTableRows(msg: ConsoleMessage): Promise<TableRow[]> {
      const handle = msg.args()[0];
      return (await handle.jsonValue()) as TableRow[];
    }

    test('TC21 - Default input (`"message1, message2"`) emits one `table` with 2 rows', async ({ page }) => {
      const captured = captureAppMessages(page);
      await consoleLogsPage.clickButton('table');

      await expect.poll(() => captured.length).toBe(1);
      expect(captured[0].type()).toBe('table');

      const rows = await readTableRows(captured[0]);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ id: 1, text: 'message1' });
      expect(rows[1]).toMatchObject({ id: 2, text: 'message2' });
    });

    test('TC22 - `"a, b, c"` produces 3 rows', async ({ page }) => {
      await consoleLogsPage.fillInput('table', 'a, b, c');

      const captured = captureAppMessages(page);
      await consoleLogsPage.clickButton('table');

      await expect.poll(() => captured.length).toBe(1);

      const rows = await readTableRows(captured[0]);
      expect(rows).toHaveLength(3);
      expect(rows.map((r) => r.text)).toEqual(['a', 'b', 'c']);
    });

    test('TC23 - `"a,b,c"` (no spaces) produces 1 row — pins the `", "` split quirk', async ({ page }) => {
      await consoleLogsPage.fillInput('table', 'a,b,c');

      const captured = captureAppMessages(page);
      await consoleLogsPage.clickButton('table');

      await expect.poll(() => captured.length).toBe(1);

      const rows = await readTableRows(captured[0]);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ id: 1, text: 'a,b,c' });
    });

    test('TC24 - Empty input emits nothing (guard)', async ({ page }) => {
      await consoleLogsPage.clearInput('table');

      const captured = captureAppMessages(page);
      await consoleLogsPage.clickButton('table');
      await allowConsoleFlush(page);

      expect(captured).toHaveLength(0);
    });

    test('TC25 - Clicking Table emits only a `table` (no other console levels)', async ({ page }) => {
      const captured = captureAppMessages(page);
      await consoleLogsPage.clickButton('table');

      await expect.poll(() => captured.length).toBe(1);
      await allowConsoleFlush(page);

      expect(captured).toHaveLength(1);
      expect(captured[0].type()).toBe('table');
    });
  });
});
