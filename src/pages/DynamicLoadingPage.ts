import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DynamicLoadingPage extends BasePage {
  readonly startButton: Locator;
  readonly finishedText: Locator;

  constructor(page: Page) {
    super(page);
    this.startButton = page.getByRole('button', { name: 'Start' });
    this.finishedText = page.getByText('Hello World!');
  }

  /** Example 1: the "Hello World!" element already exists in the DOM (display:none) and is only ever toggled visible. */
  async gotoHiddenElementExample(): Promise<void> {
    await this.gotoPath('/dynamic-loading/1', 'Open dynamic loading example 1 (hidden element)');
  }

  /** Example 2: the "Hello World!" element doesn't exist in the DOM at all until Start is clicked — it's inserted, not just revealed. */
  async gotoRenderedAfterExample(): Promise<void> {
    await this.gotoPath('/dynamic-loading/2', 'Open dynamic loading example 2 (rendered after the fact)');
  }

  async clickStart(): Promise<void> {
    await this.perform('Click Start button', () => this.startButton.click());
  }
}
