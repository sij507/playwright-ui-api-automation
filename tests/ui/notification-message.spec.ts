import { test, expect } from '../../src/fixtures/base';
import { possibleNotificationMessages } from '../../src/data/messages';

test.describe('Notification message', () => {
  test(
    'shows one of the known randomized notification messages on every reload',
    { tag: ['@regression'] },
    async ({ notificationMessagePage, step }) => {
      await step.given('the user is on the notification message page', async () => {
        await notificationMessagePage.goto();
      });

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        await step.when(`the user reloads the message (attempt ${attempt})`, async () => {
          await notificationMessagePage.reload();
        });

        await step.then('the displayed message is one of the two known values', async () => {
          const message = await notificationMessagePage.getMessage();
          expect(possibleNotificationMessages).toContain(message);
        });
      }
    },
  );
});
