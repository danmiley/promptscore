# Rust Playwright Browser QA

> Background / provenance only. This is the absorbed predecessor developer guide, kept for historical context and source-material links. For task work, use the focused references in the skill's Reference Routing section; open this page only for background or provenance.

Use this page with `playwright-browser-qa` when a Rust repository needs browser-level confidence with Playwright.

## What this skill adds
- A Playwright baseline for browser-E2E that is Rust-repo friendly.
- Locator-first authoring policy and anti-flake debugging workflow.
- CI defaults for retries, workers, traces, and optional sharding.
- Boundaries that keep Rust-native test layers and harness governance separate.

## Ownership and Composition
Rust macOS app track precedence:
1. `rust-macos-app`
2. `rust-test-harness`
3. `playwright-browser-qa`
4. `web-hero-video` (when hero-video delivery is in scope)
5. `rust-commercial-tiers`
6. `rust-gpu-perf`
7. `rust-image-browser`
8. `rust-perf-assessment`
9. `refactoring-governance`
10. `rust-graphics-kernels`

Boundary rules:
- `playwright-browser-qa` owns browser-E2E strategy and Playwright implementation patterns.
- `web-hero-video` owns hero-video source-selection/media-request assertions and audit semantics.
- `rust-test-harness` remains authoritative for matrix/gate/report contracts.
- `rust-macos-app` remains authoritative for release/signing/coverage defaults.

## Baseline Configuration Expectations
For most Rust repos, start with:
- Chromium project only.
- `webServer` configured so tests run as a single command.
- `retries: process.env.CI ? 2 : 0`.
- `workers: process.env.CI ? 1 : undefined`.
- `trace: 'on-first-retry'` and failure-scoped screenshot/video artifacts.

Add Firefox/WebKit/mobile projects only when there is a concrete risk driver.

## Test Authoring Policy
- Prefer `getByRole`, `getByLabel`, `getByText`, and `getByAltText` locators.
- Avoid CSS/XPath chains tied to layout structure.
- Avoid `waitForTimeout` for synchronization.
- Assert user-visible behavior rather than internal implementation details.

## Rust Integration Patterns
- Static surface: serve `product/` or build output via `webServer.command`.
- Rust HTTP app (axum/actix/rocket/warp): launch app with deterministic port and readiness URL.
- Trunk/wasm repos: prefer build-then-serve for CI determinism.
- Tauri desktop-shell behavior remains out of scope for this skill.

## Scaling Guidance
When suites grow:
- Use tags (`@smoke`, `@slow`, `@auth`) for targeted lanes.
- Keep PR smoke lane small and high-signal.
- Add sharding and merged reports when runtime materially increases.

## Validation Checklist
- Confirm `playwright.config.*` contains server lifecycle ownership.
- Confirm at least one smoke test covers the highest-value route/workflow.
- Confirm test diffs avoid known anti-patterns.
- Confirm CI lane captures useful failure artifacts.

## Source Materials
This skill consolidates:
- `exemplar://word-histories/docs/playwright-test-strategy-rust-apps_claude_version.md`
- `exemplar://word-histories/docs/playwright-test-strategy-rust-apps.md`

Keep `docs/playwright-browser-testing-intro.md` as supplemental onboarding context.
