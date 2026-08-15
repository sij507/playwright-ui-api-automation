import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '../../src/fixtures/base';

const uploadsDir = path.join(__dirname, '..', '..', 'test-data', 'uploads');
const downloadsDir = path.join(__dirname, '..', '..', 'test-data', 'downloads');

// End-to-end file workflow: a file is uploaded through the UI, the
// server-stored (timestamp-prefixed) filename it reports is then looked up
// on the download page and actually downloaded, and the downloaded bytes
// are compared back against the original source file — verifying the whole
// round trip rather than upload and download in isolation.
test.describe('File upload -> download round trip', () => {
  test(
    'a file uploaded through the UI can be found and downloaded, with matching content',
    { tag: ['@critical', '@regression'] },
    async ({ uploadPage, downloadPage, step }) => {
      const sourceFile = path.join(uploadsDir, 'sample-upload.txt');
      const originalContent = fs.readFileSync(sourceFile, 'utf-8');
      let storedFileName = '';

      await step.given('the user uploads a file', async () => {
        await uploadPage.goto();
        await uploadPage.selectFile(sourceFile);
        await uploadPage.submitUpload();
        storedFileName = await uploadPage.getUploadedFileName();
      });

      await step.when('the user opens the download page', async () => {
        await downloadPage.goto();
      });

      await step.then('the uploaded file is listed by its stored filename', async () => {
        await expect(downloadPage.downloadLink(storedFileName), 'download link').toBeVisible();
      });

      let downloadedPath = '';
      await step.and('the user downloads the file', async () => {
        const download = await downloadPage.downloadFile(storedFileName);
        downloadedPath = path.join(downloadsDir, download.suggestedFilename());
        await download.saveAs(downloadedPath);
      });

      await step.and('the downloaded file exists with the original content', async () => {
        await expect(fs.existsSync(downloadedPath), 'downloaded file exists').toBe(true);
        await expect(fs.readFileSync(downloadedPath, 'utf-8'), 'downloaded file content').toBe(originalContent);
      });
    },
  );
});
