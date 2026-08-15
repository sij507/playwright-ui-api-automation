import type { Page } from '@playwright/test';

// The practice site is ad-supported: third-party ad iframes intermittently
// overlay interactive elements (intercepting real clicks) and ad/analytics
// scripts can keep the network busy past Playwright's "load" wait. Neither
// is part of the application under test, so blocking these domains removes
// a source of flakiness that has nothing to do with the features being
// verified — the same call a QA engineer would make for any ad-supported
// site under test.
const BLOCKED_HOST_FRAGMENTS = [
  'googlesyndication.com',
  'doubleclick.net',
  'google-analytics.com',
  'googletagmanager.com',
  'googleadservices.com',
  'adservice.google.com',
  'fundingchoicesmessages.google.com',
  'pagead2.googlesyndication.com',
  'buymeacoffee.com',
];

export async function blockAdsAndTrackers(page: Page): Promise<void> {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (BLOCKED_HOST_FRAGMENTS.some((fragment) => url.includes(fragment))) {
      return route.abort();
    }
    return route.continue();
  });
}
