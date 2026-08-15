import { test, expect } from '../../src/fixtures/base';

test.describe('Challenging DOM', () => {
  test.beforeEach(async ({ challengingDomPage, step }) => {
    await step.given('the user is on the challenging DOM page', async () => {
      await challengingDomPage.goto();
    });
  });

  test(
    'the three buttons stay reliably identifiable by class alone, even though their id and text are randomized on every reload',
    { tag: ['@critical', '@regression'] },
    async ({ challengingDomPage, page, step }) => {
      await step.then('each button is uniquely identifiable via its stable Bootstrap class', async () => {
        await expect(challengingDomPage.primaryButton, 'primary button').toBeVisible();
        await expect(challengingDomPage.warningButton, 'warning button').toBeVisible();
        await expect(challengingDomPage.successButton, 'success button').toBeVisible();
      });

      let primaryIdBefore = '';
      await step.and('the id and text of the primary button are noted', async () => {
        primaryIdBefore = (await challengingDomPage.primaryButton.getAttribute('id')) ?? '';
        await expect(primaryIdBefore, 'primary button id').not.toBe('');
      });

      await step.when('the page is reloaded', async () => {
        await page.reload();
      });

      await step.then(
        'the same class-based locator still resolves to exactly one button, with a different id than before',
        async () => {
          await expect(challengingDomPage.primaryButton, 'primary button').toBeVisible();
          const primaryIdAfter = await challengingDomPage.primaryButton.getAttribute('id');
          await expect(primaryIdAfter, 'primary button id after reload').not.toBe(primaryIdBefore);
        },
      );
    },
  );

  test(
    'the data table renders every row with readable cells and Edit/Delete actions',
    { tag: ['@regression'] },
    async ({ challengingDomPage, step }) => {
      await step.then('the table lists 10 data rows', async () => {
        const rowCount = await challengingDomPage.table.getByRole('row').count();
        await expect(rowCount, 'row count including header').toBe(11);
      });

      await step.and('the first row has its expected cell values and both actions available', async () => {
        const firstRow = challengingDomPage.row(0);
        await expect(firstRow.getByRole('cell').first(), 'first cell of first row').toHaveText('Iuvaret0');
        await expect(firstRow.getByRole('link', { name: 'Edit' }), 'Edit link').toBeVisible();
        await expect(firstRow.getByRole('link', { name: 'Delete' }), 'Delete link').toBeVisible();
      });
    },
  );

  test('the canvas element is present', { tag: ['@regression'] }, async ({ challengingDomPage, step }) => {
    await step.then('the canvas is visible', async () => {
      await expect(challengingDomPage.canvas, 'canvas element').toBeVisible();
    });
  });
});
