---
name: python-cli-app
description: "Use to bootstrap or harden a Python project or CLI: uv-managed pyproject.toml with a pinned interpreter and committed lockfile, src/ layout, ruff + pyright + pytest baseline, thin argparse entry point, stdout/stderr rules, --json envelope, stable exit-code map, config/env precedence, non-interactive posture, and CLI contract tests. Do not use for style rules (python-style-guide), test lanes/goldens/coverage gates (python-test-harness), or Homebrew/tap packaging (homebrew-tap-setup)."
license: MIT
metadata:
  version: "2"
  track: addon
  model-posture: any
  ported-from: polymath-skills-dev/rust-cli-app
---

# Python CLI App

## Overview
Apply this skill when a Python repository is new, has no `pyproject.toml`, or
ships a command-line tool whose behaviour must stay stable for both humans
and agents. It is the Python implementation tier of the CLI family; the
language-neutral rationale is in `cli-package-design`.

## Scope
- Project bootstrap: `uv`, `pyproject.toml`, interpreter pin, `uv.lock`,
  `src/<pkg>/` layout, dependency groups, entry points.
- Quality baseline: `ruff check`, `ruff format --check`, `pyright`, `pytest`,
  wired so a fresh checkout is green before the first feature.
- CLI architecture: thin `cli.py`, commands as typed functions, domain code
  importable without the CLI.
- Command taxonomy, stdout/stderr separation, `--json` envelope, exit-code
  taxonomy, config/env precedence, non-interactive and read-only `doctor`.
- CLI contract tests that spawn the entry point.

## Out Of Scope
- Style rules and the tricky-code gate (`python-style-guide`).
- Test lane matrix, hermetic fixtures, goldens, coverage gates, reports
  (`python-test-harness`).
- Distribution: wheels to an index, Homebrew taps, installers
  (`cli-package-design` for lane choice, `homebrew-tap-setup` for taps).
- CI workflow files. Gates are local scripts first; CI wiring is a later
  milestone by design.

## Workflow
1. Classify: fresh repo with no `pyproject.toml`, or existing project. Fresh:
   `references/project-bootstrap.md` end to end, then step 3. Existing: read
   `pyproject.toml` and match its conventions; apply only the missing pieces.
2. Lock the command model and the output/error contract before adding
   commands: `references/command-and-output-contracts.md`, recorded in a
   copy of `assets/templates/cli-contract-v1.md`.
3. Shape the code: `references/cli-architecture.md`. Start from
   `assets/templates/cli_skeleton.py`.
4. Define config/env precedence and the non-interactive defaults:
   `references/config-and-noninteractive.md`.
5. Wire the gate baseline and contract tests: `references/testing-and-gates.md`;
   run `scripts/check_cli_contract.sh`.
6. Route packaging to `cli-package-design` / `homebrew-tap-setup`, test
   lanes to `python-test-harness`, style questions to `python-style-guide`.

## Reference Routing
- Fresh-repo bootstrap (uv, pyproject, layout, first green run):
  `references/project-bootstrap.md`
- Package and module shape for a CLI: `references/cli-architecture.md`
- Command surface, stdout/stderr, JSON envelope, exit codes:
  `references/command-and-output-contracts.md`
- Config file, environment, flags, secrets, `doctor`:
  `references/config-and-noninteractive.md`
- Gate baseline and contract-test patterns: `references/testing-and-gates.md`

## Script Entrypoints
- `scripts/check_cli_contract.sh [project_root]`: repo-agnostic signal check
  (pyproject present, entry point declared, JSON mode, stderr channel,
  contract tests, lockfile). Writes
  `dist/reports/cli-contract/check_cli_contract_report.txt`; exit 2 on any
  failed signal.

## Template Assets
- `assets/templates/pyproject-baseline.toml`: verified project + lint + test
  configuration (toolchain versions in the file header).
- `assets/templates/cli_skeleton.py`: argparse entry point with `--json`,
  exit-code enum, error envelope, read-only `doctor`.
- `assets/templates/test_cli_contract.py`: in-process and subprocess
  contract tests, typed for pyright strict.
- `assets/templates/cli-contract-v1.md`: the contract record to fill in.
- `assets/templates/exit-code-map-v1.csv`: exit taxonomy, single-sourced
  from `cli-package-design`; keep aligned.

## Core Rules
- `uv` owns the environment: `uv sync`, `uv run <cmd>`, `uv add`, `uv lock`.
  Never `pip install` into a shared interpreter; never a `requirements.txt`
  next to a `pyproject.toml`.
- `requires-python` is pinned to one minor (`>=3.12`) and `uv.lock` is
  committed. `.python-version` matches.
- `src/<pkg>/` layout; tests import the installed package, never a relative
  path.
- Stdout is data; stderr carries diagnostics and progress. `--json` output
  is an envelope with a `schema` field.
- Exit codes come from the map and are regression-tested.
- Read-only diagnostics (`doctor`, `check`) never create files or
  directories.
- A fresh checkout runs `uv sync && uv run ruff check && uv run ruff format
  --check && uv run pyright && uv run pytest` green before the first feature
  lands; that command list is the definition of "infra not broken".
