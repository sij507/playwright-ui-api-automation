import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { describeValue } from '../../utils/sanitize';
import type { BookstoreCredentials } from '../../data/bookstore';

export class BookstoreSignupPage extends BasePage {
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly signUpButton: Locator;
  readonly alertMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('#username');
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.confirmPasswordInput = page.locator('#password2');
    this.signUpButton = page.getByRole('button', { name: 'Sign Up' });
    this.alertMessage = page.locator('.alert');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/bookstore/user/signup', 'Open Bookstore sign up page');
  }

  async signUp(user: BookstoreCredentials, confirmPassword: string = user.password): Promise<void> {
    await this.perform(describeValue('Enter username', user.username), () => this.usernameInput.fill(user.username));
    await this.perform(describeValue('Enter email', user.email), () => this.emailInput.fill(user.email));
    await this.perform(describeValue('Enter password', user.password), () => this.passwordInput.fill(user.password));
    await this.perform(describeValue('Enter confirm password', confirmPassword), () =>
      this.confirmPasswordInput.fill(confirmPassword),
    );
    await this.perform('Click Sign Up button', () => this.signUpButton.click());
  }
}
