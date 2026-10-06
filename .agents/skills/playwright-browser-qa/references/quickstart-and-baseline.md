# Quickstart and Baseline

Use this reference first when introducing Playwright to a Rust project.

## When to use Playwright
Good fit:
- real-browser smoke checks for user-visible behavior,
- navigation/route assertions,
- responsive overflow checks,
- interaction flows where DOM semantics matter,
- screenshots/traces used for debugging review.

Not a fit:
- pure Rust logic that belongs in unit/integration/property tests,
- parser/serializer contracts without browser behavior.

## Baseline configuration (TypeScript)
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'python3 -m http.server 4173 --directory product',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

## First spec baseline
- One smoke test that loads `/` and asserts a primary heading.
- One high-signal artifact assertion (key CTA, hero image, or nav label).
- Keep test names behavior-oriented and stable.

## `reuseExistingServer` can certify a stale build

`reuseExistingServer: !process.env.CI` is the right local default for speed, and
it silently invalidates a visual checkpoint. When `webServer.command` builds the
site, a reused server keeps serving the previous build, so a late CSS or markup
change appears absent — or, worse, appears fixed when it is not.

Before publishing a screenshot, a visual sign-off, or any result someone will
cite, force a fresh build/server lane (`CI=1 npx playwright test`, or an explicit
no-reuse script). Treat any reused-server result whose build identity is not
proven as superseded, not as evidence.

## `webServer` owns a build root; do not race it

A `webServer.command` that builds is a lifecycle action, not a read-only
command. Running an explicit build concurrently with the test command can delete
a temporary chunk the server's own build is importing, producing failures
(`ERR_MODULE_NOT_FOUND` and peers) that look like missing source or a product
regression.

Before parallelizing validation commands, inventory each one's write roots,
ports, and embedded lifecycle actions, and serialize anything that shares a
build tree or port unless it supports isolated output paths. Record a
harness-caused invalid attempt separately from a valid product result — never
silently count the rerun without saying why the first attempt was non-probative.

## Anti-patterns to reject in review
- `waitForTimeout(ms)` for synchronization.
- brittle selector chains coupled to layout structure.
- hardcoded absolute URLs in every test when `baseURL` is available.
- manual out-of-band server startup as a permanent workflow.

## Canonical docs
- https://playwright.dev/docs/test-configuration
- https://playwright.dev/docs/test-webserver
- https://playwright.dev/docs/ci
- https://playwright.dev/docs/test-retries
