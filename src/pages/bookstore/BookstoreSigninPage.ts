import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { describeValue } from '../../utils/sanitize';

export class BookstoreSigninPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly alertMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.signInButton = page.locator('#submit');
    this.alertMessage = page.locator('.alert');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/bookstore/user/signin', 'Open Bookstore sign in page');
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.perform(describeValue('Enter email', email), () => this.emailInput.fill(email));
    await this.perform(describeValue('Enter password', password), () => this.passwordInput.fill(password));
    await this.perform('Click Sign In button', () => this.signInButton.click());
  }
}
