import { expect as baseExpect, test as pwTest, type Locator, type Page } from '@playwright/test';
import { test as apiTest } from './api.fixtures';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { SecureAreaPage } from '../pages/SecureAreaPage';
import { UploadPage } from '../pages/UploadPage';
import { DownloadPage } from '../pages/DownloadPage';
import { DynamicTablePage } from '../pages/DynamicTablePage';
import { NotificationMessagePage } from '../pages/NotificationMessagePage';
import { JsDialogsPage } from '../pages/JsDialogsPage';
import { RedirectorPage } from '../pages/RedirectorPage';
import { NotesLoginPage } from '../pages/notes-app/NotesLoginPage';
import { NotesListPage } from '../pages/notes-app/NotesListPage';
import { captureStep, captureStepFailure } from '../utils/screenshotRecorder';
import { takePendingDescription } from '../utils/pendingNavigation';
import { blockAdsAndTrackers } from '../utils/adBlocker';
import { buildFailDescription, buildPassDescription, fallbackLabel } from '../utils/assertionDescriber';
import { redactSecretLookingSubstrings } from '../utils/sanitize';

type StepAction = () => Promise<void> | void;

export interface StepFn {
  (title: string, action: StepAction): Promise<void>;
  given(title: string, action: StepAction): Promise<void>;
  when(title: string, action: StepAction): Promise<void>;
  then(title: string, action: StepAction): Promise<void>;
  and(title: string, action: StepAction): Promise<void>;
  but(title: string, action: StepAction): Promise<void>;
}

export interface UiFixtures {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  secureAreaPage: SecureAreaPage;
  uploadPage: UploadPage;
  downloadPage: DownloadPage;
  dynamicTablePage: DynamicTablePage;
  notificationMessagePage: NotificationMessagePage;
  jsDialogsPage: JsDialogsPage;
  redirectorPage: RedirectorPage;
  notesLoginPage: NotesLoginPage;
  notesListPage: NotesListPage;
  /** BDD-style step wrapper for the extent-report: step(title, fn) / step.given|when|then|and|but(title, fn). */
  step: StepFn;
}

// Tracks the live `page` for whichever test is currently running, keyed by
// testId, so the wrapped `expect` below can screenshot a UI verification
// even when the assertion subject isn't a Page/Locator (e.g. a plain
// array). Left unset for API-only tests, which never touch the `page`
// fixture — the wrapped expect then correctly records no screenshot.
const activePages = new Map<string, Page>();

async function captureAction<T>(page: Page, description: string, actionFn: () => Promise<T>): Promise<T> {
  return pwTest.step(description, async () => {
    try {
      const result = await actionFn();
      await captureStep(page, description);
      return result;
    } catch (error) {
      await captureStepFailure(page, description, error);
      throw error;
    }
  });
}

// Wraps page.goto/reload once per test (instance-scoped, no global
// prototype patching) so navigation taken outside a page object's
// gotoPath() (e.g. a test calling page.goto() directly) is still captured
// as its own action-level step.
function withNavigationCapture(page: Page): Page {
  const originalGoto = page.goto.bind(page);
  page.goto = (async (...args: Parameters<Page['goto']>) => {
    const description = takePendingDescription(page) ?? `Navigate to ${args[0]}`;
    return captureAction(page, description, () => originalGoto(...args));
  }) as Page['goto'];

  const originalReload = page.reload.bind(page);
  page.reload = (async (...args: Parameters<Page['reload']>) => {
    return captureAction(page, `Reload ${page.url()}`, () => originalReload(...args));
  }) as Page['reload'];

  return page;
}

function resolvePageForScreenshot(testId: string, subject: unknown): Page | null {
  if (!subject) return activePages.get(testId) || null;
  const candidate = subject as { screenshot?: unknown; context?: unknown; page?: unknown };
  if (typeof candidate.screenshot === 'function' && typeof candidate.context === 'function') {
    return subject as Page;
  }
  if (typeof candidate.page === 'function') {
    try {
      return (subject as Locator).page();
    } catch {
      // fall through
    }
  }
  return activePages.get(testId) || null;
}

export const test = apiTest.extend<UiFixtures>({
  page: async ({ page }, use, testInfo) => {
    await blockAdsAndTrackers(page);
    withNavigationCapture(page);
    activePages.set(testInfo.testId, page);
    await use(page);
  },

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  secureAreaPage: async ({ page }, use) => use(new SecureAreaPage(page)),
  uploadPage: async ({ page }, use) => use(new UploadPage(page)),
  downloadPage: async ({ page }, use) => use(new DownloadPage(page)),
  dynamicTablePage: async ({ page }, use) => use(new DynamicTablePage(page)),
  notificationMessagePage: async ({ page }, use) => use(new NotificationMessagePage(page)),
  jsDialogsPage: async ({ page }, use) => use(new JsDialogsPage(page)),
  redirectorPage: async ({ page }, use) => use(new RedirectorPage(page)),
  notesLoginPage: async ({ page }, use) => use(new NotesLoginPage(page)),
  notesListPage: async ({ page }, use) => use(new NotesListPage(page)),

  // eslint-disable-next-line no-empty-pattern -- Playwright fixture DI requires a destructured first param even when unused.
  step: async ({}, use) => {
    const runStep = (title: string, action: StepAction) => pwTest.step(title, async () => void (await action()));

    const step = ((title: string, action: StepAction) => runStep(title, action)) as StepFn;
    step.given = (title, action) => runStep(`Given ${title}`, action);
    step.when = (title, action) => runStep(`When ${title}`, action);
    step.then = (title, action) => runStep(`Then ${title}`, action);
    step.and = (title, action) => runStep(`And ${title}`, action);
    step.but = (title, action) => runStep(`But ${title}`, action);

    await use(step);
  },
});

function extractLabel(messageArg: unknown): string | undefined {
  if (typeof messageArg === 'string') return messageArg;
  if (messageArg && typeof messageArg === 'object' && 'message' in messageArg) {
    const message = (messageArg as { message?: unknown }).message;
    return typeof message === 'string' ? message : undefined;
  }
  return undefined;
}

// Wraps every matcher call (toHaveText, toBeVisible, toHaveURL, status
// assertions, ...) so it's reported as its own action-level step, described
// two different ways depending on outcome: a concise "Assert <label>:
// <value>" on pass (expected and actual are the same thing at that point,
// so showing both would just be noise), or a detailed "Assert <label>
// FAILED — Expected: <E>, Actual: <A>" on fail (exactly when a reader needs
// both to debug it). The step's own test.step() title — fixed before the
// outcome is known — stays a plain "Assert <label>" placeholder; the
// pass/fail-specific text is attached separately (see captureStep's
// comment) and is what the report actually renders.
// `expect(value, 'status code')` supplies the field label used in place of
// a generic matcher-derived one; UI subjects also get a screenshot
// attached, API/plain-value subjects don't. Tests only ever import
// `expect` from here, never call page.screenshot() themselves.
function wrapAssertion<T extends object>(
  assertion: T,
  testId: string,
  subject: unknown,
  label: string | undefined,
  negated: boolean,
): T {
  return new Proxy(assertion, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === 'not') return wrapAssertion(value as object, testId, subject, label, !negated);
      if (typeof prop !== 'string' || typeof value !== 'function') return value;

      return async (...args: unknown[]) => {
        const page = resolvePageForScreenshot(testId, subject);
        const title = `Assert ${label ?? fallbackLabel(prop)}`;
        return pwTest.step(title, async () => {
          try {
            const result = await (value as (...a: unknown[]) => unknown).apply(target, args);
            const description = buildPassDescription(prop, args, subject, label);
            await captureStep(page, description);
            return result;
          } catch (error) {
            const description = await buildFailDescription(prop, args, subject, label, negated);
            const rawMessage = error instanceof Error ? error.message : String(error);
            const sanitizedMessage = redactSecretLookingSubstrings(rawMessage) ?? rawMessage;
            await captureStepFailure(page, description, sanitizedMessage);
            throw error; // rethrow the original so Playwright's own trace/step.error keep full fidelity
          }
        });
      };
    },
  }) as T;
}

export const expect = new Proxy(baseExpect, {
  apply(target, thisArg, args: unknown[]) {
    const assertion = Reflect.apply(target as (...a: unknown[]) => object, thisArg, args);
    const testId = pwTest.info().testId;
    const label = extractLabel(args[1]);
    return wrapAssertion(assertion, testId, args[0], label, false);
  },
}) as typeof baseExpect;
