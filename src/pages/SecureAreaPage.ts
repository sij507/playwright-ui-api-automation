import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class SecureAreaPage extends BasePage {
  readonly flashMessage: Locator;
  readonly logoutButton: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.flashMessage = page.locator('#flash');
    this.logoutButton = page.getByRole('link', { name: 'Logout' });
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async logout(): Promise<void> {
    await this.perform('Click Logout button', () => this.logoutButton.click());
  }
}
