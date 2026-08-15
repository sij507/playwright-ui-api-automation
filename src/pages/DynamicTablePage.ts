import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DynamicTablePage extends BasePage {
  readonly chromeCpuLabel: Locator;
  private readonly table: Locator;

  constructor(page: Page) {
    super(page);
    this.chromeCpuLabel = page.locator('#chrome-cpu');
    this.table = page.getByRole('table');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/dynamic-table', 'Open dynamic table page');
  }

  private chromeRow(): Locator {
    return this.table.getByRole('row').filter({ has: this.page.getByRole('cell', { name: 'Chrome', exact: true }) });
  }

  // Both columns and rows reorder on every page load (per the page's own
  // description), so the CPU value can't live at a fixed cell index — the
  // header row is read first to find which column is currently "CPU".
  private async cpuColumnIndex(): Promise<number> {
    const headers = await this.table.getByRole('columnheader').allTextContents();
    const index = headers.findIndex((header) => header.trim() === 'CPU');
    if (index === -1) throw new Error(`Could not find a "CPU" column header. Headers were: ${headers.join(', ')}`);
    return index;
  }

  /** Reads the CPU % straight from the "Chrome" row's own table cell, locating the CPU column by its current header position. */
  async getChromeCpuFromTable(): Promise<string> {
    return this.perform('Read Chrome CPU value from the table', async () => {
      const columnIndex = await this.cpuColumnIndex();
      const cells = this.chromeRow().getByRole('cell');
      return (await cells.nth(columnIndex).textContent())?.trim() ?? '';
    });
  }

  /** Reads the CPU % from the yellow reference label ("Chrome CPU: X%"). */
  async getChromeCpuFromLabel(): Promise<string> {
    return this.perform('Read Chrome CPU value from the reference label', async () => {
      const text = (await this.chromeCpuLabel.textContent()) ?? '';
      return text.replace('Chrome CPU:', '').trim();
    });
  }
}
