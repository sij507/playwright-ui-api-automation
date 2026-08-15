import { test, expect } from '../../src/fixtures/base';

test.describe('jQuery UI menu', () => {
  test.beforeEach(async ({ jQueryMenuPage, step }) => {
    await step.given('the user is on the jQuery UI menu page', async () => {
      await jQueryMenuPage.goto();
    });
  });

  test(
    'hovering Enabled reveals its submenu',
    { tag: ['@critical', '@regression'] },
    async ({ jQueryMenuPage, step }) => {
      await step.when('the user hovers the Enabled menu item', async () => {
        await jQueryMenuPage.hoverEnabled();
      });

      await step.then('its submenu items become visible', async () => {
        await expect(jQueryMenuPage.downloadsMenuItem, 'Downloads submenu item').toBeVisible();
        await expect(jQueryMenuPage.backToJQueryUiItem, 'Back to JQuery UI submenu item').toBeVisible();
      });
    },
  );

  test(
    'hovering Enabled then Downloads reveals the nested download links',
    { tag: ['@regression'] },
    async ({ jQueryMenuPage, step }) => {
      await step.when('the user hovers Enabled then Downloads', async () => {
        await jQueryMenuPage.hoverEnabled();
        await jQueryMenuPage.hoverDownloads();
      });

      await step.then('the PDF, CSV, and Excel links become visible', async () => {
        await expect(jQueryMenuPage.pdfLink, 'PDF link').toBeVisible();
        await expect(jQueryMenuPage.pdfLink, 'PDF link href').toHaveAttribute('href', /menu\.pdf$/);
        await expect(jQueryMenuPage.csvLink, 'CSV link').toBeVisible();
        await expect(jQueryMenuPage.csvLink, 'CSV link href').toHaveAttribute('href', /menu\.csv$/);
        await expect(jQueryMenuPage.excelLink, 'Excel link').toBeVisible();
        await expect(jQueryMenuPage.excelLink, 'Excel link href').toHaveAttribute('href', /menu\.xls$/);
      });
    },
  );

  test.describe('Negative', () => {
    test(
      'hovering the Disabled menu item never reveals its submenu',
      { tag: ['@regression'] },
      async ({ jQueryMenuPage, step }) => {
        await step.when('the user hovers the Disabled menu item', async () => {
          await jQueryMenuPage.hoverDisabled();
        });

        await step.then('its submenu item stays hidden', async () => {
          await expect(jQueryMenuPage.hiddenDisabledSubmenuItem, 'hidden submenu item').toBeHidden();
        });
      },
    );
  });
});
