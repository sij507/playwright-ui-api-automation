import { defineConfig, devices } from '@playwright/test';
import { env } from './src/data/env';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: env.isCI,
  // Retries hide flakiness rather than fixing it — kept at 1 in CI only to
  // absorb rare third-party network blips against the live practice site,
  // never used locally where a flaky test should fail loudly and get fixed.
  retries: env.isCI ? 1 : 0,
  workers: env.isCI ? 2 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  reporter: [
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['./src/reporters/extent-reporter.ts', { outputDir: 'extent-report' }],
  ],
  use: {
    baseURL: env.uiBaseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    // tests/api/** never touches a browser (only `request`), so it only
    // needs to run once — under chromium — instead of tripling API test
    // time for no added coverage. tests/ui/** and tests/e2e/** run on all
    // three browsers.
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: /tests\/api\// },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: /tests\/api\// },
  ],
});
