import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class JsDialogsPage extends BasePage {
  readonly alertButton: Locator;
  readonly confirmButton: Locator;
  readonly promptButton: Locator;
  readonly dialogResponse: Locator;

  constructor(page: Page) {
    super(page);
    this.alertButton = page.getByRole('button', { name: 'Js Alert' });
    this.confirmButton = page.getByRole('button', { name: 'Js Confirm' });
    this.promptButton = page.getByRole('button', { name: 'Js Prompt' });
    this.dialogResponse = page.locator('#dialog-response');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/js-dialogs', 'Open JavaScript dialogs page');
  }

  // A native alert()/confirm()/prompt() blocks the page's JS thread the
  // instant it opens, which in turn blocks Playwright's click() from
  // resolving until the dialog is handled. The listener must therefore be
  // registered with page.once('dialog', ...) *before* the click and handle
  // (accept/dismiss) the dialog synchronously inside that callback — an
  // `await page.waitForEvent('dialog')` awaited *after* click() deadlocks,
  // since click() never settles while the dialog is still open.
  async triggerAlert(): Promise<void> {
    await this.perform('Trigger and accept JS alert dialog', async () => {
      this.page.once('dialog', (dialog) => void dialog.accept());
      await this.alertButton.click();
    });
  }

  async triggerConfirm(accept: boolean): Promise<string> {
    let message = '';
    await this.perform(`Trigger JS confirm dialog and click ${accept ? 'Ok' : 'Cancel'}`, async () => {
      this.page.once('dialog', (dialog) => {
        message = dialog.message();
        void (accept ? dialog.accept() : dialog.dismiss());
      });
      await this.confirmButton.click();
    });
    return message;
  }

  async triggerPrompt(inputText: string): Promise<void> {
    await this.perform(`Trigger JS prompt dialog and enter "${inputText}"`, async () => {
      this.page.once('dialog', (dialog) => void dialog.accept(inputText));
      await this.promptButton.click();
    });
  }
}
