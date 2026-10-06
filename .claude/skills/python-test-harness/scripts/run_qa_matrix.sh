#!/usr/bin/env bash
# run_qa_matrix.sh: pytest lanes (unit, contract, golden, bench-smoke) with
# coverage, then coverage_gate.sh and the report index.
# Exit 0 pass/advisory, 2 enforced failure, 1 contract error.
set -uo pipefail
script_dir="$(cd "$(dirname "$0")" && pwd -P)"
# shellcheck disable=SC1091
. "$script_dir/_common.sh"
root="$(resolve_root)"
load_project_env
prefix="$(runner_prefix)"
mode="$(gate_mode)"

reports="$root/dist/reports"; tests_dir="$reports/tests"; gates_dir="$reports/gates"; cov_dir="$reports/coverage"
mkdir -p "$tests_dir" "$gates_dir" "$cov_dir"
lanes="$tests_dir/python-matrix-lanes.jsonl"
gate="$gates_dir/python_qa_matrix_gate_result.json"
: > "$lanes"

if [ ! -f "$root/pyproject.toml" ]; then
  echo "run_qa_matrix: no pyproject.toml at $root" >&2
  write_gate "$gate" "python-test-harness-matrix-gate-v1" "python_qa_matrix" "error" "$mode" 0 0 ',"reason":"pyproject.toml not found"'
  exit 1
fi
if ! ( cd "$root" && sh -c "$prefix pytest --version" ) >/dev/null 2>&1; then
  echo "run_qa_matrix: pytest not available via '$prefix'" >&2
  write_gate "$gate" "python-test-harness-matrix-gate-v1" "python_qa_matrix" "error" "$mode" 0 0 ',"reason":"pytest unavailable"'
  exit 1
fi

failures=0; skips=0
run_lane() { # name tier cmd
  ( cd "$root" && sh -c "$3" )
  code=$?
  status=pass
  # pytest exit 5 = no tests collected: a skip, not a failure.
  if [ "$code" -eq 5 ]; then
    status=skip; skips=$((skips + 1))
  elif [ "$code" -ne 0 ]; then
    status=fail; failures=$((failures + 1))
  fi
  printf '{"schema":"python-test-harness-lane-v1","lane":"%s","tier":"%s","status":"%s","exit_code":%s,"command":"%s"}\n' \
    "$(json_escape "$1")" "$2" "$status" "$code" "$(json_escape "$3")" >> "$lanes"
}

# pytest-cov present when pytest's own help lists --cov (no interpreter probe).
cov_args=""
if ( cd "$root" && sh -c "$prefix pytest --help" 2>/dev/null | grep -q -- '--cov' ); then
  cov_args="--cov --cov-report=json:dist/reports/coverage/coverage.json --cov-report=term"
fi

# Tier A: unit (everything not marked contract/golden/bench), with coverage.
run_lane "unit" "A" "$prefix pytest -m 'not contract and not golden and not bench' $cov_args"
# Tier B: contract (spawned CLI) and golden lanes.
run_lane "contract" "B" "$prefix pytest -m contract"
run_lane "golden" "B" "$prefix pytest -m golden"
# Tier C: bench smoke only when explicitly enabled.
if [ "${PY_BENCH_ENABLE:-0}" = "1" ]; then
  run_lane "bench-smoke" "C" "$prefix pytest -m bench --benchmark-only --benchmark-json=dist/reports/tests/bench.json"
else
  skips=$((skips + 1))
  printf '{"schema":"python-test-harness-lane-v1","lane":"bench-smoke","tier":"C","status":"skip","reason":"PY_BENCH_ENABLE!=1"}\n' >> "$lanes"
fi

# Coverage gate (writes its own gate file; its exit is folded in below).
"$script_dir/coverage_gate.sh"
cov_exit=$?
if [ "$cov_exit" -eq 2 ]; then failures=$((failures + 1)); fi

status=pass; exit_code=0
if [ "$failures" -gt 0 ]; then
  if [ "$mode" = enforced ]; then status=fail; exit_code=2; else status=advisory_fail; fi
fi
write_gate "$gate" "python-test-harness-matrix-gate-v1" "python_qa_matrix" "$status" "$mode" "$failures" "$skips" ',"lanes":"dist/reports/tests/python-matrix-lanes.jsonl"'

quality_status="unknown"
if [ -f "$gates_dir/python_quality_gate_result.json" ]; then
  quality_status="$(sed -n 's/.*"status":"\([a-z_]*\)".*/\1/p' "$gates_dir/python_quality_gate_result.json")"
fi
cat > "$reports/index.html" <<HTML
<!doctype html>
<html><head><meta charset="utf-8"><title>Python QA report</title></head>
<body>
<h1>Python QA report</h1>
<p>QA matrix: $status ($mode). Failures: $failures. Skipped lanes: $skips. Quality gate: $quality_status.</p>
<ul>
<li><a href="gates/python_quality_gate_result.json">Quality gate</a> / <a href="tests/python-quality-lanes.jsonl">lanes</a></li>
<li><a href="gates/python_qa_matrix_gate_result.json">QA matrix gate</a> / <a href="tests/python-matrix-lanes.jsonl">lanes</a></li>
<li><a href="gates/python_coverage_gate_result.json">Coverage gate</a> / <a href="coverage/coverage-summary.json">summary</a></li>
<li><a href="gates/golden_text_gate_result.json">Golden text gate</a> (when run)</li>
</ul>
<p>Next actions: inspect failed or skipped lanes; set PY_QA_ENFORCE=1 only after thresholds are agreed.</p>
</body></html>
HTML
echo "run_qa_matrix: $status ($mode) failures=$failures skips=$skips"
exit "$exit_code"
