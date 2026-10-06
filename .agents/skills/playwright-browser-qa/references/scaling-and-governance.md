# Scaling and Governance

Use this reference when moving from smoke checks to a maintained suite.

## CI baseline
- `workers: process.env.CI ? 1 : undefined` for stability-first default.
- `retries: process.env.CI ? 2 : 0` to classify flaky vs failed tests.
- `trace: 'on-first-retry'` and failure-scoped media artifacts.

## Sharding
When runtime grows materially:
- shard with `--shard=x/y`,
- emit blob reports in CI,
- merge artifacts into a single report.

Example:
```bash
npx playwright test --shard=1/4
npx playwright merge-reports --reporter html ./all-blob-reports
```

## Suite growth controls
- tag tests (`@smoke`, `@slow`, `@auth`) for selective execution,
- keep smoke lane fast for PRs; run slower coverage on scheduled/nightly lanes,
- regularly remove dead or redundant E2E cases.

## Governance checks
- Enforce no `test.only` in CI (`forbidOnly`).
- Review anti-patterns in diffs: sleeps, brittle selectors, global shared state.
- Keep browser-matrix expansion intentional; do not add browsers by default without a risk driver.

## Canonical docs
- https://playwright.dev/docs/ci
- https://playwright.dev/docs/test-sharding
- https://playwright.dev/docs/test-reporters
- https://playwright.dev/docs/test-cli
