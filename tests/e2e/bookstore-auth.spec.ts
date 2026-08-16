import { test, expect } from '../../src/fixtures/base';
import { newBookstoreUser, bookstoreMessages } from '../../src/data/bookstore';

test.describe('Bookstore: Sign up', () => {
  test.beforeEach(async ({ bookstoreSignupPage, step }) => {
    await step.given('the user is on the bookstore sign up page', async () => {
      await bookstoreSignupPage.goto();
    });
  });

  test(
    'signing up with a new email creates and signs in the account',
    { tag: ['@smoke', '@critical', '@regression'] },
    async ({ bookstoreSignupPage, bookstoreProfilePage, step }) => {
      const user = newBookstoreUser();

      await step.when('the user signs up with a unique username, email, and password', async () => {
        await bookstoreSignupPage.signUp(user);
      });

      await step.then('the new account is authenticated, confirmed via the profile page', async () => {
        await bookstoreProfilePage.goto();
        await expect(bookstoreProfilePage.greeting, 'profile greeting').toHaveText(`Hello ${user.username}`);
      });
    },
  );

  test(
    'signing up with an email already in use is rejected',
    { tag: ['@regression'] },
    async ({ bookstoreSignupPage, step }) => {
      const existingUser = newBookstoreUser();

      await step.given('an account already exists for an email address', async () => {
        await bookstoreSignupPage.signUp(existingUser);
      });
      await step.and('the user returns to the sign up page', async () => {
        await bookstoreSignupPage.goto();
      });

      await step.when('the user signs up again reusing that email', async () => {
        await bookstoreSignupPage.signUp({ ...existingUser, username: `${existingUser.username}2` });
      });

      await step.then('the sign up is rejected as a duplicate email', async () => {
        await expect(bookstoreSignupPage.alertMessage, 'sign up error').toHaveText(bookstoreMessages.emailAlreadyInUse);
      });
    },
  );
});

test.describe('Bookstore: Sign in', () => {
  test.beforeEach(async ({ bookstoreSigninPage, step }) => {
    await step.given('the user is on the bookstore sign in page', async () => {
      await bookstoreSigninPage.goto();
    });
  });

  test(
    'signing in with an unregistered email is rejected',
    { tag: ['@regression'] },
    async ({ bookstoreSigninPage, step }) => {
      await step.when('the user signs in with an email that has no account', async () => {
        await bookstoreSigninPage.signIn(`nonexistent.${Date.now()}@expandtesting.com`, 'WrongPassword123!');
      });

      await step.then('the sign in is rejected as an unknown user', async () => {
        await expect(bookstoreSigninPage.alertMessage, 'sign in error').toHaveText(bookstoreMessages.userNotFound);
      });
    },
  );

  test(
    'signing in with the wrong password is rejected',
    { tag: ['@regression'] },
    async ({ bookstoreSignupPage, bookstoreSigninPage, step }) => {
      const user = newBookstoreUser();

      await step.given('a registered account exists', async () => {
        await bookstoreSignupPage.goto();
        await bookstoreSignupPage.signUp(user);
      });
      await step.and('the user returns to the sign in page', async () => {
        await bookstoreSigninPage.goto();
      });

      await step.when('the user signs in with the wrong password', async () => {
        await bookstoreSigninPage.signIn(user.email, 'CompletelyWrongPassword1!');
      });

      await step.then('the sign in is rejected with an incorrect-password message', async () => {
        await expect(bookstoreSigninPage.alertMessage, 'sign in error').toHaveText(bookstoreMessages.incorrectPassword);
      });
    },
  );

  test(
    'signing in with valid credentials succeeds',
    { tag: ['@critical', '@regression'] },
    async ({ bookstoreSignupPage, bookstoreSigninPage, bookstoreProfilePage, step }) => {
      const user = newBookstoreUser();

      await step.given('a registered account exists and the user has logged out', async () => {
        await bookstoreSignupPage.goto();
        await bookstoreSignupPage.signUp(user);
        await bookstoreProfilePage.goto();
        await bookstoreProfilePage.logOut();
      });
      await step.and('the user returns to the sign in page', async () => {
        await bookstoreSigninPage.goto();
      });

      await step.when('the user signs in with valid credentials', async () => {
        await bookstoreSigninPage.signIn(user.email, user.password);
      });

      await step.then('the user lands on their profile page', async () => {
        await expect(bookstoreProfilePage.greeting, 'profile greeting').toHaveText(`Hello ${user.username}`);
      });
    },
  );
});

test.describe('Bookstore: Checkout requires authentication', () => {
  test(
    'proceeding to checkout while signed out redirects to sign in',
    { tag: ['@critical', '@regression'] },
    async ({ bookstoreListPage, bookstoreCartPage, bookstoreSigninPage, page, step }) => {
      await step.given('a guest has added a book to the cart', async () => {
        await bookstoreListPage.goto();
        await bookstoreListPage.addToCart(0);
      });

      await step.when('the guest proceeds to checkout', async () => {
        await bookstoreCartPage.goto();
        await bookstoreCartPage.proceedToCheckout();
      });

      await step.then('the guest is redirected to the sign in page instead', async () => {
        await expect(page, 'current page').toHaveURL(/\/bookstore\/user\/signin/);
        await expect(bookstoreSigninPage.signInButton, 'sign in button').toBeVisible();
      });
    },
  );
});
