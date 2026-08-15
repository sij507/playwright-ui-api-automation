import { test, expect } from '../../src/fixtures/base';

test.describe('Dynamic table', () => {
  test(
    "the Chrome row's CPU value matches the reference label",
    { tag: ['@regression'] },
    async ({ dynamicTablePage, step }) => {
      await step.given('the user is on the dynamic table page', async () => {
        await dynamicTablePage.goto();
      });

      let labelValue = '';
      await step.when('the user reads the Chrome CPU reference label', async () => {
        labelValue = await dynamicTablePage.getChromeCpuFromLabel();
      });

      await step.then("the table's own Chrome row reports the same CPU value", async () => {
        const tableValue = await dynamicTablePage.getChromeCpuFromTable();
        await expect(tableValue, 'Chrome CPU value').toBe(labelValue);
      });
    },
  );
});
