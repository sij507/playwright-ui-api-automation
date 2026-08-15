import { test, expect } from '../../src/fixtures/base';
import { dialogMessages } from '../../src/data/messages';

test.describe('JavaScript dialogs', () => {
  test.beforeEach(async ({ jsDialogsPage, step }) => {
    await step.given('the user is on the JavaScript dialogs page', async () => {
      await jsDialogsPage.goto();
    });
  });

  test('accepting the JS alert records the OK response', { tag: ['@regression'] }, async ({ jsDialogsPage, step }) => {
    await step.when('the user triggers and accepts the JS alert', async () => {
      await jsDialogsPage.triggerAlert();
    });

    await step.then('the response is recorded as OK', async () => {
      await expect(jsDialogsPage.dialogResponse).toHaveText(dialogMessages.alertResponse);
    });
  });

  test(
    'accepting the JS confirm records Ok',
    { tag: ['@critical', '@regression'] },
    async ({ jsDialogsPage, step }) => {
      let dialogText = '';
      await step.when('the user triggers and accepts the JS confirm dialog', async () => {
        dialogText = await jsDialogsPage.triggerConfirm(true);
      });

      await step.then('the dialog text matched and the response is recorded as Ok', async () => {
        await expect(dialogText, 'confirm dialog text').toBe(dialogMessages.confirmDialogText);
        await expect(jsDialogsPage.dialogResponse).toHaveText(dialogMessages.confirmAcceptedResponse);
      });
    },
  );

  test('dismissing the JS confirm records Cancel', { tag: ['@regression'] }, async ({ jsDialogsPage, step }) => {
    await step.when('the user triggers and dismisses the JS confirm dialog', async () => {
      await jsDialogsPage.triggerConfirm(false);
    });

    await step.then('the response is recorded as Cancel', async () => {
      await expect(jsDialogsPage.dialogResponse).toHaveText(dialogMessages.confirmDismissedResponse);
    });
  });

  test(
    'submitting the JS prompt echoes the entered text',
    { tag: ['@regression'] },
    async ({ jsDialogsPage, step }) => {
      const inputText = 'Playwright automation';

      await step.when('the user triggers the JS prompt and enters text', async () => {
        await jsDialogsPage.triggerPrompt(inputText);
      });

      await step.then('the response echoes back the entered text', async () => {
        await expect(jsDialogsPage.dialogResponse).toHaveText(inputText);
      });
    },
  );

  test('cancelling the JS prompt clears the response', { tag: ['@regression'] }, async ({ jsDialogsPage, step }) => {
    await step.when('the user triggers the JS prompt and clicks Cancel', async () => {
      await jsDialogsPage.dismissPrompt();
    });

    await step.then('no response text is recorded', async () => {
      await expect(jsDialogsPage.dialogResponse, 'dialog response').toHaveText('');
    });
  });
});
