import { test, expect } from '../../src/fixtures/base';
import { demoUser, secureArea } from '../../src/data/users';

test.describe('Secure area', () => {
  test(
    'shows the logged-in username and success message after login',
    { tag: ['@regression'] },
    async ({ loginPage, secureAreaPage, step }) => {
      await step.given('the user is on the login page', async () => {
        await loginPage.goto();
      });

      await step.when('the user logs in with valid credentials', async () => {
        await loginPage.login(demoUser.username, demoUser.password);
      });

      await step.then('the secure area greets the user by name', async () => {
        await expect(secureAreaPage.flashMessage).toHaveText(secureArea.loginSuccessMessage);
        await expect(secureAreaPage.heading, 'Secure Area heading').toBeVisible();
      });
    },
  );

  test(
    'redirects an unauthenticated direct visit to /secure back to the login page',
    { tag: ['@regression'] },
    async ({ page, step }) => {
      await step.when('an unauthenticated user navigates directly to /secure', async () => {
        await page.goto('/secure');
      });

      await step.then('the user is redirected to the login page instead', async () => {
        await expect(page).toHaveURL(/\/login$/);
      });
    },
  );

  test(
    'returns to the login page and cannot revisit /secure after logout',
    { tag: ['@critical', '@regression'] },
    async ({ loginPage, secureAreaPage, page, step }) => {
      await step.given('the user is logged in', async () => {
        await loginPage.goto();
        await loginPage.login(demoUser.username, demoUser.password);
      });

      await step.when('the user logs out', async () => {
        await secureAreaPage.logout();
      });

      await step.then('the user lands back on the login page', async () => {
        await expect(page).toHaveURL(/\/login$/);
      });

      await step.and('revisiting /secure redirects to the login page again', async () => {
        await page.goto('/secure');
        await expect(page).toHaveURL(/\/login$/);
      });
    },
  );
});
