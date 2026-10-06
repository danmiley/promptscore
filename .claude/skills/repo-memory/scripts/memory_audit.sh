#!/usr/bin/env bash
# memory_audit.sh — deterministic contract check for docs/ai-memory/.
#
# Usage: memory_audit.sh [target-root]
#   target-root defaults to the enclosing git repo root, else the CWD.
#
# Hard failures (exit 1): missing README/INDEX, untitled lesson, missing
# one-line summary, index/file disagreement, broken index link, absolute
# host paths, obvious secret patterns.
# Advisory warnings (exit 0 unless failures also present): per-lesson and
# index size caps exceeded.
set -euo pipefail

root="${1:-}"
if [[ -z "$root" ]]; then
  root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi
mem="$root/docs/ai-memory"

fails=0
warns=0
fail() { echo "FAIL: $*"; fails=$((fails + 1)); }
warn() { echo "WARN: $*"; warns=$((warns + 1)); }

if [[ ! -d "$mem" ]]; then
  fail "memory directory not found: docs/ai-memory/ (run the repo-memory setup workflow)"
  echo "memory-audit: $fails failure(s), $warns warning(s)"
  exit 1
fi
[[ -f "$mem/README.md" ]] || fail "missing docs/ai-memory/README.md (the contract)"
[[ -f "$mem/INDEX.md" ]] || fail "missing docs/ai-memory/INDEX.md (the index)"

# --- Per-lesson checks -------------------------------------------------
lessons=()
while IFS= read -r f; do
  base="$(basename "$f")"
  [[ "$base" == "README.md" || "$base" == "INDEX.md" ]] && continue
  lessons+=("$base")

  first_line="$(head -n 1 "$f")"
  if [[ "$first_line" != "# "* ]]; then
    fail "$base: first line must be a '# Title' heading"
  fi
  # One-line summary: first non-empty line after the title.
  summary="$(sed -n '2,6p' "$f" | grep -m1 -v '^[[:space:]]*$' || true)"
  if [[ -z "$summary" ]]; then
    fail "$base: missing one-line summary after the title"
  elif [[ "$summary" == "#"* || "$summary" == "- "* ]]; then
    fail "$base: line after the title must be a plain one-line summary, not a heading or list item"
  fi

  line_count="$(wc -l < "$f" | tr -d ' ')"
  if (( line_count > 60 )); then
    warn "$base: $line_count lines (soft cap ~40; move detail to docs/ and keep a pointer lesson)"
  fi
done < <(find "$mem" -maxdepth 1 -type f -name '*.md' | sort)

# --- Index/file agreement ----------------------------------------------
if [[ -f "$mem/INDEX.md" ]]; then
  index_lines="$(wc -l < "$mem/INDEX.md" | tr -d ' ')"
  if (( index_lines > 200 )); then
    fail "INDEX.md: $index_lines lines exceeds the 200-line cap (run the consolidation workflow)"
  fi

  # Links referenced by the index.
  linked=()
  while IFS= read -r slug; do
    linked+=("$slug")
    [[ -f "$mem/$slug" ]] || fail "INDEX.md links to missing file: $slug"
  done < <(grep -o '](\([^)]*\.md\))' "$mem/INDEX.md" 2>/dev/null | sed 's/^](//; s/)$//' | sort -u)

  for base in "${lessons[@]:-}"; do
    [[ -z "$base" ]] && continue
    found=0
    for slug in "${linked[@]:-}"; do
      [[ "$slug" == "$base" ]] && { found=1; break; }
    done
    (( found )) || fail "lesson not listed in INDEX.md: $base"
  done
fi

# --- Hygiene: host paths and secret patterns ---------------------------
if hits="$(grep -rnE '(/Users/|/home/|[A-Za-z]:\\\\Users)' "$mem" 2>/dev/null)"; then
  fail "absolute host paths found:"$'\n'"$hits"
fi
if hits="$(grep -rnE '(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk-[A-Za-z0-9_-]{20,})' "$mem" 2>/dev/null)"; then
  fail "possible secrets found:"$'\n'"$hits"
fi

echo "memory-audit: ${#lessons[@]} lesson(s), $fails failure(s), $warns warning(s)"
(( fails == 0 )) || exit 1
exit 0
