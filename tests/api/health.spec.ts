import { test, expect } from '../../src/fixtures/base';

test.describe('Health check API', () => {
  test(
    'reports the Notes API as healthy',
    { tag: ['@smoke', '@critical', '@regression'] },
    async ({ healthApi, step }) => {
      let result: Awaited<ReturnType<typeof healthApi.check>>;

      await step.when('the client calls GET /health-check', async () => {
        result = await healthApi.check();
      });

      await step.then('the response confirms the service is healthy', async () => {
        await expect(result.status, 'status code').toBe(200);
        await expect(result.body.success, 'response success flag').toBe(true);
      });
    },
  );
});
