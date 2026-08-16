import { test, expect } from '../../src/fixtures/base';
import { newBookstoreUser, billingDetails, stripeTestCard } from '../../src/data/bookstore';

// Full user journey: sign up -> browse -> cart -> checkout -> purchase ->
// order shows on profile -> delete order -> log out. The checkout page
// itself documents that it runs against Stripe in test mode ("you can use
// 4242424242424242 as the card number..."), so completing a real purchase
// here is safe and uses only that publicly documented test card.
test.describe('Bookstore: End-to-end purchase', () => {
  test(
    'a new user can register, buy a book with the Stripe test card, and see the order on their profile',
    { tag: ['@critical', '@regression'] },
    async ({
      bookstoreSignupPage,
      bookstoreListPage,
      bookstoreCartPage,
      bookstoreCheckoutPage,
      bookstoreProfilePage,
      page,
      step,
    }) => {
      const user = newBookstoreUser();
      let bookTitle = '';

      await step.given('a new user signs up for a bookstore account', async () => {
        await bookstoreSignupPage.goto();
        await bookstoreSignupPage.signUp(user);
      });

      await step.and('the user adds a book to the cart', async () => {
        await bookstoreListPage.goto();
        bookTitle = await bookstoreListPage.bookTitle(0);
        await bookstoreListPage.addToCart(0);
      });

      await step.and('the cart shows the added book', async () => {
        await bookstoreCartPage.goto();
        await expect(page.getByText(bookTitle), 'cart line item title').toBeVisible();
      });

      await step.when('the user proceeds to checkout', async () => {
        await bookstoreCartPage.proceedToCheckout();
      });

      await step.then('the checkout page confirms it runs in Stripe test mode', async () => {
        await expect(bookstoreCheckoutPage.testModeNote, 'Stripe test mode note').toBeVisible();
      });

      await step.and('the user fills in billing and Stripe test card details', async () => {
        await bookstoreCheckoutPage.fillBillingDetails(billingDetails);
        await bookstoreCheckoutPage.fillCardDetails(stripeTestCard);
      });

      let referenceId = '';
      await step.when('the user submits the purchase', async () => {
        await bookstoreCheckoutPage.purchase();
      });

      await step.then('the purchase succeeds and a reference ID is shown', async () => {
        // Real Stripe test-mode processing on the server side can be slower
        // than the default assertion timeout, especially under parallel
        // worker load.
        await expect(bookstoreProfilePage.successBanner, 'purchase success banner').toBeVisible({ timeout: 20_000 });
        referenceId = (await bookstoreProfilePage.successBanner.innerText()).match(/Reference ID:\s*(\S+)/)?.[1] ?? '';
        await expect(referenceId, 'purchase reference ID').not.toBe('');
      });

      await step.and('the purchased book appears under My Orders', async () => {
        await expect(bookstoreProfilePage.ordersHeading, 'My Orders heading').toBeVisible();
        await expect(bookstoreProfilePage.orderReference(referenceId), 'order reference row').toBeVisible();
        await expect(page.getByText(bookTitle), 'ordered book title').toBeVisible();
      });

      await step.and('the user deletes the order and logs out', async () => {
        await bookstoreProfilePage.deleteAllOrders();
        await bookstoreProfilePage.logOut();
      });

      await step.then('the user is signed out and returned to the book list', async () => {
        await expect(page, 'current page').toHaveURL(/\/bookstore\/?$/);
      });
    },
  );
});
