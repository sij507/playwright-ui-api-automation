import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { describeValue } from '../../utils/sanitize';

export class BookstoreListPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly cartLink: Locator;
  readonly bookCards: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('#search-input');
    this.searchButton = page.locator('#search-btn');
    this.cartLink = page.locator('a[href="/bookstore/cart"]');
    this.bookCards = page.locator('.card-product-user');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/bookstore', 'Open Bookstore book list page');
  }

  async search(keyword: string): Promise<void> {
    await this.perform(describeValue('Enter search keyword', keyword), () => this.searchInput.fill(keyword));
    await this.perform('Click Search button', () => this.searchButton.click());
  }

  bookCard(index: number): Locator {
    return this.bookCards.nth(index);
  }

  bookTitleLocator(index: number): Locator {
    return this.bookCard(index).locator('[data-testid^="title-"]');
  }

  async bookTitle(index: number): Promise<string> {
    return (await this.bookTitleLocator(index).innerText()).trim();
  }

  async bookPrice(index: number): Promise<string> {
    return (await this.bookCard(index).locator('[data-testid^="price-"]').innerText()).trim();
  }

  async addToCart(index: number): Promise<void> {
    const title = await this.bookTitle(index);
    await this.perform(`Add "${title}" to cart`, () => this.bookCard(index).locator('[data-testid^="cart-"]').click());
  }

  /** The cart badge's own text doubles as the item count; empty before anything is added. */
  async cartItemCount(): Promise<string> {
    return (await this.cartLink.innerText()).trim();
  }
}
