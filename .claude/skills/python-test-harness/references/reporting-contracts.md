# Reporting Contracts (Human and Machine)

## Human-Readable Index
`dist/reports/index.html`, rewritten by `run_qa_matrix.sh`: matrix status,
quality-gate status, links to every gate JSON and lane JSONL, and a "next
actions" line. It is a plain page; no assets, no scripts.

## Machine-Readable Minimum
Lane records (`python-test-harness-lane-v1`):
```json
{"schema":"python-test-harness-lane-v1","lane":"unit","tier":"A","status":"pass","exit_code":0,"command":"uv run pytest -m ..."}
{"schema":"python-test-harness-lane-v1","lane":"bench-smoke","tier":"C","status":"skip","reason":"PY_BENCH_ENABLE!=1"}
```
Gate records (`python-test-harness-<gate>-gate-v1`):
```json
{"schema":"python-test-harness-matrix-gate-v1","gate":"python_qa_matrix","status":"advisory_fail","mode":"advisory","failures":1,"skips":2,"lanes":"dist/reports/tests/python-matrix-lanes.jsonl"}
```
`status` is one of `pass`, `advisory_fail`, `fail`, `skip`, `missing`,
`updated`, `error`. `mode` is `advisory` or `enforced`.

## Stability Rule
Paths and schema strings are stable across tool versions so an agent or a
later CI job parses them without repo-specific logic. Adding a field is
compatible; renaming or removing one bumps the schema suffix.

## Failure Context Rule
Every failed or skipped lane carries a `reason` or the failing `command`
and `exit_code`; a reader should not need the terminal scrollback to know
what to re-run.
