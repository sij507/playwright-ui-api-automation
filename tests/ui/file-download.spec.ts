import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '../../src/fixtures/base';

const downloadsDir = path.join(__dirname, '..', '..', 'test-data', 'downloads');

// The download page lists every file any visitor has ever uploaded — a
// shared, ever-growing list, not something this suite owns or resets.
// These tests exercise the File Downloader feature on its own terms
// (downloading a file nobody in this run uploaded); the full upload -> then
// -> download round trip with byte-for-byte content verification lives in
// tests/e2e/file-upload-download.spec.ts, where the framework controls the
// file's content and can actually verify it.
test.describe('File downloader', () => {
  test.beforeEach(async ({ downloadPage, step }) => {
    await step.given('the user is on the file download page', async () => {
      await downloadPage.goto();
    });
  });

  test(
    'downloads an already-listed file successfully',
    { tag: ['@critical', '@regression'] },
    async ({ downloadPage, step }) => {
      let fileName = '';

      await step.when('the user reads the list of downloadable files', async () => {
        const files = await downloadPage.listedFileNames();
        await expect(files.length, 'number of listed files').toBeGreaterThan(0);
        fileName = files[0];
      });

      await step.then('the chosen file is listed on the page', async () => {
        await expect(await downloadPage.isFileListed(fileName), 'file is listed').toBe(true);
      });

      let downloadedPath = '';
      await step.and('the user downloads it', async () => {
        const download = await downloadPage.downloadFile(fileName);
        downloadedPath = path.join(downloadsDir, download.suggestedFilename());
        await download.saveAs(downloadedPath);
      });

      await step.and('the downloaded file exists locally with real content', async () => {
        await expect(fs.existsSync(downloadedPath), 'downloaded file exists').toBe(true);
        await expect(fs.statSync(downloadedPath).size, 'downloaded file size in bytes').toBeGreaterThan(0);
      });
    },
  );

  test.describe('Negative', () => {
    test(
      'requesting a file that was never uploaded returns a 404',
      { tag: ['@regression'] },
      async ({ page, step }) => {
        let status: number | undefined;

        await step.when('the user requests a download link for a file that does not exist', async () => {
          const response = await page.goto('/download/this-file-does-not-exist-xyz.txt');
          status = response?.status();
        });

        await step.then('the server responds with 404', async () => {
          await expect(status, 'status code').toBe(404);
        });
      },
    );
  });
});
