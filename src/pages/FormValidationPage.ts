import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { describeValue } from '../utils/sanitize';

export type PaymentMethod = 'cash on delivery' | 'card';

export class FormValidationPage extends BasePage {
  readonly contactNameInput: Locator;
  readonly contactNumberInput: Locator;
  readonly pickupDateInput: Locator;
  readonly paymentSelect: Locator;
  readonly registerButton: Locator;
  readonly confirmationHeading: Locator;
  readonly confirmationMessage: Locator;

  constructor(page: Page) {
    super(page);
    // The page's own markup has a duplicate id="validationCustom05" shared
    // between the "Contact number" and "PickUp Date" fields (a real bug in
    // the site's HTML — both <label for> attributes point at the same id),
    // which breaks both id- and label-based lookups for those two fields.
    // Located by each field's unique `name` attribute instead.
    this.contactNameInput = page.locator('[name="ContactName"]');
    this.contactNumberInput = page.locator('[name="contactnumber"]');
    this.pickupDateInput = page.locator('[name="pickupdate"]');
    this.paymentSelect = page.locator('[name="payment"]');
    this.registerButton = page.getByRole('button', { name: 'Register' });
    this.confirmationHeading = page.getByRole('heading', { name: 'Form Confirmation' });
    this.confirmationMessage = page.getByText('Thank you for validating your ticket');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/form-validation', 'Open form validation page');
  }

  async fillContactName(value: string): Promise<void> {
    await this.perform(describeValue('Enter Contact Name', value), () => this.contactNameInput.fill(value));
  }

  async fillContactNumber(value: string): Promise<void> {
    await this.perform(describeValue('Enter Contact number', value), () => this.contactNumberInput.fill(value));
  }

  async fillPickupDate(value: string): Promise<void> {
    await this.perform(describeValue('Enter PickUp Date', value), () => this.pickupDateInput.fill(value));
  }

  async selectPaymentMethod(label: PaymentMethod): Promise<void> {
    await this.perform(describeValue('Select Payment Method', label), () => this.paymentSelect.selectOption({ label }));
  }

  async submit(): Promise<void> {
    await this.perform('Click Register button', () => this.registerButton.click());
  }

  async fillValidForm(details: {
    contactName: string;
    contactNumber: string;
    pickupDate: string;
    paymentMethod: PaymentMethod;
  }): Promise<void> {
    await this.fillContactName(details.contactName);
    await this.fillContactNumber(details.contactNumber);
    await this.fillPickupDate(details.pickupDate);
    await this.selectPaymentMethod(details.paymentMethod);
  }

  /** Each field's Bootstrap "invalid-feedback" message, scoped to that field's own wrapper so same-named fields never cross-match. */
  invalidFeedback(fieldName: 'ContactName' | 'contactnumber' | 'pickupdate' | 'payment'): Locator {
    return this.page.locator(`.col-md-6:has([name="${fieldName}"])`).locator('.invalid-feedback');
  }
}
