import type { Page } from '@playwright/test';
import { runAction } from '../utils/step';
import { setPendingDescription } from '../utils/pendingNavigation';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Navigates to `path`, reported as its own named action (e.g. "Open login
   * page"). The actual step+screenshot capture happens once, in the single
   * wrapped page.goto() installed by fixtures/base.ts — this just gives
   * that call a friendly title instead of a generic "Navigate to <url>" one.
   */
  protected async gotoPath(path: string, description: string): Promise<void> {
    setPendingDescription(this.page, description);
    await this.page.goto(path);
  }

  /**
   * Reusable wrapper for a single user action (click, fill, selectOption, ...):
   * runs `actionFn`, then logs+screenshots a PASS row on success or a FAIL
   * row (with the error) on failure — always re-throwing so the test still
   * fails normally. Page object methods use this instead of calling
   * `.click()`/`.fill()` directly, wrapped in its own test.step() so the
   * extent-reporter picks it up nested under whichever Given/When/Then step
   * is currently running.
   */
  protected async perform<T>(description: string, actionFn: () => Promise<T>): Promise<T> {
    return runAction(description, actionFn, this.page);
  }
}
