// Prints one line per action to stdout — visible directly in a local
// terminal run and in the CircleCI job's step output, with no extra CI
// wiring needed.

const announcedTests = new Set<string>();

// Only reshapes raw identifier-style descriptions (e.g. an auto-generated
// "Verify_toHaveURL"). Descriptions page objects/API clients already write
// as plain phrases are left untouched, so an underscore inside an actual
// value (e.g. a generated email) never gets mangled.
export function humanize(description: string): string {
  const text = String(description);
  if (/\s/.test(text)) return text;

  return text
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function timestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export interface LogStepArgs {
  testId: string;
  testName: string;
  stepNumber: number;
  description: string;
  status: 'PASS' | 'FAIL';
  error?: string;
}

export function logStep({ testId, testName, stepNumber, description, status, error }: LogStepArgs): void {
  if (!announcedTests.has(testId)) {
    announcedTests.add(testId);
    console.log(`\n[Test: ${testName}]`);
  }

  console.log(`[${timestamp()}] STEP ${stepNumber} - ${humanize(description)} - ${status}`);

  if (status === 'FAIL' && error) {
    console.log(`  ↳ ${error}`);
  }
}
