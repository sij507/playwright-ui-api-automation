import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class RedirectorPage extends BasePage {
  readonly redirectLink: Locator;

  constructor(page: Page) {
    super(page);
    this.redirectLink = page.locator('#redirect');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/redirector', 'Open redirector page');
  }

  async triggerRedirect(): Promise<void> {
    await this.perform('Click redirect link', () => this.redirectLink.click());
  }
}
