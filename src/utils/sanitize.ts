/**
 * Centralized sensitive-data masking, used everywhere a value might reach a
 * console log line, the extent-report, or an error message: page-object
 * fill actions, API request/response logging, and assertion descriptions.
 * Nothing in this codebase should mask a password/token by hand — call
 * into this module instead.
 */

export const MASK = '********';

// Matched against field/header/key NAMES, case-insensitively, as a
// substring — so "confirmPassword", "x-auth-token", and "Authorization" all
// match without needing an exhaustive exact-name list.
const SENSITIVE_KEY_PATTERN =
  /password|passwd|pwd|token|secret|authorization|api[-_]?key|cookie|session|jwt|credential/i;

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

// Defense in depth for values whose field NAME isn't known at the log site
// (e.g. a generic `expect(someValue).toBe(x)` where someValue came from
// deep inside a response object): flags long, opaque, high-entropy-looking
// strings — JWTs and bearer-style tokens — so they still get masked even
// without a recognizable key name attached.
const JWT_PATTERN = /^[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/;
const OPAQUE_TOKEN_PATTERN = /^[A-Za-z0-9+/_=-]{32,}$/;

export function looksLikeSecretValue(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return JWT_PATTERN.test(value) || OPAQUE_TOKEN_PATTERN.test(value);
}

function stringifyValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/** Masks `value` if `key` names a known-sensitive field; otherwise formats it for a log line. */
export function formatFieldValue(key: string, value: unknown): string {
  if (isSensitiveKey(key)) return MASK;
  return stringifyValue(value);
}

/**
 * Builds a `"<label>: <value>"` action description, auto-masking the value
 * when `label` names a sensitive field.
 * `describeValue('Enter password', pw)` -> `"Enter password: ********"`.
 * `describeValue('Enter username', 'practice')` -> `"Enter username: practice"`.
 */
export function describeValue(label: string, value: unknown): string {
  return `${label}: ${formatFieldValue(label, value)}`;
}

/**
 * Recursively sanitizes an object's own sensitive keys (request/response
 * bodies, form data) before it reaches a log line, console output, or the
 * report. Non-object values pass through unchanged.
 */
export function sanitizeObject<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => sanitizeObject(item)) as unknown as T;
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = isSensitiveKey(key) ? MASK : sanitizeObject(val);
    }
    return result as T;
  }
  return value;
}

/** Alias of `sanitizeObject`, named for call-site clarity when sanitizing an API request body. */
export const sanitizeRequestBody = sanitizeObject;

/** General-purpose entry point for sanitizing arbitrary data before it reaches a log line, console output, or the report. */
export const sanitizeLogData = sanitizeObject;

/** Sanitizes an HTTP header map — masks `Authorization`, `x-auth-token`, `Cookie`, etc. by header name. */
export function sanitizeHeaders(headers: Record<string, string> | undefined): Record<string, string> {
  if (!headers) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = isSensitiveKey(key) ? MASK : value;
  }
  return result;
}

/**
 * Formats a value for an assertion log line (e.g. "Assert username:
 * testuser" or "Expected: testuser, Actual: admin") — unquoted, so a report
 * reads like plain English rather than a debugger dump. No field-name
 * context is available at this call site (the value has already been
 * pulled out of its containing object by the time it reaches an
 * assertion), so this relies on `looksLikeSecretValue` rather than key-name
 * matching to decide whether to mask it.
 */
export function formatAssertionValue(value: unknown): string {
  if (looksLikeSecretValue(value)) return MASK;
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (value instanceof RegExp) return value.source;
  if (typeof value === 'object') {
    try {
      return JSON.stringify(sanitizeObject(value));
    } catch {
      return String(value);
    }
  }
  return String(value);
}

// Self-contained (no cross-test-run state) pass over already-rendered error
// text — e.g. Playwright's own `expect(received).toBe(expected)` failure
// message, which embeds both compared values verbatim — to catch a
// token/JWT-shaped value that reached an error message some other way than
// through this module's own field-aware helpers above.
const JWT_TEXT_PATTERN = /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const OPAQUE_TOKEN_TEXT_PATTERN = /\b[A-Za-z0-9+/_=-]{32,}\b/g;

export function redactSecretLookingSubstrings(text: string | null | undefined): string | null {
  if (!text) return text ?? null;
  return text.replace(JWT_TEXT_PATTERN, MASK).replace(OPAQUE_TOKEN_TEXT_PATTERN, MASK);
}
