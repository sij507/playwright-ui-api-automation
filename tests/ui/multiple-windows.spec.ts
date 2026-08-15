import { test, expect } from '../../src/fixtures/base';

test.describe('Multiple windows', () => {
  test(
    'opening a new window leaves the original window in place',
    { tag: ['@critical', '@regression'] },
    async ({ windowsPage, page, step }) => {
      await step.given('the user is on the windows page', async () => {
        await windowsPage.goto();
      });

      let newWindow: Awaited<ReturnType<typeof windowsPage.openNewWindow>>;
      await step.when('the user clicks the link that opens a new window', async () => {
        newWindow = await windowsPage.openNewWindow();
      });

      await step.then('the new window shows the expected page', async () => {
        await expect(newWindow, 'new window URL').toHaveURL(/\/windows\/new$/);
        await expect(
          newWindow.getByText('Example of a new window page for Automation Testing Practice'),
          'new window content',
        ).toBeVisible();
      });

      await step.and('the original window is still on the windows page', async () => {
        await expect(page, 'original window URL').toHaveURL(/\/windows$/);
        await expect(windowsPage.openWindowLink, 'original window link').toBeVisible();
      });

      await step.and('the new window is closed', async () => {
        await newWindow.close();
      });
    },
  );
});
