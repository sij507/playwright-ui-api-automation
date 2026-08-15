import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '../../src/fixtures/base';
import { env } from '../../src/data/env';

const downloadsDir = path.join(__dirname, '..', '..', 'test-data', 'downloads');

// Unlike the shared, ever-growing upload list also present on this page,
// these files are documented on the page itself as always available and
// never deleted — a deterministic file to assert against, instead of
// picking an arbitrary one the way tests/ui/file-download.spec.ts does for
// the public (non-authenticated) download page.
const STABLE_FILE = 'some-file.txt';

test.describe('Secure file download', () => {
  test(
    'downloads a stable, always-available file successfully',
    { tag: ['@critical', '@regression'] },
    async ({ secureDownloadPage, step }) => {
      await step.given('the user is on the secure file download page', async () => {
        await secureDownloadPage.goto();
      });

      await step.then('the stable file is listed on the page', async () => {
        await expect(await secureDownloadPage.isFileListed(STABLE_FILE), 'file is listed').toBe(true);
      });

      let downloadedPath = '';
      await step.when('the user downloads it', async () => {
        const download = await secureDownloadPage.downloadFile(STABLE_FILE);
        downloadedPath = path.join(downloadsDir, download.suggestedFilename());
        await download.saveAs(downloadedPath);
      });

      await step.then('the downloaded file exists locally with real content', async () => {
        await expect(fs.existsSync(downloadedPath), 'downloaded file exists').toBe(true);
        await expect(fs.statSync(downloadedPath).size, 'downloaded file size in bytes').toBeGreaterThan(0);
      });
    },
  );
});

// A separate top-level describe (no `page`-navigating beforeEach to inherit)
// since this check only ever needs a plain request context, never a browser
// page.
test.describe('Secure file download: Negative', () => {
  test(
    'requesting the page without credentials is rejected',
    { tag: ['@regression'] },
    async ({ playwright, step }) => {
      // A dedicated, credential-less request context. `httpCredentials`
      // must be overridden to `undefined` explicitly here: a request
      // context created via `playwright.request.newContext()` during a test
      // run otherwise silently inherits the project's `use.httpCredentials`
      // (see playwright.config.ts) as its default, which would defeat the
      // whole point of this test — verified directly against this project's
      // config before writing it this way.
      const anonymousContext = await playwright.request.newContext({
        baseURL: env.uiBaseUrl,
        httpCredentials: undefined,
      });

      let status: number | undefined;
      await step.when('an unauthenticated request is made for the page', async () => {
        const response = await anonymousContext.get('/download-secure');
        status = response.status();
      });

      await step.then('the server rejects it as unauthorized', async () => {
        await expect(status, 'status code').toBe(401);
      });

      await anonymousContext.dispose();
    },
  );
});
