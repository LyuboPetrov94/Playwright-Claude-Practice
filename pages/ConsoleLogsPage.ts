import { Page, Locator } from '@playwright/test';

export type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug' | 'table';

const BUTTON_ID: Record<LogLevel, string> = {
  log: 'btn-log',
  warn: 'btn-warn',
  error: 'btn-error',
  info: 'btn-info',
  debug: 'btn-debug',
  table: 'btn-table',
};

const INPUT_ID: Record<LogLevel, string> = {
  log: 'input-log',
  warn: 'input-warn',
  error: 'input-error',
  info: 'input-info',
  debug: 'input-debug',
  table: 'input-table',
};

const DEFAULT_VALUE: Record<LogLevel, string> = {
  log: 'simple message',
  warn: 'warning message',
  error: 'error message',
  info: 'info message',
  debug: 'debugging message',
  table: 'message1, message2',
};

export class ConsoleLogsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/console-logs', { waitUntil: 'domcontentloaded' });
  }

  async reload() {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  getButton(level: LogLevel): Locator {
    return this.page.locator(`#${BUTTON_ID[level]}`);
  }

  getInput(level: LogLevel): Locator {
    return this.page.locator(`#${INPUT_ID[level]}`);
  }

  getDefaultValue(level: LogLevel): string {
    return DEFAULT_VALUE[level];
  }

  async clickButton(level: LogLevel) {
    await this.getButton(level).click();
  }

  async fillInput(level: LogLevel, text: string) {
    const input = this.getInput(level);
    await input.clear();
    await input.fill(text);
  }

  async clearInput(level: LogLevel) {
    await this.getInput(level).clear();
  }
}
