import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class BookstoreProfilePage extends BasePage {
  readonly profileHeading: Locator;
  readonly greeting: Locator;
  readonly successBanner: Locator;
  readonly ordersHeading: Locator;
  readonly deleteAllOrdersButton: Locator;
  readonly accountMenuToggle: Locator;
  readonly logOutLink: Locator;

  constructor(page: Page) {
    super(page);
    this.profileHeading = page.getByRole('heading', { name: 'Profile' });
    this.greeting = page.getByRole('heading', { name: /^Hello / });
    this.successBanner = page.getByText('Your purchase was successful');
    this.ordersHeading = page.getByRole('heading', { name: 'My Orders' });
    this.deleteAllOrdersButton = page.getByRole('button', { name: 'Delete All Orders' });
    this.accountMenuToggle = page.locator('#navbarDropdown');
    this.logOutLink = page.locator('#logout');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/bookstore/user/profile', 'Open Bookstore profile page');
  }

  // The order's own data-testid equals its reference ID — scoped this way
  // instead of getByText(referenceId), since the success banner above it
  // also contains that ID as a text substring.
  orderReference(referenceId: string): Locator {
    return this.page.getByTestId(referenceId);
  }

  async deleteAllOrders(): Promise<void> {
    await this.perform('Click Delete All Orders button', async () => {
      // Defensive: harmless no-op if the button doesn't trigger a native
      // confirm() dialog; registered before the click since a dialog blocks
      // the page's JS thread until handled (see JsDialogsPage for details).
      this.page.once('dialog', (dialog) => void dialog.accept());
      await this.deleteAllOrdersButton.click();
    });
  }

  async logOut(): Promise<void> {
    // The Log Out link lives inside a Bootstrap dropdown menu, hidden until
    // the account name toggle is clicked open.
    await this.perform('Open account menu', () => this.accountMenuToggle.click());
    await this.perform('Click Log Out link', () => this.logOutLink.click());
  }
}
