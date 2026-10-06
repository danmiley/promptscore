# Rust Integration Patterns

Use this reference when binding Playwright into Rust-centric repos.

## Static surface pattern
For static output (`product/`, generated docs, compiled `dist/`):
- serve the static root via `webServer.command`,
- validate route/asset rendering and overflow behavior,
- keep smoke tests cheap and deterministic.

## Rust HTTP app pattern (axum/actix/rocket/warp)
- Drive the app through `webServer.command` using a deterministic port.
- Prefer a health endpoint for readiness checks.
- Cache builds in CI to reduce startup variance.

Example command:
```bash
cargo run --release --bin app -- --port 4173
```

## Trunk/wasm pattern (Leptos/Yew/Dioxus)
- Prefer build-then-serve for tests (`trunk build --release` + static server).
- Avoid long-running dev-watch servers in CI test flows.

## Tauri boundary
- Playwright is for browser surfaces.
- Tauri desktop-shell WebDriver behavior remains outside this skill scope.
- Browser Playwright coverage plus Rust tests is the default split unless desktop-shell automation is explicitly requested.

## Layering guidance
- Use Rust-native tests for core logic and contracts.
- Use Playwright for behavior only visible in a real browser.
- Keep the E2E slice minimal but high-signal.

## Canonical docs
- https://playwright.dev/docs/test-webserver
- https://playwright.dev/docs/projects
- https://playwright.dev/docs/emulation
