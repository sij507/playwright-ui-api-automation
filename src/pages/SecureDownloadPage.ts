import { DownloadPage } from './DownloadPage';

/**
 * /download-secure is Basic Auth-gated (see `httpCredentials` in
 * playwright.config.ts, sourced from `env.basicAuthUsername/Password`) but
 * otherwise reuses the exact same file-list markup as the public /download
 * page — same data-testid links, same download mechanism — so this only
 * needs to override where it navigates to.
 */
export class SecureDownloadPage extends DownloadPage {
  async goto(): Promise<void> {
    await this.gotoPath('/download-secure', 'Open secure file download page');
  }
}
