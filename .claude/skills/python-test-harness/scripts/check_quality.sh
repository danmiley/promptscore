#!/usr/bin/env bash
# check_quality.sh: the four static gates (ruff check, ruff format --check,
# pyright, pip-audit when available) with a stable lane JSONL and gate JSON.
# Exit 0 pass/advisory, 2 enforced failure, 1 contract error.
set -uo pipefail
script_dir="$(cd "$(dirname "$0")" && pwd -P)"
# shellcheck disable=SC1091
. "$script_dir/_common.sh"
root="$(resolve_root)"
load_project_env
prefix="$(runner_prefix)"
mode="$(gate_mode)"

reports="$root/dist/reports"; tests_dir="$reports/tests"; gates_dir="$reports/gates"
mkdir -p "$tests_dir" "$gates_dir"
lanes="$tests_dir/python-quality-lanes.jsonl"
gate="$gates_dir/python_quality_gate_result.json"
: > "$lanes"

if [ ! -f "$root/pyproject.toml" ]; then
  echo "check_quality: no pyproject.toml at $root" >&2
  write_gate "$gate" "python-test-harness-quality-gate-v1" "python_quality" "error" "$mode" 0 0 ',"reason":"pyproject.toml not found"'
  exit 1
fi

failures=0; skips=0
run_lane() { # name cmd
  ( cd "$root" && sh -c "$2" )
  code=$?
  status=pass
  if [ "$code" -ne 0 ]; then status=fail; failures=$((failures + 1)); fi
  printf '{"schema":"python-test-harness-lane-v1","lane":"%s","tier":"static","status":"%s","exit_code":%s,"command":"%s"}\n' \
    "$(json_escape "$1")" "$status" "$code" "$(json_escape "$2")" >> "$lanes"
}
skip_lane() {
  skips=$((skips + 1))
  printf '{"schema":"python-test-harness-lane-v1","lane":"%s","tier":"static","status":"skip","reason":"%s"}\n' \
    "$(json_escape "$1")" "$(json_escape "$2")" >> "$lanes"
}
tool_available() { # tool name; true if `prefix tool --version` works
  ( cd "$root" && sh -c "$prefix $1 --version" ) >/dev/null 2>&1
}

if tool_available ruff; then
  run_lane "ruff-check" "$prefix ruff check"
  run_lane "ruff-format" "$prefix ruff format --check"
else
  skip_lane "ruff-check" "ruff not available via '$prefix'"
  skip_lane "ruff-format" "ruff not available via '$prefix'"
fi

if grep -Eq '^\[tool\.pyright\]' "$root/pyproject.toml" && tool_available pyright; then
  run_lane "pyright" "$prefix pyright"
elif grep -Eq '^\[tool\.mypy\]' "$root/pyproject.toml" && tool_available mypy; then
  run_lane "mypy" "$prefix mypy"
else
  skip_lane "typecheck" "no [tool.pyright]/[tool.mypy] section with an available checker"
fi

if [ "${PY_AUDIT_ENABLE:-0}" = "1" ] && tool_available pip-audit; then
  run_lane "pip-audit" "$prefix pip-audit"
else
  skip_lane "pip-audit" "PY_AUDIT_ENABLE!=1 or pip-audit unavailable"
fi

status=pass; exit_code=0
if [ "$failures" -gt 0 ]; then
  if [ "$mode" = enforced ]; then status=fail; exit_code=2; else status=advisory_fail; fi
fi
write_gate "$gate" "python-test-harness-quality-gate-v1" "python_quality" "$status" "$mode" "$failures" "$skips" ',"lanes":"dist/reports/tests/python-quality-lanes.jsonl"'
echo "check_quality: $status ($mode) failures=$failures skips=$skips"
exit "$exit_code"
