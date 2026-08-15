import { test, expect } from '../../src/fixtures/base';
import { demoUser, invalidCredentials, longStringInput, loginErrors } from '../../src/data/users';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage, step }) => {
    await step.given('the user is on the login page', async () => {
      await loginPage.goto();
    });
  });

  test.describe('Positive', () => {
    test(
      'logs in with valid credentials and can log out',
      { tag: ['@smoke', '@critical', '@regression'] },
      async ({ loginPage, secureAreaPage, page, step }) => {
        await step.when('the user logs in with valid credentials', async () => {
          await loginPage.login(demoUser.username, demoUser.password);
        });

        await step.then('the user is redirected to the secure area', async () => {
          await expect(page).toHaveURL(/\/secure$/);
          await expect(secureAreaPage.flashMessage, 'flash message').toBeVisible();
        });

        await step.and('the user logs out', async () => {
          await secureAreaPage.logout();
        });

        await step.then('the user is returned to the login page', async () => {
          await expect(page).toHaveURL(/\/login$/);
        });
      },
    );
  });

  test.describe('Negative', () => {
    test('rejects an unknown username', { tag: ['@regression'] }, async ({ loginPage, step }) => {
      await step.when('the user logs in with a username that does not exist', async () => {
        await loginPage.login(invalidCredentials.username, demoUser.password);
      });

      await step.then('an invalid-username error is shown', async () => {
        await expect(loginPage.flashMessage).toHaveText(loginErrors.invalidUsername);
      });
    });

    test('rejects a valid username with the wrong password', { tag: ['@regression'] }, async ({ loginPage, step }) => {
      await step.when('the user logs in with the correct username but wrong password', async () => {
        await loginPage.login(demoUser.username, invalidCredentials.password);
      });

      await step.then('an invalid-password error is shown', async () => {
        await expect(loginPage.flashMessage).toHaveText(loginErrors.invalidPassword);
      });
    });

    test('rejects empty username and password', { tag: ['@regression'] }, async ({ loginPage, step }) => {
      await step.when('the user submits the form with both fields empty', async () => {
        await loginPage.login('', '');
      });

      await step.then('an invalid-username error is shown', async () => {
        await expect(loginPage.flashMessage).toHaveText(loginErrors.invalidUsername);
      });
    });
  });

  test.describe('Edge cases', () => {
    test(
      'handles an extremely long username gracefully',
      { tag: ['@regression'] },
      async ({ loginPage, page, step }) => {
        await step.when('the user submits an extremely long username', async () => {
          await loginPage.login(longStringInput, demoUser.password);
        });

        await step.then('the user stays on the login page with an error shown', async () => {
          await expect(loginPage.flashMessage, 'flash message').toBeVisible();
          await expect(page).toHaveURL(/\/login$/);
        });
      },
    );
  });
});
