import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { describeValue } from '../utils/sanitize';

export class DropdownListPage extends BasePage {
  readonly simpleDropdown: Locator;
  readonly elementsPerPageSelect: Locator;
  readonly countrySelect: Locator;

  constructor(page: Page) {
    super(page);
    this.simpleDropdown = page.locator('#dropdown');
    this.elementsPerPageSelect = page.locator('#elementsPerPageSelect');
    this.countrySelect = page.locator('#country');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/dropdown', 'Open dropdown list page');
  }

  async selectSimpleOption(label: string): Promise<void> {
    await this.perform(describeValue('Select option', label), () => this.simpleDropdown.selectOption({ label }));
  }

  async selectElementsPerPage(value: string): Promise<void> {
    await this.perform(describeValue('Select elements per page', value), () =>
      this.elementsPerPageSelect.selectOption(value),
    );
  }

  async selectCountry(label: string): Promise<void> {
    await this.perform(describeValue('Select country', label), () => this.countrySelect.selectOption({ label }));
  }
}
