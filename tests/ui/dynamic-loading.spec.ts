import { test, expect } from '../../src/fixtures/base';

test.describe('Dynamic loading', () => {
  test(
    'Example 1: a hidden element is revealed once loading finishes',
    { tag: ['@critical', '@regression'] },
    async ({ dynamicLoadingPage, step }) => {
      await step.given('the user opens example 1 (element already on the page, but hidden)', async () => {
        await dynamicLoadingPage.gotoHiddenElementExample();
      });

      await step.when('the user clicks Start', async () => {
        await dynamicLoadingPage.clickStart();
      });

      await step.then('"Hello World!" becomes visible once loading completes', async () => {
        await expect(dynamicLoadingPage.finishedText, 'finished text').toBeVisible({ timeout: 10_000 });
      });
    },
  );

  test(
    'Example 2: an element that does not exist yet is added once loading finishes',
    { tag: ['@regression'] },
    async ({ dynamicLoadingPage, step }) => {
      await step.given('the user opens example 2 (element rendered after the fact)', async () => {
        await dynamicLoadingPage.gotoRenderedAfterExample();
      });

      await step.then('"Hello World!" is not in the page yet', async () => {
        await expect(dynamicLoadingPage.finishedText, 'finished text').toHaveCount(0);
      });

      await step.when('the user clicks Start', async () => {
        await dynamicLoadingPage.clickStart();
      });

      await step.then('"Hello World!" is added to the page and visible once loading completes', async () => {
        await expect(dynamicLoadingPage.finishedText, 'finished text').toBeVisible({ timeout: 10_000 });
      });
    },
  );
});
