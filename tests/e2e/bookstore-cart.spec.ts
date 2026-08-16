import { test, expect } from '../../src/fixtures/base';

test.describe('Bookstore: Browse and cart', () => {
  test.beforeEach(async ({ bookstoreListPage, step }) => {
    await step.given('the user is on the bookstore book list page', async () => {
      await bookstoreListPage.goto();
    });
  });

  test(
    'adding a book to the cart updates the cart badge',
    { tag: ['@smoke', '@critical', '@regression'] },
    async ({ bookstoreListPage, step }) => {
      await step.when('the user adds the first listed book to the cart', async () => {
        await bookstoreListPage.addToCart(0);
      });

      await step.then('the cart badge shows one item', async () => {
        await expect(await bookstoreListPage.cartItemCount(), 'cart item count').toBe('1');
      });
    },
  );

  test('searching the catalog filters the book list', { tag: ['@regression'] }, async ({ bookstoreListPage, step }) => {
    let searchedTitle = '';

    await step.given('the title of the first listed book is noted', async () => {
      searchedTitle = await bookstoreListPage.bookTitle(0);
    });

    await step.when('the user searches for that title', async () => {
      await bookstoreListPage.search(searchedTitle);
    });

    await step.then('the matching book is shown in the results', async () => {
      await expect(bookstoreListPage.bookTitleLocator(0), 'first result title').toHaveText(searchedTitle);
    });
  });
});

test.describe('Bookstore: Cart management', () => {
  test.beforeEach(async ({ bookstoreListPage, bookstoreCartPage, step }) => {
    await step.given('the user has added a book to the cart', async () => {
      await bookstoreListPage.goto();
      await bookstoreListPage.addToCart(0);
    });
    await step.and('the user is on the shopping cart page', async () => {
      await bookstoreCartPage.goto();
    });
  });

  test(
    'updating the quantity persists the new value',
    { tag: ['@regression'] },
    async ({ bookstoreCartPage, step }) => {
      await step.when('the user updates the quantity to 3', async () => {
        await bookstoreCartPage.updateQuantity(3);
      });

      await step.then('the quantity field reflects the update', async () => {
        await expect(bookstoreCartPage.quantityInput, 'cart quantity').toHaveValue('3');
      });
    },
  );

  test(
    'deleting the only item empties the cart',
    { tag: ['@critical', '@regression'] },
    async ({ bookstoreCartPage, step }) => {
      await step.when('the user deletes the item', async () => {
        await bookstoreCartPage.deleteItem();
      });

      await step.then('the cart shows the empty-cart message', async () => {
        await expect(bookstoreCartPage.emptyCartMessage, 'empty cart message').toBeVisible();
      });
    },
  );
});
