import type { Page } from '@playwright/test';

// Lets BasePage.gotoPath() give the *single* wrapped page.goto() call (see
// fixtures/base.ts) a friendly action title (e.g. "Open login page")
// instead of falling back to a generic "Navigate to <url>" — without
// double-wrapping the navigation in two nested test.step()s.
const pendingDescriptions = new WeakMap<Page, string>();

export function setPendingDescription(page: Page, description: string): void {
  pendingDescriptions.set(page, description);
}

export function takePendingDescription(page: Page): string | undefined {
  const description = pendingDescriptions.get(page);
  pendingDescriptions.delete(page);
  return description;
}
