#!/usr/bin/env bash
# check_cli_contract.sh
# Repo-agnostic baseline contract signal check for uv-managed Python CLI repos.
# Usage: check_cli_contract.sh [project_root]
# Exit 0 when every signal passes, 2 when any fails. bash 3.2 compatible.
set -uo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd -P)"

resolve_root() {
  if [ $# -ge 1 ] && [ -n "$1" ]; then
    ( cd "$1" && pwd -P )
  elif [ -n "${PY_PROJECT_ROOT:-}" ]; then
    ( cd "$PY_PROJECT_ROOT" && pwd -P )
  elif git -C "$script_dir" rev-parse --show-toplevel >/dev/null 2>&1; then
    git -C "$script_dir" rev-parse --show-toplevel
  elif [ "${script_dir#*/scripts/polymath/python-cli-app}" != "$script_dir" ]; then
    printf '%s\n' "${script_dir%%/scripts/polymath/python-cli-app*}"
  elif [ "${script_dir#*/.agents/skills/python-cli-app/scripts}" != "$script_dir" ]; then
    printf '%s\n' "${script_dir%%/.agents/skills/python-cli-app/scripts*}"
  elif [ "${script_dir#*/.claude/skills/python-cli-app/scripts}" != "$script_dir" ]; then
    printf '%s\n' "${script_dir%%/.claude/skills/python-cli-app/scripts*}"
  else
    pwd -P
  fi
}

root="$(resolve_root "${1:-}")"
report_dir="$root/dist/reports/cli-contract"
report="$report_dir/check_cli_contract_report.txt"
mkdir -p "$report_dir"
: > "$report"

pass=0
fail=0
audit() {
  label="$1"; ok="$2"
  if [ "$ok" = "yes" ]; then
    echo "PASS: $label" | tee -a "$report"; pass=$((pass + 1))
  else
    echo "FAIL: $label" | tee -a "$report"; fail=$((fail + 1))
  fi
}

# Only first-party sources count as signals; installed skill copies and the
# virtualenv are excluded so a skill's own templates cannot satisfy a check.
src_scan() { # $1 = extended regex
  grep -rEq --include='*.py' \
    --exclude-dir=.venv --exclude-dir=.agents --exclude-dir=.claude \
    --exclude-dir=polymath --exclude-dir=dist --exclude-dir=__pycache__ \
    -e "$1" "$root/src" 2>/dev/null
}
test_scan() {
  grep -rEq --include='*.py' --exclude-dir=__pycache__ -e "$1" "$root/tests" 2>/dev/null
}

echo "Python CLI contract check @ $(date -u +'%Y-%m-%dT%H:%M:%SZ') root=$root" | tee -a "$report"

[ -f "$root/pyproject.toml" ] && has_pyproject=yes || has_pyproject=no
audit "pyproject.toml present" "$has_pyproject"

[ -f "$root/uv.lock" ] && has_lock=yes || has_lock=no
audit "uv.lock present (uv-managed, pinned)" "$has_lock"

if [ "$has_pyproject" = yes ] && grep -Eq '^requires-python *= *"' "$root/pyproject.toml"; then has_pin=yes; else has_pin=no; fi
audit "requires-python pinned in pyproject" "$has_pin"

if [ "$has_pyproject" = yes ] && grep -Eq '^\[project\.scripts\]' "$root/pyproject.toml"; then has_entry=yes; else has_entry=no; fi
audit "[project.scripts] entry point declared" "$has_entry"

[ -d "$root/src" ] && has_src=yes || has_src=no
audit "src/ layout present" "$has_src"

if src_scan '--json|as_json|"json"'; then has_json=yes; else has_json=no; fi
audit "Machine-readable JSON mode signals present" "$has_json"

if src_scan 'sys\.stderr|logging\.|stderr='; then has_diag=yes; else has_diag=no; fi
audit "Diagnostic channel (stderr/logging) signals present" "$has_diag"

if src_scan 'IntEnum|exit_code|ExitCode'; then has_exit=yes; else has_exit=no; fi
audit "Exit-code taxonomy signals present" "$has_exit"

if test_scan 'subprocess\.run|CliRunner|capsys|main\(\['; then has_contract=yes; else has_contract=no; fi
audit "CLI contract test signals present" "$has_contract"

if [ "$has_pyproject" = yes ] && grep -Eq '^\[tool\.ruff' "$root/pyproject.toml" && grep -Eq '^\[tool\.(pyright|mypy)\]' "$root/pyproject.toml"; then has_lint=yes; else has_lint=no; fi
audit "Lint and type-checker configured in pyproject" "$has_lint"

echo "Summary: pass=$pass fail=$fail" | tee -a "$report"
if [ "$fail" -gt 0 ]; then exit 2; fi
exit 0
