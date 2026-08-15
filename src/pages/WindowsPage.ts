import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class WindowsPage extends BasePage {
  readonly openWindowLink: Locator;

  constructor(page: Page) {
    super(page);
    this.openWindowLink = page.getByRole('link', { name: 'Click Here' });
  }

  async goto(): Promise<void> {
    await this.gotoPath('/windows', 'Open multiple windows page');
  }

  /** Clicks the link that opens /windows/new in a new tab and returns that new tab, loaded and ready to assert against. */
  async openNewWindow(): Promise<Page> {
    return this.perform('Click link to open a new window', async () => {
      const [newPage] = await Promise.all([this.page.context().waitForEvent('page'), this.openWindowLink.click()]);
      await newPage.waitForLoadState();
      return newPage;
    });
  }
}
