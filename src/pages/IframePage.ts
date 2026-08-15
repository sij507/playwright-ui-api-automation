import type { FrameLocator, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { describeValue } from '../utils/sanitize';

export class IframePage extends BasePage {
  /** The external YouTube embed — only ever checked for presence, never interacted with (cross-origin, not something this suite controls or should depend on). */
  readonly youtubeIframe: Locator;

  readonly richTextFrame: FrameLocator;
  readonly richTextBody: Locator;

  readonly emailInput: Locator;
  readonly subscribeButton: Locator;
  readonly subscribeSuccessMessage: Locator;
  readonly subscribeInvalidFeedback: Locator;

  constructor(page: Page) {
    super(page);
    this.youtubeIframe = page.locator('#iframe-youtube');

    // TinyMCE renders its own document inside this iframe.
    this.richTextFrame = page.frameLocator('#mce_0_ifr');
    this.richTextBody = this.richTextFrame.locator('body#tinymce');

    // Same-origin iframe (/iframe-email-subscribe) with its own Bootstrap
    // "needs-validation" form — same validation pattern as the standalone
    // Form Validation page, just embedded.
    const emailSubscribeFrame = page.frameLocator('#email-subscribe');
    this.emailInput = emailSubscribeFrame.locator('#email');
    this.subscribeButton = emailSubscribeFrame.locator('#btn-subscribe');
    this.subscribeSuccessMessage = emailSubscribeFrame.locator('#success-message');
    this.subscribeInvalidFeedback = emailSubscribeFrame.locator('.invalid-feedback');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/iframe', 'Open iframe page');
  }

  async getRichTextContent(): Promise<string> {
    return this.perform('Read rich text editor content', () => this.richTextBody.innerText());
  }

  /**
   * `false` when TinyMCE is genuinely read-only. Checked via the DOM
   * attribute rather than by clicking in and attempting to type: TinyMCE
   * itself renders a "read-only mode" tooltip overlay on interaction that
   * intercepts pointer events, so a click-based check would just be
   * asserting that the click failed — this reads the same underlying state
   * directly and deterministically instead.
   */
  async isRichTextEditable(): Promise<boolean> {
    return this.perform('Check whether the rich text editor is editable', async () => {
      const value = await this.richTextBody.getAttribute('contenteditable');
      return value === 'true';
    });
  }

  async enterSubscriptionEmail(email: string): Promise<void> {
    await this.perform(describeValue('Enter email in subscription iframe', email), () => this.emailInput.fill(email));
  }

  async clickSubscribe(): Promise<void> {
    await this.perform('Click Subscribe button in iframe', () => this.subscribeButton.click());
  }
}
