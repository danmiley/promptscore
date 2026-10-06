#!/usr/bin/env bash
# coverage_gate.sh: read coverage.json (pytest-cov / coverage.py JSON) and
# compare line coverage with PY_COVERAGE_MIN_LINE. Advisory unless enforced.
# Exit 0 pass/advisory/skip, 2 enforced failure.
set -uo pipefail
script_dir="$(cd "$(dirname "$0")" && pwd -P)"
# shellcheck disable=SC1091
. "$script_dir/_common.sh"
root="$(resolve_root)"
load_project_env

reports="$root/dist/reports"; gates_dir="$reports/gates"; cov_dir="$reports/coverage"
mkdir -p "$gates_dir" "$cov_dir"
gate="$gates_dir/python_coverage_gate_result.json"
summary="$cov_dir/coverage-summary.json"
cov_json="${PY_COVERAGE_JSON:-$cov_dir/coverage.json}"
min="${PY_COVERAGE_MIN_LINE:-0}"

mode=advisory
if [ "${PY_COVERAGE_ENFORCE:-0}" = "1" ] || { [ "${PY_QA_STAGE:-pre-alpha}" != "pre-alpha" ] && [ "${PY_QA_ENFORCE:-0}" = "1" ]; }; then
  mode=enforced
fi

if [ ! -f "$cov_json" ]; then
  printf '{"schema":"python-test-harness-coverage-summary-v1","status":"skip","reason":"%s not found"}\n' "$(json_escape "$cov_json")" > "$summary"
  write_gate "$gate" "python-test-harness-coverage-gate-v1" "python_coverage" "skip" "$mode" 0 1 ",\"min_line\":\"$min\",\"reason\":\"coverage.json not found\""
  echo "coverage_gate: skip (no $cov_json)"
  exit 0
fi

# coverage.py JSON: {"totals": {"percent_covered": 72.3, ...}}. Extract with
# sed so no interpreter dependency; the first percent_covered in "totals".
pct="$(tr -d '\n' < "$cov_json" | sed -n 's/.*"totals":[[:space:]]*{[^}]*"percent_covered":[[:space:]]*\([0-9.]*\).*/\1/p')"
if [ -z "$pct" ]; then
  write_gate "$gate" "python-test-harness-coverage-gate-v1" "python_coverage" "error" "$mode" 0 0 ',"reason":"could not parse totals.percent_covered"'
  echo "coverage_gate: could not parse $cov_json" >&2
  exit 1
fi
pct_int="${pct%%.*}"
printf '{"schema":"python-test-harness-coverage-summary-v1","coverage_percent":"%s","min_line":"%s","source":"%s"}\n' "$pct" "$min" "$(json_escape "$cov_json")" > "$summary"

status=pass; exit_code=0; failures=0
if [ "$pct_int" -lt "$min" ]; then
  failures=1
  if [ "$mode" = enforced ]; then status=fail; exit_code=2; else status=advisory_fail; fi
fi
write_gate "$gate" "python-test-harness-coverage-gate-v1" "python_coverage" "$status" "$mode" "$failures" 0 ",\"coverage_percent\":\"$pct\",\"min_line\":\"$min\""
echo "coverage_gate: $status ($mode) line=$pct% min=$min%"
exit "$exit_code"
