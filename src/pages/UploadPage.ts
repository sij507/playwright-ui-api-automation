import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class UploadPage extends BasePage {
  readonly fileInput: Locator;
  readonly uploadButton: Locator;
  readonly uploadedFiles: Locator;
  readonly flashMessage: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.fileInput = page.locator('#fileInput');
    this.uploadButton = page.getByRole('button', { name: 'Upload' });
    this.uploadedFiles = page.locator('#uploaded-files');
    this.flashMessage = page.locator('#flash');
    this.heading = page.getByRole('heading', { name: 'File Uploaded!' });
  }

  async goto(): Promise<void> {
    await this.gotoPath('/upload', 'Open file upload page');
  }

  async selectFile(filePath: string): Promise<void> {
    const fileName = filePath.split('/').pop();
    await this.perform(`Select file: ${fileName}`, () => this.fileInput.setInputFiles(filePath));
  }

  async submitUpload(): Promise<void> {
    await this.perform('Click Upload button', () => this.uploadButton.click());
  }

  /** Returns the server-stored filename (timestamp-prefixed) shown on the confirmation page. */
  async getUploadedFileName(): Promise<string> {
    return (await this.uploadedFiles.textContent())?.trim() ?? '';
  }
}
