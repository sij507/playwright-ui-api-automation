import { test, expect } from '../../src/fixtures/base';

test.describe('Redirect', () => {
  test(
    'following the redirect link lands on the status codes page',
    { tag: ['@regression'] },
    async ({ redirectorPage, page, step }) => {
      await step.given('the user is on the redirector page', async () => {
        await redirectorPage.goto();
      });

      await step.when('the user clicks the redirect link', async () => {
        await redirectorPage.triggerRedirect();
      });

      await step.then('the browser ends up on the status codes page', async () => {
        await expect(page).toHaveURL(/\/status-codes$/);
        await expect(
          page.getByRole('heading', { name: 'Status Codes', exact: true }),
          'Status Codes heading',
        ).toBeVisible();
      });
    },
  );
});
