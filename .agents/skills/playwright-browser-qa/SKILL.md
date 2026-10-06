---
name: playwright-browser-qa
description: "Use for browser QA with Playwright: config/webServer baselines, locator-first authoring, debugging, auth fixtures, visual/a11y checks, and CI sharding. Not for one-shot CLI browser automation (playwright) or hero-video media-request semantics (web-hero-video)."
license: MIT
compatibility: Browser QA guidance assumes Node.js Playwright tooling in the target repo
metadata:
  version: "4"
  track: addon
  model-posture: any
  ported-from: codex-skills-dev/rust-playwright-qa-2026
---

# Rust Playwright QA
## Overview
Apply this skill when Rust projects need browser-level end-to-end quality checks using Playwright.

## Scope
- Playwright test strategy for Rust-backed browser surfaces (static product pages, web frontends, docs portals).
- Baseline Playwright configuration (`projects`, `webServer`, retries/traces, CI-safe defaults).
- Locator-first test authoring and anti-flake debugging workflows.
- Auth reuse, fixtures, targeted network mocking, visual snapshots, and accessibility checks.
- CI scaling patterns for workers, sharding, and merged reports.

## Out of Scope
- Rust unit, property, integration, and contract-test design.
- Release/signing/notarization policy ownership.
- Non-browser harness governance and generic gate policy.
- Tauri desktop-shell WebDriver ownership.

## Use With Other Skills
- Pair with `rust-test-harness` for QA matrix, staged gate contracts, and machine-readable report artifacts.
- Pair with `rust-macos-app` for release/packaging/signing defaults.
- Pair with `product-site-pages` when validating static publish-root routes/assets on GitHub Pages surfaces.
- Pair with `rust-cli-product-surface` when browser tests cover CLI manual/install/release-note product pages.
- For comparing captured screenshots beyond Playwright's built-in snapshot assertion (perceptual or structural image diff, heat maps), consult `agent-cli-tools` for the image/visual-regression tool (`odiff`, `perceptualdiff`, `dssim`, `magick compare`).

Conflict precedence:
1. `rust-macos-app` for release/signing/coverage defaults.
2. `rust-test-harness` for QA matrix/gate/report contracts.
3. `playwright-browser-qa` for browser-E2E authoring, debugging, and hardening strategy.
4. `product-site-pages` for publish-root and static-site route/link ownership.

## Workflow
1. Classify the task first: suite bootstrap / config or server lifecycle, test authoring or debugging, Rust wiring, or scaling/CI governance.
2. Apply the Core Rules below, then open only the reference that owns that decision (see Reference Routing); do not read the references as a bundle.
3. Bootstrap/config/server-lifecycle tasks: read `references/quickstart-and-baseline.md`.
4. Writing, editing, or de-flaking tests: read `references/authoring-and-debugging.md`.
5. Only when wiring Rust servers/builds to Playwright: read `references/rust-integration-patterns.md`.
6. Only when changing retries/workers/sharding/reporting or suite-growth policy: read `references/scaling-and-governance.md`.
7. Keep browser checks focused on user-visible behavior; route lower-layer logic tests to Rust-native test layers.

## Reference Routing
- Minimal config baseline and server lifecycle: `references/quickstart-and-baseline.md`
- Locator policy, test authoring, and anti-flake debugging: `references/authoring-and-debugging.md`
- Wiring Rust servers/builds to Playwright: `references/rust-integration-patterns.md`
- Retries/workers/sharding/reporting and suite-growth policy: `references/scaling-and-governance.md`
- Background only (absorbed predecessor guide + source-material provenance; not a primary route): `references/guide-browser-qa.md`

## Core Rules
- Prefer resilient, user-facing locators (`getByRole`, `getByLabel`, `getByText`, `getByAltText`) over CSS/XPath chains.
- Avoid `waitForTimeout` as a timing crutch; use web-first assertions and Playwright auto-wait behavior.
- Own server lifecycle in config (`webServer`) so test commands are one-step and CI-ready.
- Keep Chromium-first by default; add Firefox/WebKit/mobile projects only with explicit risk-based justification.
- Use trace/video/screenshot capture primarily on failure or retry to preserve signal with low overhead.
- Use network mocking for targeted UI states, but keep a small real-stack path for true end-to-end confidence.

## Required Outputs
- A project-appropriate `playwright.config.*` baseline with explicit server lifecycle and CI defaults.
- At least one browser smoke path covering critical user-visible behavior.
- Documented locator policy and anti-pattern checks for new specs.
- Clear decision notes on optional visual/a11y coverage and cross-browser expansion.
- Residual-risk notes for unstable surfaces, auth flows, and environment-specific rendering differences.
