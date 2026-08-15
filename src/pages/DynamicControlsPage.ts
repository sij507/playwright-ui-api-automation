import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DynamicControlsPage extends BasePage {
  readonly checkbox: Locator;
  readonly removeAddButton: Locator;
  readonly checkboxMessage: Locator;

  readonly textInput: Locator;
  readonly enableDisableButton: Locator;
  readonly inputMessage: Locator;

  constructor(page: Page) {
    super(page);
    const checkboxExample = page.locator('#checkbox-example');
    this.checkbox = checkboxExample.locator('input[type="checkbox"]');
    this.removeAddButton = checkboxExample.getByRole('button');
    this.checkboxMessage = checkboxExample.locator('#message');

    const inputExample = page.locator('#input-example');
    this.textInput = inputExample.locator('input[type="text"]');
    this.enableDisableButton = inputExample.getByRole('button');
    this.inputMessage = inputExample.locator('#message');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/dynamic-controls', 'Open dynamic controls page');
  }

  async clickRemoveOrAdd(): Promise<void> {
    await this.perform('Click Remove/Add button', () => this.removeAddButton.click());
  }

  async clickEnableOrDisable(): Promise<void> {
    await this.perform('Click Enable/Disable button', () => this.enableDisableButton.click());
  }
}
