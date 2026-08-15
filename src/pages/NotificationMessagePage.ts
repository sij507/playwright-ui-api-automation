import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class NotificationMessagePage extends BasePage {
  readonly notification: Locator;
  readonly reloadLink: Locator;

  constructor(page: Page) {
    super(page);
    this.notification = page.locator('#flash');
    this.reloadLink = page.getByRole('link', { name: 'Click here' });
  }

  async goto(): Promise<void> {
    await this.gotoPath('/notification-message', 'Open notification message page');
  }

  async reload(): Promise<void> {
    await this.perform('Click "here" to load a new notification message', () => this.reloadLink.click());
  }

  async getMessage(): Promise<string> {
    return (await this.notification.textContent())?.trim() ?? '';
  }
}
