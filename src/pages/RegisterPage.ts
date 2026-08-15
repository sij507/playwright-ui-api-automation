import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { describeValue } from '../utils/sanitize';

export class RegisterPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly flashMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.confirmPasswordInput = page.getByLabel('Confirm Password');
    this.registerButton = page.getByRole('button', { name: 'Register' });
    this.flashMessage = page.locator('#flash');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/register', 'Open register page');
  }

  async register(username: string, password: string, confirmPassword: string): Promise<void> {
    await this.perform(describeValue('Enter username', username), () => this.usernameInput.fill(username));
    await this.perform(describeValue('Enter password', password), () => this.passwordInput.fill(password));
    await this.perform(describeValue('Enter confirm password', confirmPassword), () =>
      this.confirmPasswordInput.fill(confirmPassword),
    );
    await this.perform('Click Register button', () => this.registerButton.click());
  }
}
