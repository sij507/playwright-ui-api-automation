import { test, expect } from '../../src/fixtures/base';

test.describe('Dynamic controls', () => {
  test.beforeEach(async ({ dynamicControlsPage, step }) => {
    await step.given('the user is on the dynamic controls page', async () => {
      await dynamicControlsPage.goto();
    });
  });

  test(
    'removing then re-adding the checkbox works end to end',
    { tag: ['@critical', '@regression'] },
    async ({ dynamicControlsPage, step }) => {
      await step.then('the checkbox is present before removal', async () => {
        await expect(dynamicControlsPage.checkbox, 'checkbox').toBeVisible();
      });

      await step.when('the user clicks Remove', async () => {
        await dynamicControlsPage.clickRemoveOrAdd();
      });

      await step.then('the checkbox is gone and the button now offers to add it back', async () => {
        await expect(dynamicControlsPage.checkboxMessage, 'checkbox message').toHaveText("It's gone!", {
          timeout: 10_000,
        });
        await expect(dynamicControlsPage.checkbox, 'checkbox').toHaveCount(0);
        await expect(dynamicControlsPage.removeAddButton, 'Remove/Add button').toHaveText('Add');
      });

      await step.when('the user clicks Add', async () => {
        await dynamicControlsPage.clickRemoveOrAdd();
      });

      await step.then('the checkbox is back and the button offers to remove it again', async () => {
        await expect(dynamicControlsPage.checkboxMessage, 'checkbox message').toHaveText("It's back!", {
          timeout: 10_000,
        });
        await expect(dynamicControlsPage.checkbox, 'checkbox').toBeVisible();
        await expect(dynamicControlsPage.removeAddButton, 'Remove/Add button').toHaveText('Remove');
      });
    },
  );

  test('enabling the text input works', { tag: ['@regression'] }, async ({ dynamicControlsPage, step }) => {
    await step.then('the text input starts out disabled', async () => {
      await expect(dynamicControlsPage.textInput, 'text input').toBeDisabled();
    });

    await step.when('the user clicks Enable', async () => {
      await dynamicControlsPage.clickEnableOrDisable();
    });

    await step.then('the input becomes enabled and the button now offers to disable it', async () => {
      await expect(dynamicControlsPage.inputMessage, 'input message').toHaveText("It's enabled!", { timeout: 10_000 });
      await expect(dynamicControlsPage.textInput, 'text input').toBeEnabled();
      await expect(dynamicControlsPage.enableDisableButton, 'Enable/Disable button').toHaveText('Disable');
    });
  });
});
