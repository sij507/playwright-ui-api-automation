import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class SlowResourcesPage extends BasePage {
  readonly progressMessage: Locator;
  readonly finishedMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.progressMessage = page.locator('#progress-message');
    this.finishedMessage = page.getByText('The slow task has finished. Thanks for waiting!');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/slow', 'Open slow resources page');
  }
}
