import { Page, Locator } from "@playwright/test";

export class DynamicTablePage {
  private readonly table: Locator;
  private readonly tableHeaders: Locator;
  private readonly tableRows: Locator;
  private readonly chromeCpuLabel: Locator;

  constructor(private page: Page) {
    this.table = page.locator("table.table");
    this.tableHeaders = this.table.locator("thead th");
    this.tableRows = this.table.locator("tbody tr");
    this.chromeCpuLabel = page.locator("#chrome-cpu");
  }

  async goto() {
    await this.page.goto("/dynamic-table", { waitUntil: "domcontentloaded" });
  }

  async reload() {
    await this.page.reload({ waitUntil: "domcontentloaded" });
  }

  /** Returns the text content of all column headers in their current order. */
  async getColumnHeaders(): Promise<string[]> {
    return this.tableHeaders.allTextContents();
  }

  /** Returns the text content of the Name column for every row, in current order. */
  async getProcessNames(): Promise<string[]> {
    const headers = await this.getColumnHeaders();
    const nameColIndex = headers.indexOf("Name");
    const rows = await this.tableRows.all();
    const names: string[] = [];
    for (const row of rows) {
      const cells = await row.locator("td").allTextContents();
      names.push(cells[nameColIndex]);
    }
    return names;
  }

  /**
   * Returns the cell value for a given process name and column name.
   * Handles dynamic column/row ordering by reading headers each time.
   */
  async getCellValue(processName: string, columnName: string): Promise<string> {
    const headers = await this.getColumnHeaders();
    const colIndex = headers.indexOf(columnName);
    if (colIndex === -1) {
      throw new Error(
        `Column "${columnName}" not found. Available: ${headers.join(", ")}`,
      );
    }

    const rows = await this.tableRows.all();
    for (const row of rows) {
      const cells = await row.locator("td").allTextContents();
      if (cells.includes(processName)) {
        return cells[colIndex];
      }
    }
    throw new Error(`Process "${processName}" not found in table`);
  }

  /** Returns all cell values for every row as an array of string arrays. */
  async getAllCellValues(): Promise<string[][]> {
    const rows = await this.tableRows.all();
    const allValues: string[][] = [];
    for (const row of rows) {
      allValues.push(await row.locator("td").allTextContents());
    }
    return allValues;
  }

  /** Returns the Chrome CPU value parsed from the yellow label's own text node. */
  async getChromeCpuLabelValue(): Promise<string> {
    // The #chrome-cpu element may contain ad/link children whose text bleeds
    // into textContent(). Extract only the element's direct text nodes.
    const text = await this.chromeCpuLabel.evaluate<string>(
      // Runs in the browser — extract only the element's direct text nodes,
      // ignoring child elements (ads/links injected into the label).
      (el) => {
        let result = "";
        for (let i = 0; i < el.childNodes.length; i++) {
          const node = el.childNodes[i];
          if (node.nodeType === 3) result += node.textContent;
        }
        return result;
      },
    );
    const match = text.match(/Chrome CPU:\s*(.+)/);
    return match ? match[1].trim() : "";
  }
}
