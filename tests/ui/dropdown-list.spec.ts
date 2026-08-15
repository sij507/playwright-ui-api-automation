import { test, expect } from '../../src/fixtures/base';

test.describe('Dropdown list', () => {
  test.beforeEach(async ({ dropdownListPage, step }) => {
    await step.given('the user is on the dropdown list page', async () => {
      await dropdownListPage.goto();
    });
  });

  test(
    'selecting an option in the simple dropdown updates its value',
    { tag: ['@critical', '@regression'] },
    async ({ dropdownListPage, step }) => {
      await step.then('no option is selected by default', async () => {
        await expect(dropdownListPage.simpleDropdown, 'default selected value').toHaveValue('');
      });

      await step.when('the user selects Option 2', async () => {
        await dropdownListPage.selectSimpleOption('Option 2');
      });

      await step.then('Option 2 is now selected', async () => {
        await expect(dropdownListPage.simpleDropdown, 'selected value').toHaveValue('2');
      });
    },
  );

  test(
    'selecting a page size updates the elements-per-page dropdown',
    { tag: ['@regression'] },
    async ({ dropdownListPage, step }) => {
      await step.when('the user selects 50 elements per page', async () => {
        await dropdownListPage.selectElementsPerPage('50');
      });

      await step.then('50 is now selected', async () => {
        await expect(dropdownListPage.elementsPerPageSelect, 'selected page size').toHaveValue('50');
      });
    },
  );

  test(
    'selecting a country updates the country dropdown',
    { tag: ['@regression'] },
    async ({ dropdownListPage, step }) => {
      await step.when('the user selects Canada', async () => {
        await dropdownListPage.selectCountry('Canada');
      });

      await step.then('Canada is now selected', async () => {
        await expect(dropdownListPage.countrySelect, 'selected country').toHaveValue('CA');
      });
    },
  );
});
