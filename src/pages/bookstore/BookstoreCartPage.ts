import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { describeValue } from '../../utils/sanitize';

export class BookstoreCartPage extends BasePage {
  readonly quantityInput: Locator;
  readonly updateButton: Locator;
  readonly deleteLink: Locator;
  readonly checkoutLink: Locator;
  readonly totalText: Locator;
  readonly emptyCartMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.quantityInput = page.locator('#cartQty');
    this.updateButton = page.getByRole('button', { name: 'Update' });
    // Despite being an <a>, the site sets role="button" on this element,
    // overriding its implicit link role.
    this.deleteLink = page.getByRole('button', { name: 'Delete' });
    this.checkoutLink = page.locator('[data-testid="checkout"]');
    this.totalText = page.getByText(/^Total:/);
    this.emptyCartMessage = page.getByText('No items in carts');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/bookstore/cart', 'Open shopping cart page');
  }

  async updateQuantity(quantity: number): Promise<void> {
    await this.perform(describeValue('Enter cart quantity', quantity), () => this.quantityInput.fill(String(quantity)));
    await this.perform('Click Update button', () => this.updateButton.click());
  }

  async deleteItem(): Promise<void> {
    await this.perform('Click Delete on cart item', () => this.deleteLink.click());
  }

  async proceedToCheckout(): Promise<void> {
    await this.perform('Click Proceed To Checkout', () => this.checkoutLink.click());
  }
}
