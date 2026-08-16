import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { describeValue } from '../../utils/sanitize';
import type { billingDetails, stripeTestCard } from '../../data/bookstore';

export class BookstoreCheckoutPage extends BasePage {
  readonly testModeNote: Locator;
  readonly totalText: Locator;
  readonly nameInput: Locator;
  readonly addressInput: Locator;
  readonly cardNameInput: Locator;
  readonly cardNumberInput: Locator;
  readonly cardExpiryMonthInput: Locator;
  readonly cardExpiryYearInput: Locator;
  readonly cardCvcInput: Locator;
  readonly purchaseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.testModeNote = page.getByText('This page is only for testing purposes');
    this.totalText = page.getByText(/^Total:/);
    this.nameInput = page.locator('#name');
    this.addressInput = page.locator('#address');
    this.cardNameInput = page.locator('#card-name');
    this.cardNumberInput = page.locator('#card-number');
    this.cardExpiryMonthInput = page.locator('#card-expiry-month');
    this.cardExpiryYearInput = page.locator('#card-expiry-year');
    this.cardCvcInput = page.locator('#card-cvc');
    this.purchaseButton = page.locator('[data-testid="purchase"]');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/bookstore/checkout', 'Open Bookstore checkout page');
  }

  async fillBillingDetails(billing: typeof billingDetails): Promise<void> {
    await this.perform(describeValue('Enter billing name', billing.name), () => this.nameInput.fill(billing.name));
    await this.perform(describeValue('Enter billing address', billing.address), () =>
      this.addressInput.fill(billing.address),
    );
  }

  // Card fields use the publicly documented Stripe test card (see
  // src/data/bookstore.ts) — not real payment data, so logged in plain text.
  async fillCardDetails(card: typeof stripeTestCard): Promise<void> {
    await this.perform(`Enter card holder name: ${card.cardHolderName}`, () =>
      this.cardNameInput.fill(card.cardHolderName),
    );
    await this.perform(`Enter card number: ${card.cardNumber}`, () => this.cardNumberInput.fill(card.cardNumber));
    await this.perform(`Enter card expiry month: ${card.expiryMonth}`, () =>
      this.cardExpiryMonthInput.fill(card.expiryMonth),
    );
    await this.perform(`Enter card expiry year: ${card.expiryYear}`, () =>
      this.cardExpiryYearInput.fill(card.expiryYear),
    );
    await this.perform(`Enter card CVC: ${card.cvc}`, () => this.cardCvcInput.fill(card.cvc));
  }

  async purchase(): Promise<void> {
    await this.perform('Click Purchase button', () => this.purchaseButton.click());
  }
}
