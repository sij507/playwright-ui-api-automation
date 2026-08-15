import { test, type Page } from '@playwright/test';
import { captureStep, captureStepFailure, truncate } from './screenshotRecorder';

/**
 * Shared action-level wrapper used by both BasePage.perform() (UI) and the
 * API clients (src/api/*): runs `actionFn` inside its own test.step() —
 * nested under whichever Given/When/Then step is currently active — then
 * logs+records a PASS or FAIL action row via screenshotRecorder. Passing a
 * `page` attaches a screenshot to the action; omitting it (API calls have no
 * browser page) records the action as a text-only row.
 */
export async function runAction<T>(
  description: string,
  actionFn: () => Promise<T>,
  page: Page | null = null,
): Promise<T> {
  const safeDescription = truncate(description);
  return test.step(safeDescription, async () => {
    try {
      const result = await actionFn();
      await captureStep(page, safeDescription);
      return result;
    } catch (error) {
      await captureStepFailure(page, safeDescription, error);
      throw error;
    }
  });
}
