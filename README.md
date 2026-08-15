# Playwright UI & API Automation Framework

A production-style Playwright + TypeScript automation framework for UI, REST API, and end-to-end integration testing. Built against the [Expand Testing](https://practice.expandtesting.com/) platform with file upload/download testing, reusable components, centralized test data, Extent-style reporting, and CircleCI integration.

## Target application

**[Expand Testing](https://practice.expandtesting.com/)** — a free web and REST API practice platform for QA/SDET automation. This framework exercises:

- The core practice site (login, registration, file upload/download, dynamic tables, JS dialogs, redirects)
- The **Notes API** (`/notes/api`) — a full REST API with registration, login, profile management, and note CRUD, secured with an `x-auth-token` header
- The **Notes App** (`/notes/app`) — a React SPA backed by the same Notes API, used here for UI + API integration scenarios

## Tech stack

- [Playwright](https://playwright.dev/) (Chromium, Firefox, WebKit)
- TypeScript (strict mode)
- Node.js
- Custom Extent-style HTML report (self-contained, no external reporting service)
- CircleCI
- Page Object Model + reusable API clients

## Framework architecture

```
src/
├── pages/            # Page Object Model — one class per page, locators + user actions only
│   └── notes-app/     # Page objects for the React Notes App
├── api/               # Reusable API clients (ApiClient base + Users/Notes/Health clients)
├── fixtures/          # Playwright fixtures: page objects, API clients, BDD step wrapper, wrapped expect
├── reporters/         # Custom Extent-style HTML reporter
├── utils/             # Step logging, screenshot capture, ad-blocking, test data generators
├── data/              # Centralized, environment-aware test data and expected messages
└── types.ts (api/)    # Shared TypeScript types for API request/response shapes

tests/
├── ui/                # UI-only tests
├── api/               # API-only tests
└── e2e/               # UI + API integration tests, file upload/download round trip

test-data/
├── uploads/           # Static fixture files used as upload input
└── downloads/         # Destination for files downloaded during tests (gitignored)

playwright.config.ts
.circleci/config.yml
.env.example
```

Every page object extends `BasePage`, which provides `perform()` (wraps a single UI action in its own reported step + screenshot) and `gotoPath()` (navigation with a friendly step title). Every API client extends `ApiClient`, which provides the equivalent `send()` wrapper for HTTP calls — so both UI and API actions are logged and reported the same way, through one shared mechanism (`src/utils/step.ts`).

`src/fixtures/api.fixtures.ts` defines API-only fixtures (`apiContext`, `usersApi`, `notesApi`, `healthApi`, and a self-cleaning `registeredUser` fixture that registers a unique account via the API before a test and deletes it afterward). `src/fixtures/base.ts` extends that with UI fixtures (one per page object) plus the `step` BDD wrapper and a screenshot-aware `expect`. Every test file — UI, API, or e2e — imports `test`/`expect` from `src/fixtures/base.ts`, so any test can mix page objects and API clients freely without extra wiring.

## Key features

- **Page Object Model** — locators and actions live in page objects; test files contain only test logic and assertions.
- **Reusable API clients** — `UsersApiClient`, `NotesApiClient`, `HealthApiClient` centralize every HTTP call; no raw `request.fetch()` calls in test files.
- **Centralized, isolated test data** — `src/data/*.ts` holds static reference data (demo credentials, expected error strings verified against the live app); `src/utils/dataGenerator.ts` generates unique emails, names, and passwords per test run so tests never collide and can run in parallel, in any order, repeatedly.
- **API-based setup and cleanup** — the `registeredUser` fixture creates a throwaway account through the API and deletes it after the test, so UI and e2e tests get a clean authenticated user without ever driving the registration UI for setup.
- **UI + API integration** — see [`tests/e2e`](tests/e2e): API-seeded data verified in the real Notes App UI, a UI action (toggling a note's completed switch) verified against the backend via the API, and a full file upload → download round trip with content verification.
- **Custom Extent-style HTML report** — a single self-contained `extent-report/index.html` with collapsible BDD-style steps, action-level logs, action-level screenshots (only on the last action of each step), search/filter, and light/dark mode. See [Reporting](#reporting) below.
- **CircleCI** — three independent, tag-scoped workflows (smoke on `main`, critical weekly, regression on `release/*`). See [CI/CD](#cicd).

## Setup

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
npx playwright install
```

### Environment configuration

Copy the example file and adjust if needed (the defaults already point at the public Expand Testing practice site and its documented demo credentials):

```bash
cp .env.example .env
```

| Variable                                      | Description                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `UI_BASE_URL`                                 | Base URL for UI tests (`https://practice.expandtesting.com`)                                    |
| `API_BASE_URL`                                | Base URL for the Notes API — **must end with a trailing slash** (see `src/data/env.ts` for why) |
| `DEMO_USERNAME` / `DEMO_PASSWORD`             | The public demo login credentials documented on `/login`                                        |
| `BASIC_AUTH_USERNAME` / `BASIC_AUTH_PASSWORD` | Credentials for the Basic/Digest auth practice pages                                            |

No real secrets are involved — every credential here is a publicly documented demo account on the practice site itself. `.env` is gitignored regardless, and account data created during test runs (via the Notes API) is generated uniquely per run and cleaned up automatically.

## Running tests

```bash
npx playwright test                     # everything, all browsers
npm run test:ui                         # UI tests only
npm run test:api                        # API tests only (runs once, not per-browser)
npm run test:e2e                        # UI + API integration tests
npm run test:chromium                   # a single browser
npm run test:headed                     # watch the browser locally
```

### Suite commands

```bash
npm run test:smoke        # @smoke — 1-3 fast, high-value tests
npm run test:critical     # @critical — core auth/UI/API/file-upload workflows
npm run test:regression   # @regression — full positive/negative/edge-case coverage
```

A test can carry multiple tags (e.g. a core login test is both `@smoke` and `@critical` and `@regression`). `tests/api/**` only runs under the `chromium` project (see `playwright.config.ts`) since those tests never touch a browser — running them three times over would just triple CI time for no extra coverage.

## Reporting

Every run produces a self-contained `extent-report/index.html` — no server required, screenshots are inlined as base64 data URIs.

```bash
npx playwright test
npm run report:open   # macOS; otherwise just open extent-report/index.html in a browser
```

**Report hierarchy.** Each `step.given/when/then/and/but(...)` call becomes a collapsible parent row; every action inside it (a page-object `perform()` call, an API client's HTTP call, or an `expect(...)` assertion) becomes its own nested row:

```
When User logs in
    ├── Enter username: practice
    ├── Enter password: ********
    └── Click Login button

Then the user is redirected to the secure area
    └── Assert status code: 200
```

Parent steps are **collapsed by default** — click one to expand its actions.

**Every action is logged with the actual value used, and assertions are pass/fail-aware.** Not "Enter email" but `Enter email: testuser123@example.com`; not a bare "Verify status code" but `Assert status code: 200`. API calls (`src/api/ApiClient.ts`) log their own sanitized request body/headers and response status as nested rows; UI fills (`BasePage.perform()`) log the field and value. The wrapped `expect` (`src/fixtures/base.ts` + `src/utils/assertionDescriber.ts`) reports a **concise** line on pass — `Assert status code: 200` — and only spells out both sides when there's a real discrepancy to explain, on **fail** — `Assert status code FAILED — Expected: 200, Actual: 500`. Pass `expect(value, 'field label')` to give any assertion a specific label (`'status code'`, `'username'`, ...) instead of a matcher-derived fallback (`'value'`).

**Screenshots are action-level only.** A parent step never carries its own screenshot; instead, whichever action ran _last_ inside that step keeps its screenshot (every action captures one when it runs, either against a UI page or nothing at all for API-only actions — the reporter keeps just the last one per step at render time, so there's never a duplicate between the step and its actions). If the last action fails, its screenshot and error are what's shown — the parent step is marked failed too, but doesn't repeat the error message.

**Other report features:** total/passed/failed/skipped/pass % tiles, run duration, per-test search and status filtering, a screenshot lightbox, and a persisted light/dark mode toggle.

### Sensitive data masking

Everything above flows through `src/utils/sanitize.ts`, the single place in the codebase allowed to decide whether a value is sensitive — no page object, API client, or test hand-rolls password masking. A field/header name is checked case-insensitively against a pattern covering `password`, `token`, `secret`, `authorization`, `apiKey`, `cookie`, `session`, `jwt`, `credential`, etc.; a match is always replaced with `********` before it reaches a console line, the report, or an error message:

- `describeValue('Enter password', pw)` → `"Enter password: ********"` (used by every page-object fill action).
- `sanitizeObject(formData)` / `sanitizeHeaders(headers)` → recursively mask matching keys in a request body or header map before `ApiClient.send()` logs it.
- `formatAssertionValue(value)` → the unquoted formatter behind every `Assert ...` line; additionally masks a value with no known field name (e.g. a raw token pulled out of a response body) if it's _shaped_ like a JWT or opaque bearer token, as defense in depth.
- `redactSecretLookingSubstrings(text)` → the same shape-based check applied to already-rendered error text (Playwright's own assertion failure messages embed both compared values verbatim), used when the reporter and console logger extract an error's message/stack.

Real credentials never enter this pipeline in the first place: passwords in `src/data/users.ts` are either the public demo account documented on `/login` or generated per-test by `src/utils/dataGenerator.ts`, and every Notes API token is discarded when its throwaway account is deleted at test teardown. Password `<input>` fields also render natively masked in the browser, so nothing readable ever reaches a screenshot either.

### Console output

Every action also prints a line to stdout as it runs (via `src/utils/stepLogger.ts`) — visible locally and in the CircleCI job's **Steps** tab, no extra wiring required:

```
[Test: logs in with valid credentials and can log out]
[10:32:01] STEP 1 - Open login page - PASS
[10:32:03] STEP 2 - Enter username: practice - PASS
[10:32:04] STEP 3 - Enter password: ******** - PASS
[10:32:05] STEP 4 - Click Login button - PASS
[10:32:05] STEP 5 - Assert status code: 200 - PASS
```

## CI/CD

`.circleci/config.yml` defines one parameterized `test` job and three independent workflows, each on its own trigger:

| Workflow                | Jobs                                                             | Trigger                                         |
| ----------------------- | ---------------------------------------------------------------- | ----------------------------------------------- |
| `smoke-on-main`         | `smoke` — Chromium only                                          | Every push to `main`                            |
| `critical-weekly`       | `critical` — Chromium only                                       | Scheduled — every **Monday 06:00 UTC**          |
| `regression-on-release` | `regression-chromium`, `regression-firefox`, `regression-webkit` | Every push to a `release` or `release/*` branch |

```
main            →  @smoke        →  Extent report
weekly schedule →  @critical     →  Extent report
release/*       →  @regression   →  Extent report
```

- The smoke suite is deliberately tiny (see [Suite commands](#suite-commands)) so `main` gets fast feedback.
- `regression-on-release` runs Chromium, Firefox, and WebKit as three parallel jobs (not one sequential job covering all three), so wall-clock time is roughly the slowest browser instead of the sum of all three.
- Each of those three jobs is _also_ split across 2 containers via CircleCI's `parallelism` plus Playwright's own `--shard` — so a single release-branch push runs 6 containers total (`test-results`/`extent-report` are uploaded per-container, visible as separate nodes in the Artifacts tab). `parallelism` is a parameter on the shared `test` job (default `1`, a no-op — `--shard=1/1` just means "run everything"), so `smoke`/`critical` are unaffected; bump `parallelism: 2` on any of the three regression jobs in `.circleci/config.yml` independently (e.g. chromium's suite is heavier since API tests only run there) to trade more concurrent containers for a shorter wall-clock time.
- A normal commit to `main` never triggers the full regression suite — only a push to a `release`/`release/*` branch does.
- To change the schedule or branch patterns, edit the `filters`/`cron` values in `.circleci/config.yml`.

**Artifacts** — every job stores, regardless of pass/fail:

- `extent-report/` — the custom HTML report
- `test-results/` — JUnit XML plus per-failure screenshots, videos, and traces (`npx playwright show-trace <file>` to open one)

The job fails whenever any test fails, and retries are limited to `1` and CI-only (see `playwright.config.ts`) — enough to absorb a rare third-party network blip against the live practice site, never enough to mask a genuinely flaky test.

## Reliability notes

- No `page.waitForTimeout()` anywhere — all waits are Playwright's own auto-waiting or explicit condition-based waits (e.g. `expect.poll()` when confirming an async backend state change).
- The Dynamic Table test reads the "CPU" column by locating its current header position rather than a fixed index, since the practice page deliberately reorders both rows and columns on every load.
- JS dialog handlers are registered with `page.once('dialog', ...)` _before_ the triggering click (not awaited after), since a native dialog blocks the page's JS thread and a click that triggers one won't resolve until the dialog is handled synchronously.
- The practice site is ad-supported; `src/utils/adBlocker.ts` blocks known ad/tracking domains per test context, since third-party ad iframes intermittently intercept clicks and slow page-load completion — noise that has nothing to do with the application under test.
- Every browser context is isolated per test (Playwright's default), and all test data is either generated uniquely per run (`src/utils/dataGenerator.ts`) or created/torn down through the API — no shared mutable state between tests.

## Code quality

```bash
npm run typecheck   # tsc --noEmit
npm run lint         # eslint
npm run format        # prettier --write
```
