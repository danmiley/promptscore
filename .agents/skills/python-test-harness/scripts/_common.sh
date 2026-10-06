#!/usr/bin/env bash
# Shared helpers for python-test-harness scripts. Sourced, not executed.
# bash 3.2 compatible: no arrays-by-reference, no process substitution, no mapfile.

resolve_root() {
  if [ -n "${PY_PROJECT_ROOT:-}" ]; then
    ( cd "$PY_PROJECT_ROOT" && pwd -P )
  elif git -C "$script_dir" rev-parse --show-toplevel >/dev/null 2>&1; then
    git -C "$script_dir" rev-parse --show-toplevel
  elif [ "${script_dir#*/scripts/polymath/python-test-harness}" != "$script_dir" ]; then
    printf '%s\n' "${script_dir%%/scripts/polymath/python-test-harness*}"
  elif [ "${script_dir#*/.agents/skills/python-test-harness/scripts}" != "$script_dir" ]; then
    printf '%s\n' "${script_dir%%/.agents/skills/python-test-harness/scripts*}"
  elif [ "${script_dir#*/.claude/skills/python-test-harness/scripts}" != "$script_dir" ]; then
    printf '%s\n' "${script_dir%%/.claude/skills/python-test-harness/scripts*}"
  else
    pwd -P
  fi
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

load_project_env() {
  if [ -f "$script_dir/project.env" ]; then
    # shellcheck disable=SC1091
    . "$script_dir/project.env"
  fi
}

# Runner prefix: `uv run` when a uv project is detected and uv is installed,
# else bare commands (a pre-activated venv or system tools). PY_RUNNER set to
# any value, including the empty string, overrides detection.
runner_prefix() {
  if [ "${PY_RUNNER+set}" = set ]; then
    printf '%s' "$PY_RUNNER"
  elif [ -f "$root/uv.lock" ] && command -v uv >/dev/null 2>&1; then
    printf 'uv run'
  else
    printf ''
  fi
}

gate_mode() {
  stage="${PY_QA_STAGE:-pre-alpha}"
  enforce="${PY_QA_ENFORCE:-0}"
  if [ "$stage" != "pre-alpha" ] || [ "$enforce" = "1" ]; then
    printf 'enforced'
  else
    printf 'advisory'
  fi
}

# write_gate <gate_file> <schema> <gate_name> <status> <mode> <failures> <skips> <extra_json_fields>
write_gate() {
  printf '{"schema":"%s","gate":"%s","status":"%s","mode":"%s","failures":%s,"skips":%s%s}\n' \
    "$2" "$3" "$4" "$5" "$6" "$7" "$8" > "$1"
}
