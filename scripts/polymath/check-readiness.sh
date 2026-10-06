#!/usr/bin/env bash
# Verify a polymath-onboarded repo: lockfile, start docs, per-lane skill contracts, script packs.
# Usage: check-readiness.sh [--target <repo>] [--ide codex|claude|antigravity|both|all] [--scope repo|user] [--json]
set -euo pipefail

target=""
ide="both"
scope="repo"
json=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) target="$2"; shift 2 ;;
    --ide) ide="$2"; shift 2 ;;
    --scope) scope="$2"; shift 2 ;;
    --json) json=1; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
case "$ide" in codex|claude|antigravity|both|all) ;; *) echo "--ide must be codex|claude|antigravity|both|all" >&2; exit 2 ;; esac
case "$scope" in repo|user) ;; *) echo "--scope must be repo|user" >&2; exit 2 ;; esac
find_polymath_root() {
  local probe
  if git rev-parse --show-toplevel >/dev/null 2>&1; then
    git rev-parse --show-toplevel
    return 0
  fi
  probe="$(pwd)"
  while [[ "$probe" != "/" ]]; do
    if [[ -f "$probe/docs/polymath-install.toml" ]]; then
      printf '%s\n' "$probe"
      return 0
    fi
    probe="$(dirname "$probe")"
  done
  return 1
}

if [[ "$scope" == "repo" ]]; then
  if [[ -z "$target" ]]; then
    target="$(find_polymath_root || true)"
  fi
  [[ -n "$target" && -d "$target" ]] || { echo "--target <repo> required (or run inside a Git/polymath repo)" >&2; exit 2; }
  target="$(cd "$target" && pwd)"
else
  [[ "$ide" == "antigravity" ]] || { echo "--scope user currently supports --ide antigravity only" >&2; exit 2; }
  target="${HOME:?}/.gemini/config"
fi

ide_has() { # $1=codex|claude|antigravity
  case "$ide:$1" in
    codex:codex|both:codex|all:codex) return 0 ;;
    claude:claude|both:claude|all:claude) return 0 ;;
    antigravity:antigravity|all:antigravity) return 0 ;;
    *) return 1 ;;
  esac
}

missing=()
warnings=()

if [[ "$scope" == "repo" ]]; then
  lockfile="$target/docs/polymath-install.toml"
  [[ -f "$lockfile" ]] || missing+=("docs/polymath-install.toml (no polymath install recorded)")
else
  lockfile="$target/polymath-global-install.toml"
  [[ -f "$lockfile" ]] || missing+=("polymath-global-install.toml (no polymath user install recorded)")
fi

if [[ "$scope" == "repo" ]]; then
  for doc in AGENTS.md READMEFIRST.md docs/starting-prompt.md docs/ARCHITECTURE.md docs/ENGINEERING_LOG.md; do
    [[ -f "$target/$doc" ]] || missing+=("$doc")
  done
  if ide_has claude; then
    [[ -f "$target/CLAUDE.md" ]] || missing+=("CLAUDE.md")
  fi
fi

skills=""
if [[ -f "$lockfile" ]]; then
  skills="$(awk '/^\[skills\]/{f=1;next} f&&/^\[/{exit} f&&/=/{print $1}' "$lockfile")"
  [[ -n "$skills" ]] || warnings+=("lockfile lists no skills")
fi

skill_expected() { # $1=skill directory name
  local needle="$1" name
  for name in $skills; do [[ "$name" == "$needle" ]] && return 0; done
  return 1
}

# Discovery directories not represented in the lockfile remain invocable and
# can silently change routing. Report them even when all tracked files are sound.
if [[ "$scope" == "repo" ]]; then
  lanes=()
  if ide_has codex || ide_has antigravity; then lanes+=(".agents/skills"); fi
  if ide_has claude; then lanes+=(".claude/skills"); fi
else
  lanes=("skills")
fi

for lane in "${lanes[@]}"; do
  [[ -d "$target/$lane" ]] || continue
  while IFS= read -r dir; do
    name="$(basename "$dir")"
    skill_expected "$name" || warnings+=("$lane/$name is not represented in the lockfile (untracked skill)")
  done < <(find "$target/$lane" -mindepth 1 -maxdepth 1 -type d | sort)
done

# The canonical checker knows its checkout's VERSION; the copy shipped into a
# target generally does not. Warn only when that comparison is locally knowable.
source_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -f "$lockfile" && -f "$source_root/VERSION" && -f "$source_root/catalog/catalog.toml" ]]; then
  installed_version="$(awk -F'"' '/^source_version = "/{print $2; exit}' "$lockfile")"
  available_version="$(tr -d '[:space:]' < "$source_root/VERSION")"
  if [[ -n "$installed_version" && "$installed_version" != "$available_version" ]]; then
    warnings+=("lockfile source_version $installed_version differs from available source $available_version")
  fi
fi

for name in $skills; do
  if [[ "$scope" == "repo" ]] && { ide_has codex || ide_has antigravity; }; then
    [[ -f "$target/.agents/skills/$name/SKILL.md" ]] || missing+=(".agents/skills/$name/SKILL.md")
  fi
  if [[ "$scope" == "repo" ]] && ide_has claude; then
    [[ -f "$target/.claude/skills/$name/SKILL.md" ]] || missing+=(".claude/skills/$name/SKILL.md")
  fi
  if [[ "$scope" == "user" ]] && ide_has antigravity; then
    [[ -f "$target/skills/$name/SKILL.md" ]] || missing+=("skills/$name/SKILL.md")
  fi
  if [[ "$scope" == "repo" && -d "$target/scripts/polymath/$name" ]]; then
    if [[ -f "$target/scripts/polymath/$name/project.env.example" && ! -f "$target/scripts/polymath/$name/project.env" ]]; then
      warnings+=("scripts/polymath/$name/project.env not yet created from project.env.example")
    fi
  fi
done

# Lockfile-vs-disk integrity: flag tracked files that are missing or modified.
if [[ -f "$lockfile" ]]; then
  git_worktree=0
  if [[ "$scope" == "repo" ]]; then
    git -C "$target" rev-parse --is-inside-work-tree >/dev/null 2>&1 && git_worktree=1
  fi
  sha() {
    if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | awk '{print $1}'
    else shasum -a 256 "$1" | awk '{print $1}'; fi
  }
  while IFS=$'\t' read -r p h; do
    if [[ ! -f "$target/$p" ]]; then
      missing+=("$p (lockfile-tracked file missing)")
    elif [[ "$(sha "$target/$p")" != "$h" ]]; then
      warnings+=("$p differs from lockfile hash (locally modified or stale)")
    fi
    if [[ "$git_worktree" -eq 1 && -f "$target/$p" ]]; then
      if git -C "$target" check-ignore -q -- "$p" 2>/dev/null; then
        warnings+=("$p is ignored by Git (repo-scope install will not survive a fresh checkout)")
      elif ! git -C "$target" ls-files --error-unmatch -- "$p" >/dev/null 2>&1; then
        warnings+=("$p is not tracked by Git (repo-scope install is checkout-local)")
      fi
    fi
  done < <(awk -F'"' '
    /^\[\[files\]\]/ { in_f=1; p=""; next }
    /^\[\[/ { in_f=0 }
    /^\[/ && $0 !~ /^\[\[files\]\]/ { in_f=0 }
    in_f && /^path = "/ { p=$2 }
    in_f && /^sha256 = "/ { print p "\t" $2 }
  ' "$lockfile")
fi

status="OK"
[[ ${#missing[@]} -gt 0 ]] && status="FAIL"

if [[ "$json" -eq 1 ]]; then
  printf '{"status":"%s","ide":"%s","missing":[' "$status" "$ide"
  for i in "${!missing[@]}"; do [[ $i -gt 0 ]] && printf ','; printf '"%s"' "${missing[$i]}"; done
  printf '],"warnings":['
  for i in "${!warnings[@]}"; do [[ $i -gt 0 ]] && printf ','; printf '"%s"' "${warnings[$i]}"; done
  printf ']}\n'
else
  echo "readiness: $status (ide=$ide scope=$scope)"
  [[ ${#missing[@]} -gt 0 ]] && printf 'missing:\n' && printf '  %s\n' "${missing[@]}"
  [[ ${#warnings[@]} -gt 0 ]] && printf 'warnings:\n' && printf '  %s\n' "${warnings[@]}"
fi

[[ "$status" == "OK" ]]
