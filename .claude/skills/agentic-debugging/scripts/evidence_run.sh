#!/usr/bin/env bash
# evidence_run.sh — run a reproduction command, capture probe JSONL into the
# session evidence file, and emit a machine-readable summary artifact.
#
# Usage:
#   evidence_run.sh --session <sid> [--debug-root <dir>] [--reports-root <dir>] -- <command...>
#
# Probe records are JSONL lines on the command's stderr containing
# "session":"<sid>"; they are appended to <debug-root>/<sid>/evidence.jsonl.
# All other output passes through to <debug-root>/<sid>/run.log (and is NOT
# echoed to the agent's terminal — read it with filters).
# Summary: <reports-root>/debug/<sid>-summary.json (skipped if the reports
# root's parent does not exist and cannot be created).
set -euo pipefail

session=""
debug_root="dist/debug"
reports_root="dist/reports"

while [ $# -gt 0 ]; do
  case "$1" in
    --session) session="$2"; shift 2 ;;
    --debug-root) debug_root="$2"; shift 2 ;;
    --reports-root) reports_root="$2"; shift 2 ;;
    --) shift; break ;;
    -h|--help) sed -n '2,13p' "$0"; exit 0 ;;
    *) echo "evidence_run.sh: unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [ -z "$session" ] || [ $# -eq 0 ]; then
  echo "evidence_run.sh: --session <sid> and a command after -- are required" >&2
  exit 2
fi

session_dir="$debug_root/$session"
mkdir -p "$session_dir"
evidence="$session_dir/evidence.jsonl"
runlog="$session_dir/run.log"
touch "$evidence"

started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
stderr_raw="$session_dir/.stderr.raw"
set +e
"$@" >> "$runlog" 2> "$stderr_raw"
exit_code=$?
set -e
finished_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Split the probe stream: JSONL lines carrying this session id are evidence;
# everything else is ordinary program stderr and goes to the run log.
grep -F "\"session\":\"$session\"" "$stderr_raw" >> "$evidence" || true
grep -Fv "\"session\":\"$session\"" "$stderr_raw" >> "$runlog" || true
rm -f "$stderr_raw"

total_records="$(wc -l < "$evidence" | tr -d ' ')"
hyp_counts="$(grep -o '"hyp":"[^"]*"' "$evidence" | sort | uniq -c |
  awk '{gsub(/"hyp":"|"/, "", $2); printf "%s{\"hyp\":\"%s\",\"records\":%s}", sep, $2, $1; sep=","}' sep="" || true)"

# JSON-escape a string: backslash, quote, and control characters.
json_escape() {
  printf '%s' "$1" | awk 'BEGIN{ORS=""} {
    gsub(/\\/, "\\\\"); gsub(/"/, "\\\""); gsub(/\t/, "\\t"); gsub(/\r/, "\\r")
    if (NR > 1) printf "\\n"
    print
  }'
}

command_str="$(printf '%s ' "$@")"
command_str="${command_str% }"

summary_dir="$reports_root/debug"
if mkdir -p "$summary_dir" 2>/dev/null; then
  summary="$summary_dir/${session}-summary.json"
  cat > "$summary" <<EOF
{
  "schema": "agentic-debugging-evidence-summary-v1",
  "session": "$session",
  "command": "$(json_escape "$command_str")",
  "started_at": "$started_at",
  "finished_at": "$finished_at",
  "exit_code": $exit_code,
  "evidence_file": "$evidence",
  "total_records": $total_records,
  "per_hypothesis": [${hyp_counts}]
}
EOF
  echo "evidence_run: summary -> $summary"
else
  echo "evidence_run: reports root unavailable; summary skipped" >&2
fi

echo "evidence_run: exit=$exit_code records=$total_records evidence=$evidence"
exit "$exit_code"
