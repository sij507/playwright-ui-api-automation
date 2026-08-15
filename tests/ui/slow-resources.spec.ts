import { test, expect } from '../../src/fixtures/base';

test.describe('Slow resources', () => {
  test(
    'the page shows progress and then confirms the slow task finished',
    { tag: ['@regression'] },
    async ({ slowResourcesPage, step }) => {
      await step.given('the user opens the slow resources page', async () => {
        await slowResourcesPage.goto();
      });

      await step.then('a progress message is shown while the task is in flight', async () => {
        await expect(slowResourcesPage.progressMessage, 'progress message').toContainText('will finish in');
      });

      await step.then('the finished message eventually appears — waited for, not slept for', async () => {
        // Condition-based wait (Playwright's own auto-retrying assertion),
        // not waitForTimeout(): the resource genuinely takes up to ~10s, and
        // this resolves the moment it actually completes rather than
        // sleeping a fixed guess either way.
        await expect(slowResourcesPage.finishedMessage, 'finished message').toBeVisible({ timeout: 15_000 });
      });
    },
  );
});
