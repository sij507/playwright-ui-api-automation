import { randomUUID } from 'crypto';

// Generates test data that is unique per call so tests never collide on
// shared state (e.g. registering the same email twice) and can run in any
// order, in parallel, and repeatedly without manual cleanup between runs.
function uniqueSuffix(): string {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

export function uniqueEmail(prefix = 'qa'): string {
  return `${prefix}.${uniqueSuffix()}@expandtesting.com`;
}

export function uniqueName(prefix = 'QA User'): string {
  return `${prefix} ${uniqueSuffix()}`;
}

export function uniqueNoteTitle(prefix = 'Note'): string {
  return `${prefix} ${uniqueSuffix()}`;
}

// No spaces, unlike uniqueName() — for fields validated as a plain username.
export function uniqueUsername(prefix = 'qauser'): string {
  return `${prefix}${uniqueSuffix()}`;
}

export function strongPassword(): string {
  return `Test!${uniqueSuffix()}Aa1`;
}

export function repeatChar(char: string, length: number): string {
  return char.repeat(length);
}
