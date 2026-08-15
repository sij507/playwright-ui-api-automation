import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { describeValue } from '../utils/sanitize';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly flashMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.flashMessage = page.locator('#flash');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/login', 'Open login page');
  }

  async login(username: string, password: string): Promise<void> {
    await this.perform(describeValue('Enter username', username), () => this.usernameInput.fill(username));
    await this.perform(describeValue('Enter password', password), () => this.passwordInput.fill(password));
    await this.perform('Click Login button', () => this.loginButton.click());
  }
}
