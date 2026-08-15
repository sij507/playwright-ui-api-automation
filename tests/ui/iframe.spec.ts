import { test, expect } from '../../src/fixtures/base';
import { uniqueEmail } from '../../src/utils/dataGenerator';

test.describe('IFrame', () => {
  test.beforeEach(async ({ iframePage, step }) => {
    await step.given('the user is on the iframe page', async () => {
      await iframePage.goto();
    });
  });

  test('the external YouTube iframe is present', { tag: ['@regression'] }, async ({ iframePage, step }) => {
    await step.then('the YouTube video player iframe is visible and points at YouTube', async () => {
      await expect(iframePage.youtubeIframe, 'YouTube iframe visible').toBeVisible();
      await expect(iframePage.youtubeIframe, 'YouTube iframe src').toHaveAttribute('src', /youtube\.com/);
    });
  });

  test('the rich text editor iframe stays read-only', { tag: ['@regression'] }, async ({ iframePage, step }) => {
    await step.then('the default content is shown', async () => {
      const content = await iframePage.getRichTextContent();
      await expect(content, 'rich text content').toBe('Your content goes here.');
    });

    await step.and('the editor is not editable', async () => {
      await expect(await iframePage.isRichTextEditable(), 'rich text editor is editable').toBe(false);
    });
  });

  test.describe('Internal iframe: Email Subscription', () => {
    test(
      'subscribing with a valid email shows a success message',
      { tag: ['@critical', '@regression'] },
      async ({ iframePage, step }) => {
        const email = uniqueEmail();

        await step.when('the user subscribes with a valid email', async () => {
          await iframePage.enterSubscriptionEmail(email);
          await iframePage.clickSubscribe();
        });

        await step.then('a success message appears inside the iframe', async () => {
          await expect(iframePage.subscribeSuccessMessage, 'subscription success message').toHaveText(
            'You are now subscribed!',
          );
        });
      },
    );

    test.describe('Negative', () => {
      test(
        'submitting without an email shows a validation error',
        { tag: ['@regression'] },
        async ({ iframePage, step }) => {
          await step.when('the user submits the subscription form with no email', async () => {
            await iframePage.clickSubscribe();
          });

          await step.then('a validation error is shown and no success message appears', async () => {
            await expect(iframePage.subscribeInvalidFeedback, 'email validation error').toBeVisible();
            await expect(iframePage.subscribeSuccessMessage, 'subscription success message').toBeHidden();
          });
        },
      );
    });
  });
});
