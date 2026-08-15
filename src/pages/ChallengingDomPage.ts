import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ChallengingDomPage extends BasePage {
  // Both id and visible text on these three buttons are regenerated
  // randomly on every page load — Bootstrap's contextual color class is the
  // only thing about them that stays stable, which is exactly the
  // "challenge" this page is demonstrating.
  readonly primaryButton: Locator;
  readonly warningButton: Locator;
  readonly successButton: Locator;

  readonly table: Locator;
  readonly canvas: Locator;

  constructor(page: Page) {
    super(page);
    this.primaryButton = page.locator('a.btn.btn-primary.mb-2');
    this.warningButton = page.locator('a.btn.btn-warning.mb-2');
    this.successButton = page.locator('a.btn.btn-success.mb-2');
    this.table = page.getByRole('table');
    this.canvas = page.locator('#canvas');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/challenging-dom', 'Open challenging DOM page');
  }

  /** The data table has no id/class worth relying on, so rows are addressed by position — role-based cells and the Edit/Delete links within each are still stable. */
  row(index: number): Locator {
    return this.table.getByRole('row').nth(index + 1); // +1 skips the header row
  }
}
