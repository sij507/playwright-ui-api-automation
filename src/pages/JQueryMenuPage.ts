import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class JQueryMenuPage extends BasePage {
  readonly disabledMenuItem: Locator;
  readonly enabledMenuItem: Locator;
  readonly downloadsMenuItem: Locator;
  readonly backToJQueryUiItem: Locator;
  readonly pdfLink: Locator;
  readonly csvLink: Locator;
  readonly excelLink: Locator;
  /** Nested under "Disabled" — the page's own point: this exists in the HTML regardless, so a naive test that only checks the DOM (rather than actual visibility) would wrongly conclude it's reachable. */
  readonly hiddenDisabledSubmenuItem: Locator;

  constructor(page: Page) {
    super(page);
    this.disabledMenuItem = page.getByRole('menuitem', { name: 'Disabled' });
    this.enabledMenuItem = page.getByRole('menuitem', { name: 'Enabled' });
    this.downloadsMenuItem = page.getByRole('menuitem', { name: 'Downloads' });
    this.backToJQueryUiItem = page.getByRole('menuitem', { name: 'Back to JQuery UI' });
    this.pdfLink = page.getByRole('menuitem', { name: 'PDF' });
    this.csvLink = page.getByRole('menuitem', { name: 'CSV' });
    this.excelLink = page.getByRole('menuitem', { name: 'Excel' });
    this.hiddenDisabledSubmenuItem = page.getByRole('menuitem', { name: 'Should not see this' });
  }

  async goto(): Promise<void> {
    await this.gotoPath('/jqueryui/menu', 'Open jQuery UI menu page');
  }

  async hoverDisabled(): Promise<void> {
    await this.perform('Hover Disabled menu item', () => this.disabledMenuItem.hover());
  }

  async hoverEnabled(): Promise<void> {
    await this.perform('Hover Enabled menu item', () => this.enabledMenuItem.hover());
  }

  async hoverDownloads(): Promise<void> {
    await this.perform('Hover Downloads submenu item', () => this.downloadsMenuItem.hover());
  }
}
