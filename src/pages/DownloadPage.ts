import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DownloadPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.gotoPath('/download', 'Open file download page');
  }

  /** Each download link is tagged data-testid="<storedFileName>" — a stable, style-independent locator. */
  downloadLink(storedFileName: string): Locator {
    return this.page.getByTestId(storedFileName);
  }

  async isFileListed(storedFileName: string): Promise<boolean> {
    return this.perform(`Verify "${storedFileName}" is listed on the download page`, () =>
      this.downloadLink(storedFileName).isVisible(),
    );
  }

  async downloadFile(storedFileName: string) {
    return this.perform(`Download file: ${storedFileName}`, async () => {
      // A generous explicit timeout here (rather than relying on the
      // default action timeout): WebKit in particular can be slow to fire
      // the download event under heavy local parallel load, and this is a
      // real network round trip against the live practice site, not a
      // local UI action.
      const [download] = await Promise.all([
        this.page.waitForEvent('download', { timeout: 20_000 }),
        this.downloadLink(storedFileName).click(),
      ]);
      return download;
    });
  }
}
