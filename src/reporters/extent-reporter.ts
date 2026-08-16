import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { Reporter, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
// Resolved at build time (tsconfig has resolveJsonModule: true) rather than
// via a runtime require() — @playwright/test is a direct devDependency, so
// this is guaranteed to resolve; no try/catch fallback needed.
import { version as installedPlaywrightVersion } from '@playwright/test/package.json';
import {
  renderReportHtml,
  type ReportArtifact,
  type ReportModel,
  type ReportProjectSummary,
  type ReportRow,
  type ReportTestEntry,
} from './extentReportHtml';
import { humanize } from '../utils/stepLogger';
import { redactSecretLookingSubstrings } from '../utils/sanitize';

const BDD_KEYWORD_RE = /^(Given|When|Then|And|But)\b\s*/;

function splitBddKeyword(title: string): { keyword: string | null; text: string } {
  const match = title.match(BDD_KEYWORD_RE);
  if (!match) return { keyword: null, text: title };
  return { keyword: match[1], text: title.slice(match[0].length) };
}

// Playwright formats step/matcher errors with ANSI color codes for terminal
// output; strip them so they don't show up as literal "[2m", "[39m", etc.
// in the HTML report.
function stripAnsi(str: string | undefined | null): string | null {
  if (!str) return str ?? null;
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// testInfo.attach() calls made inside a test.step() don't append to that
// step's own `.attachments` — Playwright records each attach() as its own
// child step (category 'test.attach') nested under the step that was active
// when it ran. So a step's screenshot lives on a direct 'test.attach' child,
// not on the step itself.
function directAttachments(step: TestStep): TestResult['attachments'] {
  const acc: TestResult['attachments'] = [];
  for (const child of step.steps || []) {
    if (child.category === 'test.attach' && child.attachments) acc.push(...child.attachments);
  }
  return acc;
}

function imageToDataUri(image: TestResult['attachments'][number] | undefined): string | null {
  if (!image) return null;
  let buffer = image.body;
  if (!buffer && image.path) {
    try {
      buffer = fs.readFileSync(image.path);
    } catch {
      return null;
    }
  }
  if (!buffer) return null;
  return `data:${image.contentType};base64,${buffer.toString('base64')}`;
}

function extractScreenshot(step: TestStep): string | null {
  const image = directAttachments(step).find((a) => a.contentType && a.contentType.startsWith('image/'));
  return imageToDataUri(image);
}

// screenshotRecorder.ts's captureStep/captureStepFailure attach the row's
// final display text here (name 'detail') — see the long comment on
// captureStep for why: an assertion's text differs between its concise
// pass-path form and its verbose fail-path form, neither of which is known
// yet when test.step()'s own title has to be chosen.
function extractDetailText(step: TestStep): string | null {
  const attachment = directAttachments(step).find((a) => a.name === 'detail' && a.contentType === 'text/plain');
  if (!attachment?.body) return null;
  return attachment.body.toString('utf-8');
}

// Fallback for a rare edge case: when a step's testInfo.attach() call is the
// very last thing to happen before the test body returns, Playwright hadn't
// yet folded the resulting attachment into the step tree by the time that
// step's own onStepEnd fired. TestResult's flat attachment list *is*
// complete by onTestEnd, so this runs as a second pass there, matching back
// by name (captureStep names each attachment "<NN>. <description>", and
// <description> is always exactly the step's title); prefer the highest
// step number if more than one same-titled step lost its attachment.
function fillOrphanedScreenshots(row: ReportTestEntry, resultAttachments: TestResult['attachments']): void {
  if (!resultAttachments || !resultAttachments.length) return;
  for (const step of row.steps) {
    if (step.screenshot) continue;
    const suffix = `. ${step.title}`;
    const candidates = resultAttachments
      .filter((a) => a.contentType && a.contentType.startsWith('image/') && a.name.endsWith(suffix))
      .map((a) => ({ attachment: a, stepNumber: parseInt(a.name, 10) }))
      .filter((c) => !Number.isNaN(c.stepNumber))
      .sort((a, b) => b.stepNumber - a.stepNumber);
    if (candidates.length) step.screenshot = imageToDataUri(candidates[0].attachment);
  }
}

// When an action throws, Playwright doesn't just record the error on that
// action's own TestStep — the exception also propagates through every
// ancestor test.step() callback, so each ancestor's TestStep ends up with
// the *same* .error too. Walk the (already depth-ordered) row list and clear
// a row's error text only when a descendant of its own already carries an
// error — i.e. only when the failure is genuinely duplicated. Status
// ('fail') is untouched — only the error message/stack text is deduplicated.
function suppressDuplicateAncestorErrors(steps: ReportRow[]): void {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step.errorMessage) continue;

    let descendantHasError = false;
    for (let j = i + 1; j < steps.length && steps[j].depth > step.depth; j++) {
      if (steps[j].errorMessage) {
        descendantHasError = true;
        break;
      }
    }
    if (descendantHasError) {
      step.errorMessage = null;
      step.errorStack = null;
    }
  }
}

// Screenshots must only ever appear on the last action executed inside each
// parent (depth 0) step — never on the parent step itself, and never on
// more than one action within it (whether that last action passed or
// failed). Every action still captures its own screenshot when it runs (see
// screenshotRecorder.ts); this strips all but the last one per parent group
// at render time so the report shows exactly one.
function keepOnlyLastActionScreenshotPerStep(steps: ReportRow[]): void {
  let groupStart = -1;
  const flushGroup = (endExclusive: number) => {
    if (groupStart === -1) return;
    let lastWithScreenshot = -1;
    for (let i = groupStart; i < endExclusive; i++) {
      if (steps[i].screenshot) lastWithScreenshot = i;
    }
    for (let i = groupStart; i < endExclusive; i++) {
      if (i !== lastWithScreenshot) steps[i].screenshot = null;
    }
  };

  for (let i = 0; i < steps.length; i++) {
    if (steps[i].depth === 0) {
      flushGroup(i);
      groupStart = i + 1;
    }
  }
  flushGroup(steps.length);
}

// Given/When/And/But describe setup or an action and aren't themselves a
// verification, so they're "info" unless they threw; "Then" steps and
// assertion actions (the wrapped `expect` always titles these "Assert
// <label>") are treated as verifications, so a passing one is reported as
// "pass". Checked against the step's own title (chosen upfront, before the
// pass/fail-specific detail text exists) rather than the detail text.
function stepStatus(step: TestStep): 'pass' | 'fail' | 'info' {
  if (step.error) return 'fail';
  const { keyword, text } = splitBddKeyword(step.title);
  if (keyword === 'Then' || /^Assert/i.test(text)) return 'pass';
  return 'info';
}

// Depth among *our* steps only (category 'test.step'), so a Given/When/Then
// step from the `step` fixture is depth 0 and a nested perform()/API-call/
// assertion step inside it is depth 1.
function stepDepth(step: TestStep): number {
  let depth = 0;
  let current = step.parent;
  while (current) {
    if (current.category === 'test.step') depth += 1;
    current = current.parent;
  }
  return depth;
}

// Builds report rows via a true pre-order walk of Playwright's own step
// tree (step, then each test.step child in its natural nesting order,
// recursing) — NOT by sorting on step.startTime, since millisecond-resolution
// timestamps regularly tie between a step and the child it immediately
// starts, and onStepEnd itself fires in completion order (children finish
// before their parent). Walking `step.steps` sidesteps the tie entirely.
function collectStepRows(step: TestStep, depth: number, acc: ReportRow[]): void {
  const { keyword, text } = splitBddKeyword(step.title);
  acc.push({
    title: step.title,
    keyword,
    text: extractDetailText(step) ?? humanize(text),
    depth,
    status: stepStatus(step),
    timestamp: step.startTime.getTime(),
    durationMs: step.duration,
    screenshot: extractScreenshot(step),
    errorMessage: step.error?.message ? redactSecretLookingSubstrings(stripAnsi(step.error.message)) : null,
    errorStack: step.error?.stack ? redactSecretLookingSubstrings(stripAnsi(step.error.stack)) : null,
  });
  for (const child of step.steps || []) {
    if (child.category === 'test.step') collectStepRows(child, depth + 1, acc);
  }
}

function testStatus(resultStatus: TestResult['status']): ReportTestEntry['status'] {
  if (resultStatus === 'skipped') return 'skipped';
  if (resultStatus === 'passed') return 'passed';
  return 'failed'; // failed | timedOut | interrupted
}

type ExecutionMeta = Pick<
  ReportModel['meta'],
  'environment' | 'os' | 'nodeVersion' | 'playwrightVersion' | 'branch' | 'commit' | 'buildNumber' | 'ci'
>;

// Generic, project-agnostic execution/CI metadata — read directly from
// well-known env vars (CircleCI's CIRCLE_*, GitHub Actions' GITHUB_*) rather
// than importing this project's own src/data/env.ts, so this reporter (and
// extentReportHtml.ts) stay portable to any Playwright project unchanged.
// Every field is optional: a value that isn't set simply doesn't render its
// row in the report's execution-info panel.
function collectExecutionMeta(): ExecutionMeta {
  const shortSha = (sha: string | undefined): string | undefined => (sha ? sha.slice(0, 7) : undefined);
  return {
    environment: process.env.TEST_ENV || process.env.NODE_ENV || undefined,
    os: `${os.type()} ${os.release()}`,
    nodeVersion: process.version,
    playwrightVersion: installedPlaywrightVersion,
    buildNumber: process.env.CIRCLE_BUILD_NUM || process.env.GITHUB_RUN_NUMBER || undefined,
    branch: process.env.CIRCLE_BRANCH || process.env.GITHUB_REF_NAME || undefined,
    commit: shortSha(process.env.CIRCLE_SHA1 || process.env.GITHUB_SHA),
    ci: Boolean(process.env.CI),
  };
}

function inferArtifactType(attachment: TestResult['attachments'][number]): ReportArtifact['type'] {
  if (attachment.name === 'trace' || attachment.contentType === 'application/zip') return 'trace';
  if (attachment.contentType?.startsWith('video/')) return 'video';
  if (attachment.contentType?.startsWith('image/')) return 'screenshot';
  if (attachment.contentType?.startsWith('text/')) return 'log';
  return 'file';
}

// Test-level artifacts (trace.zip, video.webm, Playwright's own
// auto-captured failure screenshot) — distinct from the per-action
// screenshots already embedded inline as base64 (see captureStep in
// screenshotRecorder.ts). Those always carry `body`; genuine file artifacts
// always carry `path` instead, which is what tells them apart here. Skips
// the 'detail' attachment (screenshotRecorder's internal text marker for a
// row's display text) since it isn't a real artifact. Paths are resolved
// relative to the report's own output directory so a link still works if the
// whole report directory is moved or uploaded as a unit (e.g. as a single
// CI artifact bundle).
function collectArtifacts(outputDir: string, attachments: TestResult['attachments']): ReportArtifact[] {
  const absoluteOutputDir = path.resolve(outputDir);
  const artifacts: ReportArtifact[] = [];
  for (const attachment of attachments) {
    if (!attachment.path || attachment.name === 'detail') continue;
    artifacts.push({
      name: attachment.name,
      type: inferArtifactType(attachment),
      path: path.relative(absoluteOutputDir, attachment.path),
    });
  }
  return artifacts;
}

// Compact per-project (per-browser) pass/fail/skip/flaky breakdown for the
// dashboard's expandable "Projects" panel — pure aggregation over the
// already-collected test rows, no extra Playwright capture needed. A flaky
// test counts only toward `flaky`, never also toward `passed` — same rule
// as the top-level dashboard counts in onEnd(), so the two never disagree.
function buildProjectSummaries(tests: ReportTestEntry[]): ReportProjectSummary[] {
  const byProject = new Map<string, ReportProjectSummary>();
  for (const t of tests) {
    const name = t.project || 'default';
    const summary = byProject.get(name) ?? { name, total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 };
    summary.total += 1;
    if (t.flaky) summary.flaky += 1;
    else if (t.status === 'passed') summary.passed += 1;
    else if (t.status === 'failed') summary.failed += 1;
    else if (t.status === 'skipped') summary.skipped += 1;
    byProject.set(name, summary);
  }
  return [...byProject.values()].sort((a, b) => a.name.localeCompare(b.name));
}

interface ExtentReporterOptions {
  outputDir?: string;
  outputFile?: string;
  /** Overrides the auto-detected TEST_ENV/NODE_ENV value shown as "Environment" in the report's execution-info panel. */
  environment?: string;
}

export default class ExtentReporter implements Reporter {
  private outputDir: string;
  private outputFile: string;
  private tests = new Map<string, ReportTestEntry>();
  private runStartTime = 0;
  private executionMeta: ExecutionMeta;

  constructor(options: ExtentReporterOptions = {}) {
    this.outputDir = options.outputDir || 'extent-report';
    this.outputFile = options.outputFile || 'index.html';
    this.executionMeta = collectExecutionMeta();
    if (options.environment) this.executionMeta.environment = options.environment;
  }

  onBegin(): void {
    this.runStartTime = Date.now();
  }

  onTestBegin(test: TestCase, result: TestResult): void {
    const project = test.parent?.project?.();
    const titlePath = test.titlePath().slice(2);

    this.tests.set(test.id, {
      id: test.id,
      title: titlePath.length ? titlePath.join(' › ') : test.title,
      project: project ? project.name : '',
      status: 'passed',
      flaky: false,
      retry: result.retry,
      tags: test.tags,
      startTime: result.startTime.getTime(),
      endTime: result.startTime.getTime(),
      durationMs: 0,
      steps: [],
      artifacts: [],
    });
  }

  onStepEnd(test: TestCase, _result: TestResult, step: TestStep): void {
    // Only act on root-level test.step nodes (no test.step ancestor) — by
    // the time a step's own onStepEnd fires, all of its descendants have
    // already finished, so its `.steps` tree is fully populated and can be
    // walked in one go.
    if (step.category !== 'test.step' || stepDepth(step) !== 0) return;
    const row = this.tests.get(test.id);
    if (!row) return;

    collectStepRows(step, 0, row.steps);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const row = this.tests.get(test.id);
    if (!row) return;

    fillOrphanedScreenshots(row, result.attachments);
    keepOnlyLastActionScreenshotPerStep(row.steps);
    suppressDuplicateAncestorErrors(row.steps);

    row.status = testStatus(result.status);
    row.startTime = result.startTime.getTime();
    row.durationMs = result.duration;
    row.endTime = row.startTime + result.duration;
    row.retry = result.retry;
    // test.outcome() reflects *all* attempts recorded on the TestCase so
    // far, not just this one — onTestBegin resets a fresh row on every
    // retry, so only the row built for the *final* attempt survives into
    // onEnd(), and by then every attempt has been recorded. Safe to read
    // unconditionally here rather than gating on "is this the last attempt".
    row.flaky = test.outcome() === 'flaky';
    row.artifacts = collectArtifacts(this.outputDir, result.attachments);

    if (row.status === 'skipped') {
      for (const step of row.steps) step.status = 'skip';
    }
  }

  async onEnd(): Promise<void> {
    const tests = [...this.tests.values()].sort((a, b) => a.startTime - b.startTime);
    const total = tests.length;
    // A flaky test's final `status` is 'passed' (that's its literal
    // TestResult.status), so `passed` explicitly excludes flaky ones here —
    // otherwise the same test would be counted in both the "Passed" and
    // "Flaky" dashboard tiles. See the ReportTestEntry.flaky doc comment in
    // extentReportHtml.ts for the full rule (recommended by the report
    // redesign: clean pass -> passed, ultimate failure -> failed, skipped ->
    // skipped, failed-then-passed-on-retry -> flaky, never double-counted).
    const flaky = tests.filter((t) => t.flaky).length;
    const passed = tests.filter((t) => t.status === 'passed' && !t.flaky).length;
    const failed = tests.filter((t) => t.status === 'failed').length;
    const skipped = tests.filter((t) => t.status === 'skipped').length;
    const endTime = Date.now();

    const model: ReportModel = {
      meta: {
        startTime: this.runStartTime,
        endTime,
        durationMs: endTime - this.runStartTime,
        total,
        passed,
        failed,
        skipped,
        flaky,
        passPercent: total ? Math.round((passed / total) * 1000) / 10 : 0,
        ...this.executionMeta,
      },
      tests,
      projects: buildProjectSummaries(tests),
    };

    const html = renderReportHtml(model);
    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(path.join(this.outputDir, this.outputFile), html, 'utf-8');
  }
}
