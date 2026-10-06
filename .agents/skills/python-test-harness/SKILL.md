---
name: python-test-harness
description: "Use for Python project QA harnesses: pytest lane matrix (unit, contract, golden, bench) with acceptance tiers, hermetic no-network fixtures, recorded-input fixtures, deterministic text goldens with explicit update approval, staged advisory-to-enforced coverage gates, and stable machine-readable gate JSON plus an HTML index under dist/reports. Not for style rules (python-style-guide), project bootstrap or CLI contracts (python-cli-app), or CI workflow authoring (deferred by design)."
license: MIT
metadata:
  version: "1"
  track: addon
  model-posture: any
  ported-from: polymath-skills-dev/rust-test-harness
---

# Python Test Harness

## Overview
Apply this skill to stand up and enforce a Python test harness that works
for both human reviewers and agents: every gate writes a machine-readable
result even when it fails, defaults are advisory until a stage is promoted,
and no test can reach the network or the developer's home directory by
accident.

## Scope
- Lane matrix: `unit` (tier A), `contract` and `golden` (tier B),
  `bench-smoke` (tier C), selected by pytest markers.
- Hermetic defaults: no-network socket guard, isolated `HOME`/XDG, per-test
  config and cache paths, recorded fixtures replacing live services.
- Golden governance: byte-for-byte text goldens, bootstrap and update only
  with a recorded approval, engineering-log block.
- Coverage: `pytest-cov` JSON, one threshold, staged enforcement.
- Reporting: lane JSONL, gate JSON, `dist/reports/index.html`.

## Out Of Scope
- Style and the tricky-code gate (`python-style-guide`).
- `pyproject.toml` bootstrap, CLI contracts (`python-cli-app`; its
  `pyproject-baseline.toml` already carries this skill's pytest markers and
  coverage tables).
- CI workflow files. The scripts here are the local contract CI will mirror
  once the project promotes past pre-alpha.
- Browser E2E (`playwright-browser-qa`), perf scoring frameworks
  (`rust-perf-assessment` is Rust-only; the bench lane here is a smoke and a
  perf-guard oracle, not a baseline system).

## Workflow
1. Confirm ownership and what is already configured:
   `references/ownership-and-lanes.md`.
2. Install hermetic defaults: copy `assets/templates/conftest_hermetic.py` to
   `tests/conftest.py` and `assets/templates/test_hermetic_control.py` to
   `tests/` so the guard is proven to fire (the control test fails if the
   guard is removed). Then `references/hermetic-fixtures.md` for recorded
   inputs.
3. Mark tests into lanes (`contract`, `golden`, `bench`) per
   `references/ownership-and-lanes.md`; unmarked tests are the unit lane.
4. Goldens: `references/goldens-and-approval.md`; gate with
   `scripts/golden_text_gate.sh` or a `@pytest.mark.golden` test.
5. Coverage and staging: `references/coverage-and-gate-contract.md`; copy
   `scripts/project.env.example` to `project.env` and set the stage.
6. Run `scripts/check_quality.sh` then `scripts/run_qa_matrix.sh`; read
   `dist/reports/index.html` and the gate JSON; record the first green run in
   the engineering log.

## Reference Routing
- Ownership, lane and tier definitions, marker names:
  `references/ownership-and-lanes.md`
- No-network guard, isolated home, recorded fixtures, fixture evolution:
  `references/hermetic-fixtures.md`
- Golden policy, bootstrap, update approval, log block:
  `references/goldens-and-approval.md`
- Coverage inputs, thresholds, stage/enforcement, exit codes, artifacts:
  `references/coverage-and-gate-contract.md`
- Human and machine report contracts: `references/reporting-contracts.md`

## Script Entrypoints
- `scripts/check_quality.sh`: `ruff check`, `ruff format --check`,
  `pyright` (or `mypy`), optional `pip-audit`.
- `scripts/run_qa_matrix.sh`: the pytest lanes with coverage, then
  `coverage_gate.sh` and the HTML index.
- `scripts/coverage_gate.sh`: threshold check on `coverage.json`.
- `scripts/golden_text_gate.sh --expected <golden> --actual <output>
  [--update]`.
- All scripts: root auto-detected; `PY_PROJECT_ROOT` overrides; `uv run`
  is the runner when `uv.lock` exists; bash 3.2 compatible.

## Environment Contract
- `PY_QA_STAGE` (`pre-alpha` default), `PY_QA_ENFORCE` (`0`/`1`)
- `PY_COVERAGE_MIN_LINE`, `PY_COVERAGE_ENFORCE`, `PY_COVERAGE_JSON`
- `PY_AUDIT_ENABLE`, `PY_BENCH_ENABLE`
- `PY_RUNNER` (override `uv run`)
- `GOLDEN_EXPECTED_PATH`, `GOLDEN_ACTUAL_PATH`, `GOLDEN_APPROVAL`,
  `GOLDEN_LOG_PATH`

## Output Contract
- `dist/reports/index.html`
- `dist/reports/tests/python-quality-lanes.jsonl`
- `dist/reports/tests/python-matrix-lanes.jsonl`
- `dist/reports/coverage/coverage.json`, `coverage-summary.json`
- `dist/reports/gates/python_quality_gate_result.json`
- `dist/reports/gates/python_qa_matrix_gate_result.json`
- `dist/reports/gates/python_coverage_gate_result.json`
- `dist/reports/gates/golden_text_gate_result.json` (when run)

## Core Rules
- Pre-alpha defaults to advisory; enforcement is a recorded stage change.
- Emit the gate JSON before deciding the exit code; a failed gate without
  its JSON is a harness bug.
- No test reaches the network or the real home directory unless it is
  marked `allow_network` and the reason is in the test.
- Deterministic text goldens are the v1 default; image or numeric-tolerance
  goldens are a later expansion with their own comparator.
- Every gate ships with a control that proves it can fail (the hermetic
  control test, a sabotage golden, a threshold above current coverage).
