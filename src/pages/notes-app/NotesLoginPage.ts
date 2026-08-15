import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { describeValue } from '../../utils/sanitize';

export class NotesLoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
  }

  async goto(): Promise<void> {
    await this.gotoPath('/notes/app/login', 'Open Notes App login page');
  }

  async login(email: string, password: string): Promise<void> {
    await this.perform(describeValue('Enter email', email), () => this.emailInput.fill(email));
    await this.perform(describeValue('Enter password', password), () => this.passwordInput.fill(password));
    await this.perform('Click Login button', () => this.loginButton.click());
  }
}
