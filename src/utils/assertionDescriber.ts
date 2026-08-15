import type { Locator, Page } from '@playwright/test';
import { formatAssertionValue } from './sanitize';

// Locator matchers that check a boolean UI state — phrased as "is <state>:
// true" on pass rather than a generic "expected/actual" pair.
const BOOLEAN_STATE_MATCHERS: Record<string, string> = {
  toBeVisible: 'visible',
  toBeHidden: 'hidden',
  toBeEnabled: 'enabled',
  toBeDisabled: 'disabled',
  toBeChecked: 'checked',
  toBeEditable: 'editable',
};

// Matchers that don't take a comparison argument — described by their own
// implied expected state rather than an "expected X" fragment.
const ZERO_ARG_MATCHER_LABELS: Record<string, string> = {
  toBeTruthy: 'truthy',
  toBeFalsy: 'falsy',
  toBeDefined: 'defined',
  toBeUndefined: 'undefined',
  toBeNull: 'null',
  toBeNaN: 'NaN',
};

// Sensible fallback labels for the field being checked when the test
// didn't supply its own via expect(value, 'label'). A caller-supplied label
// (e.g. 'status code', 'username') is always preferred when present.
const MATCHER_LABELS: Record<string, string> = {
  toBe: 'value',
  toEqual: 'value',
  toStrictEqual: 'value',
  toContain: 'value',
  toMatch: 'value',
  toBeGreaterThan: 'value',
  toBeGreaterThanOrEqual: 'value',
  toBeLessThan: 'value',
  toBeLessThanOrEqual: 'value',
  toHaveLength: 'length',
  toHaveURL: 'page URL',
  toHaveTitle: 'title',
  toHaveText: 'text',
  toContainText: 'text',
  toHaveValue: 'value',
  toHaveCount: 'count',
};

export function fallbackLabel(prop: string): string {
  if (MATCHER_LABELS[prop]) return MATCHER_LABELS[prop];
  const withoutTo = prop.replace(/^to/, '');
  const spaced = withoutTo
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase();
  return spaced || 'value';
}

function isPage(subject: unknown): subject is Page {
  if (!subject || typeof subject !== 'object') return false;
  const candidate = subject as { screenshot?: unknown; context?: unknown };
  return typeof candidate.screenshot === 'function' && typeof candidate.context === 'function';
}

function isLocator(subject: unknown): subject is Locator {
  if (!subject || typeof subject !== 'object' || isPage(subject)) return false;
  const candidate = subject as { page?: unknown };
  return typeof candidate.page === 'function';
}

// `toHaveURL`'s pattern argument is usually an anchored regex like
// /\/secure$/ — formatted as a bare "/secure" fragment (matching how a
// human would describe "the URL should contain /secure") rather than
// dumping the regex literal.
function formatUrlPattern(pattern: unknown): string {
  if (pattern instanceof RegExp) {
    return pattern.source.replace(/\\\//g, '/').replace(/^\^/, '').replace(/\$$/, '');
  }
  return formatAssertionValue(pattern);
}

// Best-effort, failure-safe live read used only on the FAIL path, to show a
// real "Actual" value for Locator/Page matchers where it isn't already
// known synchronously. Never throws — a detached/missing element shouldn't
// mask the assertion's own error with a second one.
async function safeRead(read: () => Promise<unknown>, fallback = '(unavailable)'): Promise<string> {
  try {
    return formatAssertionValue(await read());
  } catch {
    return fallback;
  }
}

/**
 * Concise, pass-path description: "Assert <label>: <value>" — the value
 * that satisfied the check, without repeating "expected"/"actual" when
 * they're identical (that's the whole point of the assertion passing).
 */
export function buildPassDescription(
  prop: string,
  args: unknown[],
  subject: unknown,
  label: string | undefined,
): string {
  const fieldLabel = label ?? fallbackLabel(prop);

  if (isPage(subject)) {
    if (prop === 'toHaveURL') return `Assert ${fieldLabel} contains: ${formatUrlPattern(args[0])}`;
    if (prop === 'toHaveTitle' && args.length) return `Assert ${fieldLabel}: ${formatAssertionValue(args[0])}`;
    return `Assert ${fieldLabel}`;
  }

  if (isLocator(subject)) {
    // "element" rather than fallbackLabel(prop) here specifically: the
    // state word (visible/enabled/checked/...) already appears in "is
    // <state>", so falling back to the *same* word as the subject label
    // would read as "Assert visible is visible: true".
    if (prop in BOOLEAN_STATE_MATCHERS) return `Assert ${label ?? 'element'} is ${BOOLEAN_STATE_MATCHERS[prop]}: true`;
    if (prop === 'toContainText') return `Assert ${fieldLabel} contains: ${formatAssertionValue(args[0])}`;
    if (args.length) return `Assert ${fieldLabel}: ${formatAssertionValue(args[0])}`;
    return `Assert ${fieldLabel}`;
  }

  // Plain-value subject (status codes, response body fields, counts,
  // booleans, ...): `subject` is exactly the value that satisfied the
  // check, whatever the matcher.
  if (prop === 'toContain' && args.length) return `Assert ${fieldLabel} contains: ${formatAssertionValue(args[0])}`;
  return `Assert ${fieldLabel}: ${formatAssertionValue(subject)}`;
}

/**
 * Detailed, fail-path description: "Assert <label> FAILED — Expected: <E>,
 * Actual: <A>" — the only place expected/actual are both spelled out, since
 * this is exactly when a reader needs them to debug the failure.
 */
export async function buildFailDescription(
  prop: string,
  args: unknown[],
  subject: unknown,
  label: string | undefined,
  negated: boolean,
): Promise<string> {
  const fieldLabel = label ?? fallbackLabel(prop);
  const not = negated ? 'NOT ' : '';

  if (isPage(subject)) {
    if (prop === 'toHaveURL') {
      return `Assert ${fieldLabel} FAILED — Expected to contain: ${not}${formatUrlPattern(args[0])}, Actual: ${formatAssertionValue(subject.url())}`;
    }
    if (prop === 'toHaveTitle' && args.length) {
      const actual = await safeRead(() => subject.title());
      return `Assert ${fieldLabel} FAILED — Expected: ${not}${formatAssertionValue(args[0])}, Actual: ${actual}`;
    }
    return `Assert ${fieldLabel} FAILED`;
  }

  if (isLocator(subject)) {
    // See the matching comment in buildPassDescription for why "element"
    // rather than fallbackLabel(prop) is the default here.
    if (prop in BOOLEAN_STATE_MATCHERS) {
      const expectedState = BOOLEAN_STATE_MATCHERS[prop];
      return `Assert ${label ?? 'element'} FAILED — Expected: ${not}${expectedState}, Actual: not ${expectedState}`;
    }
    if (prop === 'toHaveText' || prop === 'toContainText') {
      const actual = await safeRead(() => subject.textContent());
      const expectedLabel = prop === 'toContainText' ? 'Expected to contain' : 'Expected';
      return `Assert ${fieldLabel} FAILED — ${expectedLabel}: ${not}${formatAssertionValue(args[0])}, Actual: ${actual}`;
    }
    if (prop === 'toHaveValue') {
      const actual = await safeRead(() => subject.inputValue());
      return `Assert ${fieldLabel} FAILED — Expected: ${not}${formatAssertionValue(args[0])}, Actual: ${actual}`;
    }
    if (prop === 'toHaveCount') {
      const actual = await safeRead(() => subject.count());
      return `Assert ${fieldLabel} FAILED — Expected: ${not}${formatAssertionValue(args[0])}, Actual: ${actual}`;
    }
    if (args.length && typeof args[0] !== 'object') {
      return `Assert ${fieldLabel} FAILED — Expected: ${not}${formatAssertionValue(args[0])}`;
    }
    return `Assert ${fieldLabel} FAILED`;
  }

  // Plain-value subject: `subject` is always the actual value, known
  // synchronously regardless of outcome — no live read needed.
  if (prop === 'toContain' && args.length) {
    return `Assert ${fieldLabel} FAILED — Expected to contain: ${not}${formatAssertionValue(args[0])}, Actual: ${formatAssertionValue(subject)}`;
  }
  if (prop in ZERO_ARG_MATCHER_LABELS) {
    return `Assert ${fieldLabel} FAILED — Expected: ${not}${ZERO_ARG_MATCHER_LABELS[prop]}, Actual: ${formatAssertionValue(subject)}`;
  }
  if (args.length) {
    return `Assert ${fieldLabel} FAILED — Expected: ${not}${formatAssertionValue(args[0])}, Actual: ${formatAssertionValue(subject)}`;
  }
  return `Assert ${fieldLabel} FAILED — Actual: ${formatAssertionValue(subject)}`;
}
