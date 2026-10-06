#!/usr/bin/env bash
# ledger_init.sh — stamp a new debug-session hypothesis ledger from the template.
#
# Usage:
#   ledger_init.sh [--session <sid>] [--debug-root <dir>]
#
# Creates <debug-root>/<sid>/ledger.md with the session id and evidence path
# filled in, and prints the paths. Default sid: dbg-<UTC date>-<4 hex chars>.
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
session=""
debug_root="dist/debug"

while [ $# -gt 0 ]; do
  case "$1" in
    --session) session="$2"; shift 2 ;;
    --debug-root) debug_root="$2"; shift 2 ;;
    -h|--help) sed -n '2,9p' "$0"; exit 0 ;;
    *) echo "ledger_init.sh: unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [ -z "$session" ]; then
  session="dbg-$(date -u +%Y%m%d)-$(od -An -N2 -tx1 /dev/urandom | tr -d ' \n')"
fi

# Template lookup: canonical repo layout first (assets beside scripts/), then
# the installed layout, where the script pack lives at
# scripts/polymath/agentic-debugging/ and assets live in the IDE skill lanes
# of the target root (cwd).
template=""
for candidate in "$script_dir/../assets/hypothesis-ledger-template.md" \
                 "$script_dir/assets/hypothesis-ledger-template.md" \
                 ".agents/skills/agentic-debugging/assets/hypothesis-ledger-template.md" \
                 ".claude/skills/agentic-debugging/assets/hypothesis-ledger-template.md"; do
  if [ -f "$candidate" ]; then template="$candidate"; break; fi
done
if [ -z "$template" ]; then
  echo "ledger_init.sh: hypothesis-ledger-template.md not found near $script_dir or in .agents/skills/ or .claude/skills/ under $(pwd); run from the target repo root" >&2
  exit 1
fi

session_dir="$debug_root/$session"
ledger="$session_dir/ledger.md"
if [ -e "$ledger" ]; then
  echo "ledger_init.sh: $ledger already exists; refusing to overwrite" >&2
  exit 1
fi
mkdir -p "$session_dir"

sed -e "s|{{SESSION_ID}}|$session|g" \
    -e "s|{{EVIDENCE_FILE}}|$session_dir/evidence.jsonl|g" \
    -e "s|{{CREATED_AT}}|$(date -u +%Y-%m-%dT%H:%M:%SZ)|g" \
    "$template" > "$ledger"

echo "session:  $session"
echo "ledger:   $ledger"
echo "evidence: $session_dir/evidence.jsonl"
echo "NOTE: ensure $debug_root/ is git-ignored in this repository."
