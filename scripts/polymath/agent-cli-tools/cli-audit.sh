#!/usr/bin/env bash
#
# cli-audit.sh — audit (and optionally install) the agent CLI toolbelt.
#
# Companion to the agent-cli-tools skill. Reports which curated CLI tools are
# present on PATH, grouped by utility tier and category, and can prompt-install
# what is missing across Homebrew, Go, uv (Python), gem (Ruby), cargo (Rust),
# and manually installed vendor tools.
#
# Written for the STOCK macOS /bin/bash 3.2 (no associative arrays, no mapfile).
# Runs fine on newer bash too.
#
set -uo pipefail

SHOW_VERSIONS=0
DO_INSTALL=0
LANG_FILTER="all"   # all | core | rust | python | ruby
TIER_FILTER="all"   # all | 1 | 2 | 3 | 4

usage() {
  cat <<'EOF'
cli-audit.sh — audit a machine for the agent CLI toolbelt.

Usage:
  cli-audit.sh                      Audit; show installed vs missing.
  cli-audit.sh --versions           Also print versions of installed tools.
  cli-audit.sh --install            Prompt-install everything missing (asks first).
  cli-audit.sh --lang LANG          Limit to one cluster: core | rust | python | ruby | all.
  cli-audit.sh --tier N             Limit to one tier: 1 | 2 | 3 | 4 | all.
  cli-audit.sh --help

Examples:
  cli-audit.sh --lang rust --install     Audit + install just the Rust cluster.
  cli-audit.sh --tier 1                   Show only Tier 1 (everyday) tools.

Notes:
  * Installs are grouped by method: brew, go, uv, gem, cargo. Each group asks
    before running. Nothing installs without confirmation.
  * Manual vendor tools are reported with their official install page and are
    never installed by this script.
  * Some formula names differ from the binary (delta -> git-delta,
    difft -> difftastic, sg -> ast-grep). If a brew line errors,
    `brew info <name>` is the arbiter.
  * Presence is checked by name on PATH, not by identity — an unrelated binary
    can shadow a name. Treat "ok" as "something by this name exists."
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --versions) SHOW_VERSIONS=1 ;;
    --install)  DO_INSTALL=1 ;;
    --lang)     shift; LANG_FILTER="${1:-all}" ;;
    --lang=*)   LANG_FILTER="${1#--lang=}" ;;
    --tier)     shift; TIER_FILTER="${1:-all}" ;;
    --tier=*)   TIER_FILTER="${1#--tier=}" ;;
    -h|--help)  usage; exit 0 ;;
    "")         : ;;
    *)          echo "Unknown option: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

case "$LANG_FILTER" in
  all|core|rust|python|ruby) : ;;
  *) echo "Invalid --lang: $LANG_FILTER (use core|rust|python|ruby|all)" >&2; exit 2 ;;
esac
case "$TIER_FILTER" in
  all|1|2|3|4) : ;;
  *) echo "Invalid --tier: $TIER_FILTER (use 1|2|3|4|all)" >&2; exit 2 ;;
esac

# ---- colors (respect NO_COLOR and non-tty) --------------------------------
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GRN=$'\033[32m'
  YLW=$'\033[33m'; BLU=$'\033[34m'; RST=$'\033[0m'
else
  BOLD=""; DIM=""; RED=""; GRN=""; YLW=""; BLU=""; RST=""
fi

# ---- environment ----------------------------------------------------------
if [ "$(uname -s)" != "Darwin" ]; then
  printf '%sNote:%s not macOS — Homebrew/install hints still assume brew.\n\n' "$YLW" "$RST"
fi
if command -v brew >/dev/null 2>&1; then
  printf '%sHomebrew:%s %s\n' "$BOLD" "$RST" "$(command -v brew)"
else
  printf '%sHomebrew not found.%s Get it at https://brew.sh\n' "$RED" "$RST"
fi
printf '%sFilters:%s lang=%s tier=%s\n\n' "$DIM" "$RST" "$LANG_FILTER" "$TIER_FILTER"

# ---- tool catalog ---------------------------------------------------------
# Format: binary|installer_arg|method|tier|lang|category|description
# method: brew | go | uv | gem | cargo | manual | builtin
# lang:   core | rust | python | ruby
TOOLS='
rg|ripgrep|brew|1|core|Search & code intel|Fast recursive content search; respects .gitignore. The search workhorse.
fd|fd|brew|1|core|Search & code intel|Fast, gitignore-aware find replacement.
sg|ast-grep|brew|1|core|Search & code intel|Structural search/rewrite by syntax tree (tree-sitter).
tree|tree|brew|1|core|Search & code intel|Directory overview; cheap repo orientation.
jq|jq|brew|1|core|Structured data|Command-line JSON processor. Essential.
yq|yq|brew|1|core|Structured data|YAML/TOML/XML processor (jq-like).
sd|sd|brew|1|core|Structured data|Intuitive sed replacement for find/replace.
gh|gh|brew|1|core|Repo ops|GitHub PRs/issues/checks/releases from the terminal.
codex|https://developers.openai.com/codex/cli/|manual|2|core|Agentic AI|Agentic coding CLI; use codex exec for non-interactive repository tasks.
comby|comby|brew|2|core|Search & code intel|Structural search-and-replace across many languages.
ctags|universal-ctags|brew|2|core|Search & code intel|Universal Ctags symbol/tag index.
tokei|tokei|brew|2|core|Search & code intel|Fast LOC / language composition.
scc|scc|brew|2|core|Search & code intel|LOC + complexity + COCOMO estimate.
tree-sitter|tree-sitter|brew|2|core|Search & code intel|Parse source into ASTs.
gron|gron|brew|2|core|Structured data|Flatten JSON to greppable path=value lines.
jc|jc|brew|2|core|Structured data|Convert CLI output (ls/ps/df) into JSON.
rga|ripgrep-all|brew|2|core|Search & code intel|ripgrep over PDFs/Office/archives.
repomix|repomix|brew|2|core|LLM context|Pack a repo into one AI-friendly file.
code2prompt|code2prompt|brew|2|core|LLM context|Codebase -> single LLM prompt with token counts.
hyperfine|hyperfine|brew|2|core|Run & bench|Command-line benchmarking.
watchexec|watchexec|brew|2|core|Run & bench|Run commands when files change.
entr|entr|brew|2|core|Run & bench|Classic file-watcher; rerun-on-change.
pandoc|pandoc|brew|2|core|Documents|Convert Markdown/HTML/DOCX/LaTeX.
xh|xh|brew|2|core|HTTP|Fast HTTPie-like API client.
markdownlint|markdownlint-cli|brew|2|core|Validation|Lint Markdown/CommonMark with configurable, CI-friendly rules.
shellcheck|shellcheck|brew|2|core|Validation|Static analysis for shell scripts.
shfmt|shfmt|brew|2|core|Validation|Format shell scripts.
just|just|brew|2|core|Run & bench|Project command runner.
mise|mise|brew|2|core|Run & bench|Per-repo tool/language version manager.
difft|difftastic|brew|2|core|Diff & review|Structural (AST) diff (human-facing).
delta|git-delta|brew|2|core|Diff & review|Syntax-highlight git pager (human-facing).
magick|imagemagick|brew|3|core|Image|Image convert + compare (visual diff/heat map).
odiff|odiff|brew|3|core|Image|Very fast pixel image diff with metadata.
perceptualdiff|perceptualdiff|brew|3|core|Image|Perceptual image diff.
exiftool|exiftool|brew|3|core|Image|Inspect image/doc metadata.
ffprobe|ffmpeg|brew|3|core|Image|Inspect/sample video/audio.
pdftotext|poppler|brew|3|core|Documents|Extract text from PDFs.
tesseract|tesseract|brew|3|core|Documents|OCR engine for images/scans.
gitleaks|gitleaks|brew|3|core|Security|Scan repos for leaked secrets.
trufflehog|trufflehog|brew|3|core|Security|Deep secret scanning across git history.
trivy|trivy|brew|3|core|Security|Vuln/misconfig/secret scanner.
semgrep|semgrep|brew|3|core|Security|Rule-based static analysis, many languages.
osv-scanner|osv-scanner|brew|3|core|Security|Dependency vulnerability scanning.
syft|syft|brew|3|core|Security|Generate SPDX/CycloneDX SBOMs from filesystems and artifacts.
mlr|miller|brew|3|core|Tabular data|awk/sed/cut/jq for CSV/TSV/JSON records.
xsv|xsv|brew|3|core|Tabular data|Fast CSV slice/stat/join/sample.
sqlite-utils|sqlite-utils|brew|3|core|Tabular data|Build local SQLite indexes from JSON/CSV.
dot|graphviz|brew|3|core|Diagrams|Render dependency/call graphs.
mmdc|mermaid-cli|brew|3|core|Diagrams|Render Mermaid diagrams from text.
llm|llm|brew|3|core|LLM context|Pluggable CLI for prompts/embeddings (S. Willison).
files-to-prompt|files-to-prompt|uv|2|core|LLM context|Concatenate files into one prompt.
csearch|github.com/google/codesearch/cmd/csearch|go|3|core|Search & code intel|Trigram-indexed regex search (run cindex first).
cargo-nextest|cargo-nextest|brew|2|rust|Rust|Faster, clearer Rust test runner.
cargo-deny|cargo-deny|brew|2|rust|Rust|License/advisory/banned-crate checks.
cargo-audit|cargo-audit|cargo|2|rust|Rust|RUSTSEC advisory scan of the lockfile.
cargo-machete|cargo-machete|cargo|3|rust|Rust|Find unused dependencies.
cargo-expand|cargo-expand|cargo|3|rust|Rust|Expand macros to generated code.
cargo-semver-checks|cargo-semver-checks|cargo|3|rust|Rust|Check public-API semver compatibility against a release baseline.
bacon|bacon|brew|2|rust|Rust|Background check/clippy/test on change.
samply|samply|brew|3|rust|Rust|Sampling profiler / flamegraphs.
ruff|ruff|brew|1|python|Python|Very fast Python linter + formatter.
uv|uv|brew|1|python|Python|Fast package/project/venv manager + tool installer.
mypy|mypy|uv|2|python|Python|Static type checker.
pyright|pyright|brew|2|python|Python|Faster type checker / language server.
pytest|pytest|uv|2|python|Python|De-facto Python test runner.
bandit|bandit|uv|3|python|Python|Security-focused static analysis.
pip-audit|pip-audit|uv|3|python|Python|Scan deps for known CVEs.
pipdeptree|pipdeptree|uv|3|python|Python|Dependency tree inspection.
rubocop|rubocop|gem|1|ruby|Ruby|Ruby linter/formatter (community style).
standardrb|standard|gem|2|ruby|Ruby|Opinionated zero-config RuboCop wrapper.
ruby-lsp|ruby-lsp|gem|2|ruby|Ruby|Shopify language server (navigation/diagnostics).
brakeman|brakeman|gem|2|ruby|Ruby|Static security analysis for Rails (SAST).
bundle-audit|bundler-audit|gem|2|ruby|Ruby|Scan Gemfile.lock for vulnerable gems.
reek|reek|gem|3|ruby|Ruby|Code-smell detector.
rspec|rspec|gem|2|ruby|Ruby|Dominant Ruby test framework.
srb|sorbet|gem|3|ruby|Ruby|Gradual static type checker (Stripe).
'

# ---- audit loop -----------------------------------------------------------
# here-string keeps the loop in THIS shell so accumulators survive.
missing_brew=""; missing_go=""; missing_uv=""; missing_gem=""; missing_cargo=""; missing_manual=""
installed_count=0; missing_count=0; current_cat=""

while IFS='|' read -r bin pkg method tier lang catg desc; do
  [ -z "${bin// /}" ] && continue
  [ "$LANG_FILTER" != "all" ] && [ "$lang" != "$LANG_FILTER" ] && continue
  [ "$TIER_FILTER" != "all" ] && [ "$tier" != "$TIER_FILTER" ] && continue

  if [ "$catg" != "$current_cat" ]; then
    printf '\n%s%s%s\n' "$BOLD$BLU" "$catg" "$RST"
    current_cat="$catg"
  fi

  if command -v "$bin" >/dev/null 2>&1; then
    installed_count=$((installed_count + 1))
    detail="$desc"
    if [ "$SHOW_VERSIONS" -eq 1 ]; then
      v="$("$bin" --version 2>/dev/null | head -n1 | cut -c1-44)"
      [ -n "$v" ] && detail="$v"
    fi
    printf '  %sT%s %s%-16s%s %sok %s   %s%s%s\n' \
      "$DIM" "$tier" "$BOLD" "$bin" "$RST" "$GRN" "$RST" "$DIM" "$detail" "$RST"
  else
    missing_count=$((missing_count + 1))
    printf '  %sT%s %s%-16s %smiss%s  %s%s%s\n' \
      "$DIM" "$tier" "$RST" "$bin" "$RED" "$RST" "$DIM" "$desc" "$RST"
    case "$method" in
      brew)  missing_brew="$missing_brew $pkg" ;;
      go)    missing_go="$missing_go $pkg" ;;
      uv)    missing_uv="$missing_uv $pkg" ;;
      gem)   missing_gem="$missing_gem $pkg" ;;
      cargo) missing_cargo="$missing_cargo $pkg" ;;
      manual) missing_manual="$missing_manual $bin:$pkg" ;;
    esac
  fi
done <<< "$TOOLS"

# ---- summary --------------------------------------------------------------
printf '\n%s------------------------------------------------------------------%s\n' "$DIM" "$RST"
printf '%sInstalled:%s %d    %sMissing:%s %d\n\n' \
  "$GRN" "$RST" "$installed_count" "$RED" "$RST" "$missing_count"

missing_brew="${missing_brew# }"; missing_go="${missing_go# }"
missing_uv="${missing_uv# }"; missing_gem="${missing_gem# }"
missing_cargo="${missing_cargo# }"
missing_manual="${missing_manual# }"

print_group() { # label, payload, per-line-template
  [ -z "$2" ] && return 0
  printf '%s%s%s\n' "$BOLD" "$1" "$RST"
  case "$3" in
    brew)  printf '  brew install %s\n\n' "$2" ;;
    go)    for p in $2; do printf '  go install %s@latest\n' "$p"; done; printf '\n' ;;
    uv)    for p in $2; do printf '  uv tool install %s\n' "$p"; done; printf '\n' ;;
    gem)   for p in $2; do printf '  gem install %s\n' "$p"; done; printf '\n' ;;
    cargo) for p in $2; do printf '  cargo install %s\n' "$p"; done; printf '\n' ;;
  esac
}

print_group "Missing Homebrew tools:" "$missing_brew" brew
print_group "Missing Go tools (needs: brew install go):" "$missing_go" go
print_group "Missing Python tools (needs: brew install uv):" "$missing_uv" uv
print_group "Missing Ruby gems (needs ruby + gem):" "$missing_gem" gem
print_group "Missing Rust tools (needs cargo; prefer brew where available):" "$missing_cargo" cargo
if [ -n "$missing_manual" ]; then
  printf '%sManual vendor installs (not run by this script):%s\n' "$BOLD" "$RST"
  for item in $missing_manual; do
    printf '  %s — %s\n' "${item%%:*}" "${item#*:}"
  done
  printf '\n'
fi

# ---- optional install (per method, each asks first) -----------------------
if [ "$DO_INSTALL" -eq 1 ]; then
  if [ -z "$missing_brew$missing_go$missing_uv$missing_gem$missing_cargo" ]; then
    printf 'No missing tools have an automated install method.\n'; exit 0
  fi

  confirm_run() { # prompt, command-string
    printf '\nAbout to run:\n  %s\nProceed? [y/N] ' "$2"
    read -r reply
    case "$reply" in y|Y|yes|YES) eval "$2" ;; *) printf 'Skipped.\n' ;; esac
  }

  if [ -n "$missing_brew" ]; then
    if command -v brew >/dev/null 2>&1; then
      confirm_run brew "brew install $missing_brew"
    else
      printf '%sSkipping brew group: Homebrew not found.%s\n' "$RED" "$RST"
    fi
  fi
  if [ -n "$missing_go" ]; then
    if command -v go >/dev/null 2>&1; then
      for p in $missing_go; do confirm_run go "go install $p@latest"; done
    else
      printf '%sSkipping Go group: go not found (brew install go).%s\n' "$RED" "$RST"
    fi
  fi
  if [ -n "$missing_uv" ]; then
    if command -v uv >/dev/null 2>&1; then
      for p in $missing_uv; do confirm_run uv "uv tool install $p"; done
    else
      printf '%sSkipping Python group: uv not found (brew install uv).%s\n' "$RED" "$RST"
    fi
  fi
  if [ -n "$missing_gem" ]; then
    if command -v gem >/dev/null 2>&1; then
      for p in $missing_gem; do confirm_run gem "gem install $p"; done
    else
      printf '%sSkipping Ruby group: gem not found.%s\n' "$RED" "$RST"
    fi
  fi
  if [ -n "$missing_cargo" ]; then
    if command -v cargo >/dev/null 2>&1; then
      for p in $missing_cargo; do confirm_run cargo "cargo install $p"; done
    else
      printf '%sSkipping Rust group: cargo not found.%s\n' "$RED" "$RST"
    fi
  fi
fi
