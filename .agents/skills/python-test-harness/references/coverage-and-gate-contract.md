# Coverage and Gate Contract

## Coverage Inputs
- `pytest-cov` writes `dist/reports/coverage/coverage.json` from the `unit`
  lane (`--cov --cov-report=json:...`); `[tool.coverage.run] source` names
  the package so tests and fixtures are excluded.
- `coverage_gate.sh` reads `totals.percent_covered` from that JSON (no
  interpreter dependency) and writes `coverage-summary.json` plus the gate
  JSON.

## Threshold Environment
- `PY_COVERAGE_MIN_LINE`: integer percent; `0` while wiring tests.
- `PY_COVERAGE_ENFORCE=1` or (`PY_QA_STAGE != pre-alpha` and
  `PY_QA_ENFORCE=1`) enforces.
- Recommended ladder: bootstrap `0`; alpha `70`; beta `80`; RC `85`.
  Parsers, encoders, and comparators target near-100% with focused tests
  regardless of the ladder.

## Stage and Enforcement
- `PY_QA_STAGE=pre-alpha` and `PY_QA_ENFORCE=0`: advisory. Failures are
  recorded as `advisory_fail` and the script exits `0`.
- Anything else: enforced. Failures exit `2`.
- Promotion is a one-line change to `project.env` recorded in the
  engineering log with the run that was green at the time.

## Exit Code Contract (all scripts)
- `0`: pass, skip, or advisory outcome.
- `2`: enforced gate failure.
- `1`: contract or environment error (no `pyproject.toml`, runner missing,
  unparsable coverage, `--update` without approval).

## Required Artifacts
- `dist/reports/tests/python-quality-lanes.jsonl`
- `dist/reports/tests/python-matrix-lanes.jsonl`
- `dist/reports/coverage/coverage.json` and `coverage-summary.json`
- `dist/reports/gates/python_quality_gate_result.json`
- `dist/reports/gates/python_qa_matrix_gate_result.json`
- `dist/reports/gates/python_coverage_gate_result.json`
- `dist/reports/gates/golden_text_gate_result.json` (when run)
- `dist/reports/index.html`

## Failure-Tolerant Artifacts
Write the lane JSONL and gate JSON before deciding the exit status. A gate
that exits nonzero without its JSON is a harness defect and is fixed before
the underlying failure is investigated.

## Controls
- Coverage: run once with `PY_COVERAGE_MIN_LINE` above the current number
  and `PY_COVERAGE_ENFORCE=1`; expect exit 2 (measured on the template: 71%
  vs 90% → `fail (enforced)`, exit 2).
- Matrix: break one unit test; expect `advisory_fail` at pre-alpha and exit
  2 with `PY_QA_ENFORCE=1`.
