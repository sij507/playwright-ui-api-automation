import { test, expect } from '../../src/fixtures/base';
import { demoUser, registerErrors, registerableUsername } from '../../src/data/users';

test.describe('Register', () => {
  test.beforeEach(async ({ registerPage, step }) => {
    await step.given('the user is on the register page', async () => {
      await registerPage.goto();
    });
  });

  test(
    'registers a new account with a unique username',
    { tag: ['@regression'] },
    async ({ registerPage, page, step }) => {
      const username = registerableUsername();

      await step.when('the user registers with matching passwords', async () => {
        await registerPage.register(username, 'TestPass123!', 'TestPass123!');
      });

      await step.then('a success message is shown and the user lands on the login page', async () => {
        await expect(registerPage.flashMessage).toHaveText(registerErrors.registerSuccess);
        await expect(page).toHaveURL(/\/login$/);
      });
    },
  );

  test.describe('Negative', () => {
    test('rejects mismatched passwords', { tag: ['@regression'] }, async ({ registerPage, step }) => {
      await step.when('the user registers with mismatched passwords', async () => {
        await registerPage.register(registerableUsername(), 'TestPass123!', 'DifferentPass1!');
      });

      await step.then('a password-mismatch error is shown', async () => {
        await expect(registerPage.flashMessage).toHaveText(registerErrors.passwordMismatch);
      });
    });

    test('rejects a username that is already taken', { tag: ['@regression'] }, async ({ registerPage, step }) => {
      await step.when('the user registers using the demo account username', async () => {
        await registerPage.register(demoUser.username, 'TestPass123!', 'TestPass123!');
      });

      await step.then('a username-taken error is shown', async () => {
        await expect(registerPage.flashMessage).toHaveText(registerErrors.usernameTaken);
      });
    });
  });

  test.describe('Edge cases', () => {
    test('rejects an invalid username format', { tag: ['@regression'] }, async ({ registerPage, page, step }) => {
      await step.when('the user registers with an underscore in the username', async () => {
        await registerPage.register('invalid_username_format', 'TestPass123!', 'TestPass123!');
      });

      await step.then('the user stays on the register page with an error shown', async () => {
        await expect(registerPage.flashMessage, 'flash message').toBeVisible();
        await expect(page).toHaveURL(/\/register$/);
      });
    });
  });
});
