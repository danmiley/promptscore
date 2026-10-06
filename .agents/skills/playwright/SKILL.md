---
name: playwright
description: Use when the task requires automating a real browser from the terminal (navigation, form filling, snapshots, screenshots, data extraction, UI-flow debugging) via playwright-cli or the bundled wrapper script. Not for authoring durable test suites (playwright-browser-qa) or persistent REPL-driven debugging (playwright-interactive).
license: Apache-2.0 derived; LICENSE.txt and NOTICE.txt have complete terms
compatibility: Requires Node.js/npm (npx) to run playwright-cli via the bundled wrapper
metadata:
  version: "2"
  track: addon
  model-posture: any
  ported-from: codex-skills-dev/playwright
---

# Playwright CLI Skill
## Purpose
Drive a real browser from the terminal using `playwright-cli`, preferring the
bundled wrapper so the CLI works even when it is not globally installed. This is
CLI-first automation; do not pivot to `@playwright/test` unless the user
explicitly asks for test files.

## Use With Other Skills
- Use `playwright-browser-qa` for durable Playwright test suites and CI strategy.
- Use `playwright-interactive` for persistent REPL-driven debugging across turns.

## Preflight (required)
Before proposing commands, confirm `npx` is available (the wrapper depends on it):

```bash
command -v npx >/dev/null 2>&1
```

If it is not available, pause and ask the user to install Node.js/npm (which
provides `npx`). A global CLI install is optional; the wrapper runs the CLI via
`npx` without one:

```bash
npm install -g @playwright/cli@latest   # optional
```

## Set the wrapper path (once)

Repo-scope polymath installs (the default for Codex, Claude, and Antigravity
lanes) place the wrapper in the target repo:

```bash
export PWCLI="scripts/polymath/playwright/playwright_cli.sh"
```

If that path does not exist, fall back to a user-scoped Codex install, which
places skills under `$CODEX_HOME/skills` (default `~/.codex/skills`):

```bash
export PWCLI="${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh"
```

This section is the authoritative wrapper resolution; `references/cli.md` only
adds an optional `pwcli` alias.

## Core workflow
1. Open the page.
2. Snapshot to get stable element refs.
3. Interact using refs from the latest snapshot.
4. Re-snapshot after navigation or significant DOM changes.
5. Capture artifacts (screenshot, pdf, traces) when useful.

Minimal loop:

```bash
"$PWCLI" open https://example.com
"$PWCLI" snapshot
"$PWCLI" click e3
"$PWCLI" snapshot
```

## Output policy
When capturing artifacts in this repo, write under `output/playwright/` and do
not introduce new top-level artifact folders.

## Reference Routing
- Full command catalog (core, navigation, keyboard, mouse, save-as, tabs,
  devtools, sessions) and wrapper/alias setup: `references/cli.md`
- Task workflows and troubleshooting (form fill, data extraction, trace
  debugging, multi-tab, sessions, config file): `references/workflows.md`

## Guardrails
- Always snapshot before referencing element ids like `e12`; re-snapshot when
  refs seem stale or a command fails due to a missing ref.
- When you do not have a fresh snapshot, use placeholder refs like `eX` and say
  why; do not bypass refs with `run-code`.
- Prefer explicit commands over `eval` and `run-code` unless needed.
- Use `--headed` when a visual check will help.
- Default to CLI commands and workflows, not Playwright test specs.
