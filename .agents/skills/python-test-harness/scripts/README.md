# Script Pack

Local QA harness entrypoints for `python-test-harness`. The installer
materializes them at `scripts/polymath/python-test-harness/` in the target;
copy `project.env.example` to `project.env` there (target-owned).

## Run order
```bash
./scripts/polymath/python-test-harness/check_quality.sh
./scripts/polymath/python-test-harness/run_qa_matrix.sh      # calls coverage_gate.sh
./scripts/polymath/python-test-harness/golden_text_gate.sh --expected fixtures/golden/x --actual dist/x
```

## Root and runner detection
`PY_PROJECT_ROOT` wins; else the containing Git worktree; else the installed
`scripts/polymath/` or agent-skill lane path; else the current directory.
Runner is `uv run` when `uv.lock` exists and `uv` is installed; override
with `PY_RUNNER` (empty string for bare commands).

## Environment
See `project.env.example`. Stage `pre-alpha` is advisory unless
`PY_QA_ENFORCE=1`. Exit `0` pass/advisory/skip, `2` enforced failure, `1`
contract error.

## Artifacts
`dist/reports/index.html`, `tests/python-*-lanes.jsonl`,
`coverage/coverage.json` + `coverage-summary.json`,
`gates/python_*_gate_result.json`, `gates/golden_text_gate_result.json`.
`_common.sh` is sourced by the others and is not an entrypoint.
