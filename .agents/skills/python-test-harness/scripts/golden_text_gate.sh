#!/usr/bin/env bash
# golden_text_gate.sh: byte-for-byte compare of an actual output against a
# committed golden. --update rewrites the golden only with GOLDEN_APPROVAL set
# and appends the approval block to the engineering log.
# Exit 0 match/advisory, 2 enforced mismatch, 1 contract error.
set -uo pipefail
script_dir="$(cd "$(dirname "$0")" && pwd -P)"
# shellcheck disable=SC1091
. "$script_dir/_common.sh"
root="$(resolve_root)"
load_project_env
mode="$(gate_mode)"

usage() {
  cat <<USAGE
Usage:
  golden_text_gate.sh --expected <path> --actual <path> [--update]
Environment fallbacks: GOLDEN_EXPECTED_PATH, GOLDEN_ACTUAL_PATH,
  GOLDEN_APPROVAL (required with --update), GOLDEN_LOG_PATH (default docs/ENGINEERING_LOG.md)
USAGE
}

expected="${GOLDEN_EXPECTED_PATH:-}"; actual="${GOLDEN_ACTUAL_PATH:-}"; update=0
while [ $# -gt 0 ]; do
  case "$1" in
    --expected) expected="${2:-}"; shift 2 ;;
    --actual) actual="${2:-}"; shift 2 ;;
    --update) update=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; usage >&2; exit 1 ;;
  esac
done

gates_dir="$root/dist/reports/gates"; mkdir -p "$gates_dir"
gate="$gates_dir/golden_text_gate_result.json"
case "$expected" in /*) ;; *) expected="$root/$expected" ;; esac
case "$actual" in /*) ;; *) actual="$root/$actual" ;; esac

if [ -z "$expected" ] || [ -z "$actual" ] || [ ! -f "$actual" ]; then
  write_gate "$gate" "python-test-harness-golden-gate-v1" "golden_text" "error" "$mode" 0 0 ',"reason":"expected/actual path missing or actual not found"'
  echo "golden_text_gate: need --expected and an existing --actual" >&2
  exit 1
fi

if [ "$update" -eq 1 ]; then
  if [ -z "${GOLDEN_APPROVAL:-}" ]; then
    write_gate "$gate" "python-test-harness-golden-gate-v1" "golden_text" "error" "$mode" 0 0 ',"reason":"--update requires GOLDEN_APPROVAL"'
    echo "golden_text_gate: --update requires GOLDEN_APPROVAL=<reviewer: reason>" >&2
    exit 1
  fi
  mkdir -p "$(dirname "$expected")"
  cp "$actual" "$expected"
  log="${GOLDEN_LOG_PATH:-docs/ENGINEERING_LOG.md}"
  case "$log" in /*) ;; *) log="$root/$log" ;; esac
  if [ -f "$log" ]; then
    {
      printf '\n## %s - Golden Update: %s\n' "$(date -u +%Y-%m-%d)" "$(basename "$expected")"
      printf -- '- Artifact path: %s\n- Approval: %s\n- Comparison command: golden_text_gate.sh --expected %s --actual %s\n' \
        "${expected#"$root"/}" "$GOLDEN_APPROVAL" "${expected#"$root"/}" "${actual#"$root"/}"
    } >> "$log"
  fi
  write_gate "$gate" "python-test-harness-golden-gate-v1" "golden_text" "updated" "$mode" 0 0 ",\"expected\":\"$(json_escape "${expected#"$root"/}")\""
  echo "golden_text_gate: updated $expected"
  exit 0
fi

if [ ! -f "$expected" ]; then
  write_gate "$gate" "python-test-harness-golden-gate-v1" "golden_text" "missing" "$mode" 1 0 ",\"expected\":\"$(json_escape "${expected#"$root"/}")\""
  echo "golden_text_gate: no golden at $expected (bootstrap with --update and GOLDEN_APPROVAL)"
  if [ "$mode" = enforced ]; then exit 2; fi
  exit 0
fi

if cmp -s "$expected" "$actual"; then
  write_gate "$gate" "python-test-harness-golden-gate-v1" "golden_text" "pass" "$mode" 0 0 ",\"expected\":\"$(json_escape "${expected#"$root"/}")\""
  echo "golden_text_gate: match"
  exit 0
fi

diff_path="$root/dist/reports/tests/golden-$(basename "$expected").diff"
mkdir -p "$(dirname "$diff_path")"
diff -u "$expected" "$actual" > "$diff_path"
status=advisory_fail; exit_code=0
if [ "$mode" = enforced ]; then status=fail; exit_code=2; fi
write_gate "$gate" "python-test-harness-golden-gate-v1" "golden_text" "$status" "$mode" 1 0 ",\"expected\":\"$(json_escape "${expected#"$root"/}")\",\"diff\":\"$(json_escape "${diff_path#"$root"/}")\""
echo "golden_text_gate: $status; diff at $diff_path"
exit "$exit_code"
