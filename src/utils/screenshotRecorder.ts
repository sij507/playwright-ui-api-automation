import { test, type Page } from '@playwright/test';
import { logStep } from './stepLogger';
import { redactSecretLookingSubstrings } from './sanitize';

// testId -> next step number. Deliberately never cleared: testId is unique
// per test, so a new test always starts at a fresh (unset) counter anyway.
const stepCounters = new Map<string, number>();

// Descriptions can embed arbitrary test data (e.g. a generated 500-char
// input value, or a multi-field sanitized request body) — truncated so a
// single console log line, and the action's title in the extent report,
// never balloon to match. 200 chars comfortably fits a masked multi-field
// request body (e.g. name+email+password) without cutting into — or worse,
// cutting *off before* — the "********" mask marker itself.
export function truncate(text: unknown, maxLength = 200): string {
  const str = String(text);
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
}

function nextStepNumber(testId: string): number {
  const stepNumber = (stepCounters.get(testId) || 0) + 1;
  stepCounters.set(testId, stepNumber);
  return stepNumber;
}

/**
 * Records a passed action: prints a `STEP N - description - PASS` console
 * line, attaches `description` as the row's displayed text (see "detail
 * attachment" note below), and, when `page` is provided (UI actions only —
 * API actions have no browser page), attaches a full-page screenshot too.
 * The reporter decides which of a step's action screenshots to actually
 * render (only the last one per parent step), so every action captures its
 * own here.
 *
 * Why a "detail" attachment at all, instead of just using the test.step()
 * title the caller already chose: Playwright requires that title *before*
 * the step's body runs, but an assertion's concise pass-path text ("Assert
 * status code: 200") and verbose fail-path text ("Assert status code
 * FAILED — Expected: 200, Actual: 500") aren't known until *after* it
 * resolves. Attaching the final text here lets extent-reporter.ts prefer it
 * over the (necessarily generic) upfront title when building each row.
 */
export async function captureStep(page: Page | null, description: string): Promise<void> {
  const testInfo = test.info();
  const stepNumber = nextStepNumber(testInfo.testId);
  const safeDescription = truncate(description);

  logStep({
    testId: testInfo.testId,
    testName: testInfo.title,
    stepNumber,
    description: safeDescription,
    status: 'PASS',
  });

  await testInfo.attach('detail', { body: description, contentType: 'text/plain' });

  if (page) {
    try {
      // JPEG at quality 40 instead of lossless PNG: with one embedded
      // base64 screenshot per scenario step, a regression suite of even a
      // few dozen tests balloons a self-contained report to tens of MB as
      // PNG (each full-page capture routinely 200-400KB) — impractical to
      // open, email, or upload as one file. Quality 40 stays clearly legible
      // at the report's thumbnail/lightbox sizes (all a screenshot here
      // needs to support) while cutting file size meaningfully further than
      // higher quality settings — diminishing returns start well before 60.
      const screenshot = await page.screenshot({ fullPage: true, type: 'jpeg', quality: 40 });
      await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/jpeg' });
    } catch {
      // Page may already be closed/navigating away; the action's own
      // pass/fail state is still reported without a screenshot.
    }
  }
}

/**
 * Records a failed action (that threw): same step numbering/console line as
 * captureStep, but status FAIL with the error message, and still attaches a
 * screenshot when a page is available so failures are visually inspectable
 * in the report. Never throws itself — the caller re-throws the original
 * error after calling this.
 *
 * The error text is redacted (see sanitize.ts) before it ever reaches the
 * console — this is on top of, not instead of, callers that already pass a
 * pre-sanitized message (redacting twice is a no-op).
 */
export async function captureStepFailure(page: Page | null, description: string, error: unknown): Promise<void> {
  const testInfo = test.info();
  const stepNumber = nextStepNumber(testInfo.testId);
  const safeDescription = truncate(description);
  const rawMessage = error instanceof Error ? error.message : String(error);

  logStep({
    testId: testInfo.testId,
    testName: testInfo.title,
    stepNumber,
    description: safeDescription,
    status: 'FAIL',
    error: redactSecretLookingSubstrings(rawMessage) ?? rawMessage,
  });

  await testInfo.attach('detail', { body: description, contentType: 'text/plain' });

  if (page) {
    try {
      // JPEG at quality 40 instead of lossless PNG: with one embedded
      // base64 screenshot per scenario step, a regression suite of even a
      // few dozen tests balloons a self-contained report to tens of MB as
      // PNG (each full-page capture routinely 200-400KB) — impractical to
      // open, email, or upload as one file. Quality 40 stays clearly legible
      // at the report's thumbnail/lightbox sizes (all a screenshot here
      // needs to support) while cutting file size meaningfully further than
      // higher quality settings — diminishing returns start well before 60.
      const screenshot = await page.screenshot({ fullPage: true, type: 'jpeg', quality: 40 });
      await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/jpeg' });
    } catch {
      // Page may already be closed/navigating away.
    }
  }
}
