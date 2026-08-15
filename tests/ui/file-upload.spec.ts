import * as path from 'path';
import { test, expect } from '../../src/fixtures/base';
import { uploadMessages } from '../../src/data/messages';

const uploadsDir = path.join(__dirname, '..', '..', 'test-data', 'uploads');

test.describe('File upload', () => {
  test.beforeEach(async ({ uploadPage, step }) => {
    await step.given('the user is on the file upload page', async () => {
      await uploadPage.goto();
    });
  });

  test(
    'uploads a valid file and shows a confirmation with the stored filename',
    { tag: ['@critical', '@regression'] },
    async ({ uploadPage, step }) => {
      await step.when('the user selects and uploads a valid file', async () => {
        await uploadPage.selectFile(path.join(uploadsDir, 'sample-upload.txt'));
        await uploadPage.submitUpload();
      });

      await step.then('an upload confirmation is shown with the original filename preserved', async () => {
        await expect(uploadPage.heading, 'File Uploaded! heading').toBeVisible();
        const storedName = await uploadPage.getUploadedFileName();
        expect(storedName).toContain('sample-upload.txt');
      });
    },
  );

  test.describe('Edge cases', () => {
    test('rejects a file larger than the 500KB limit', { tag: ['@regression'] }, async ({ uploadPage, page, step }) => {
      await step.when('the user selects and uploads an oversized file', async () => {
        await uploadPage.selectFile(path.join(uploadsDir, 'oversized-upload.txt'));
        await uploadPage.submitUpload();
      });

      await step.then('a file-too-large error is shown and the user stays on the upload page', async () => {
        await expect(uploadPage.flashMessage).toHaveText(uploadMessages.fileTooLarge);
        await expect(page).toHaveURL(/\/upload$/);
      });
    });
  });
});
