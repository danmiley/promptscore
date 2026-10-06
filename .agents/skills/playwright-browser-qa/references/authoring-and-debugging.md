# Authoring and Debugging

Use this reference when writing or stabilizing Playwright tests.

## Locator policy
Preferred order:
1. `getByRole(role, { name })`
2. `getByLabel(text)`
3. `getByPlaceholder(text)`
4. `getByText(text)`
5. `getByAltText(text)`
6. `getByTitle(text)`
7. `getByTestId(id)` when semantics are insufficient

Prefer chained locators and filtering over broad selectors.

**Responsive layouts ship duplicate affordances.** When desktop and mobile
markup both carry the same link or control, a role/name locator matches both and
the hidden one can satisfy the assertion. Filter to the visible element so a
hidden mobile link cannot stand in as proof of desktop navigation.

**Elements rendered in only one data or theme mode are locator traps.** A check
targeting an element the other branch never renders does not fail — it *hangs*
until timeout, which reads as flake rather than as the disclosure gap it is.
Prefer markup that renders the element in every mode with differing content.

## Assertion policy
- Use web-first assertions (`await expect(locator).toBeVisible()` and peers).
- Let Playwright auto-wait and retry; avoid sleep-based timing.
- Assert user-visible behavior, not implementation details.

## Debugging sequence
1. Reproduce with `--project=chromium` and then `--headed`.
2. Run with `--debug` or `--ui` for stepwise investigation.
3. Inspect trace artifacts (`show-trace`) on CI-only failures.
4. Fix locator or lifecycle causes before changing timeouts.

## Auth and fixture reuse
- Use `storageState` for reusable authenticated contexts.
- Use worker or test fixtures for shared setup and dependency injection.
- Keep each test independently runnable.

## Targeted mocking
- Use `page.route` to isolate hard-to-reproduce UI states.
- Keep at least a minimal unmocked flow to preserve end-to-end confidence.
- Do not replace backend contract coverage with UI mocks alone.

## Optional extensions
- Visual snapshots (`toHaveScreenshot`) for layout-sensitive surfaces.
- `@axe-core/playwright` scans for automated accessibility checks.

## Canonical docs
- https://playwright.dev/docs/best-practices
- https://playwright.dev/docs/locators
- https://playwright.dev/docs/test-assertions
- https://playwright.dev/docs/debug
- https://playwright.dev/docs/auth
- https://playwright.dev/docs/test-fixtures
- https://playwright.dev/docs/mock
- https://playwright.dev/docs/test-snapshots
- https://playwright.dev/docs/accessibility-testing
