#!/usr/bin/env bash
# probe_cleanup.sh — remove POLYDBG marker-delimited probes; verify zero residue.
#
# Usage:
#   probe_cleanup.sh --session <sid> [--root <dir>]        remove probes for one session
#   probe_cleanup.sh --all [--root <dir>]                  remove probes for every session
#   probe_cleanup.sh --check [--list] [--allow-armed <sid>] [--root <dir>]
#                                                          zero-residue scan; exits 1 on any survivor
#
# The scan covers source files under --root (default: current directory),
# excluding VCS/build/report/evidence trees and this script pack itself.
# Marker grammar (see the skill's instrumentation-menu reference):
#   // POLYDBG-BEGIN <sid> <probe-id>   ...   // POLYDBG-END <sid> <probe-id>
#   // POLYDBG <sid> <probe-id>         (single-line probe)
set -euo pipefail

MARKER="POLYDBG"
root="."
mode=""
session=""
list=0
allow_armed=""

while [ $# -gt 0 ]; do
  case "$1" in
    --session) session="$2"; mode="${mode:-remove}"; shift 2 ;;
    --all) mode="remove-all"; shift ;;
    --check) mode="check"; shift ;;
    --list) list=1; shift ;;
    --allow-armed) allow_armed="$2"; shift 2 ;;
    --root) root="$2"; shift 2 ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) echo "probe_cleanup.sh: unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [ -z "$mode" ]; then
  echo "probe_cleanup.sh: one of --session <sid>, --all, or --check is required" >&2
  exit 2
fi

root="$(cd "$root" && pwd)"
self_name="$(basename "$0")"

# Files eligible for probe scanning: exclude VCS, build output, deps,
# evidence/report roots, docs, installed skill/script-pack copies (whose
# references and snippet assets legitimately contain the marker token), and
# this script itself.
scan_files() {
  find "$root" -type f \
    ! -path '*/.git/*' \
    ! -path '*/target/*' \
    ! -path '*/node_modules/*' \
    ! -path '*/dist/*' \
    ! -path '*/.venv/*' \
    ! -path '*/docs/*' \
    ! -path '*/scripts/polymath/*' \
    ! -path '*/.agents/skills/*' \
    ! -path '*/.claude/skills/*' \
    ! -path '*/skills/agentic-debugging/*' \
    ! -name "$self_name" \
    ! -name '*.jsonl' \
    ! -name '*.min.*' \
    -print
}

matching_files() { # $1 = pattern
  scan_files | while IFS= read -r f; do
    if grep -Iq "$1" "$f" 2>/dev/null; then printf '%s\n' "$f"; fi
  done
}

remove_from_file() { # $1 = file, $2 = sid ("" for all sessions)
  local f="$1" sid="$2" tmp
  tmp="$(mktemp)"
  awk -v marker="$MARKER" -v sid="$sid" '
    BEGIN { inblock = 0 }
    {
      if (inblock) {
        if (index($0, marker "-END") > 0 && (sid == "" || index($0, sid) > 0)) inblock = 0
        next
      }
      if (index($0, marker "-BEGIN") > 0 && (sid == "" || index($0, sid) > 0)) { inblock = 1; next }
      # single-line probe marker (not BEGIN/END)
      if (index($0, marker) > 0 && index($0, marker "-BEGIN") == 0 && index($0, marker "-END") == 0) {
        if (sid == "" || index($0, sid) > 0) next
      }
      print
    }
  ' "$f" > "$tmp"
  mv "$tmp" "$f"
}

case "$mode" in
  remove|remove-all)
    sid=""
    [ "$mode" = "remove" ] && sid="$session"
    if [ "$mode" = "remove" ] && [ -z "$sid" ]; then
      echo "probe_cleanup.sh: --session requires a session id" >&2; exit 2
    fi
    count=0
    while IFS= read -r f; do
      remove_from_file "$f" "$sid"
      count=$((count + 1))
      echo "cleaned: ${f#"$root"/}"
    done < <(matching_files "$MARKER")
    echo "probe_cleanup: removed ${MARKER} probe blocks from $count file(s)${sid:+ for session $sid}"
    ;;
  check)
    residue=0
    while IFS= read -r f; do
      while IFS= read -r line; do
        if [ -n "$allow_armed" ] && printf '%s' "$line" | grep -q "$allow_armed"; then
          continue
        fi
        residue=$((residue + 1))
        if [ "$list" -eq 1 ]; then
          printf '%s\n' "$line"
        else
          printf 'RESIDUE %s\n' "${f#"$root"/}:$(printf '%s' "$line" | sed 's/^[[:space:]]*//' | cut -c1-120)"
        fi
      done < <(grep -In "$MARKER" "$f" 2>/dev/null || true)
    done < <(matching_files "$MARKER")
    if [ "$residue" -gt 0 ]; then
      echo "probe_cleanup: FAIL — $residue surviving ${MARKER} marker line(s) found under $root" >&2
      exit 1
    fi
    echo "probe_cleanup: OK — zero ${MARKER} residue under $root${allow_armed:+ (armed session $allow_armed excluded)}"
    ;;
esac
