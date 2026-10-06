---
name: agent-cli-tools
description: "Use to choose the right command-line tool for a task and confirm it is installed: a weapons-master that maps a need (search, structural rewrite, JSON/YAML, repo recon, diffing, doc/image extraction, security, benchmarking) to the best CLI for agents and humans, tiered by utility, clustered by Rust/Python/Ruby, with an audit-and-install script."
license: MIT
metadata:
  version: "4"
  track: addon
  model-posture: any
---

# Agent CLI Tools
## Purpose
Be the weapons-master for other agents and skills: given a concrete need, name the highest-leverage CLI tool, say when to reach for it instead of the obvious default, and make sure it is actually on `PATH` before recommending it. Optimize for tools an agent *invokes* (search, structural rewrite, structured-data, repo intelligence), and separately flag tools that only help a human reviewer.

## Selection Workflow
1. **Name the task precisely.** "Find every `await` inside a `try`" is structural search, not text search; "what is this repo made of" is composition stats, not `ls`. The task determines the tool.
2. **Pick from the tier that fits the need.** Default to Tier 1 for everyday work; drop into Tier 3 only when the task is in that niche (image diffing, doc/OCR extraction, security scanning, tabular data, diagrams, indexed-search-at-scale, local LLM/RAG). See `references/catalog-by-task.md` for "I need to X → ranked choices" and `references/catalog-by-tier.md` for the full catalog with rationale and install names.
3. **Cluster by language when relevant.** Rust, Python, and Ruby each have their own validation/inspection toolbelt — see `references/language-clusters.md`. Prefer the cluster tool over a generic one when working inside that language's repo.
4. **Confirm availability before recommending.** Run `scripts/cli-audit.sh` to see what is present vs missing. Never assume a tool is installed — presence is a per-machine fact, not a given.
5. **Install missing tools deliberately.** Use `scripts/cli-audit.sh --install` (all missing) or `--lang rust|python|ruby` (one cluster). It always asks before installing. Do not silently install on a user's machine.
6. **Invoke with agent-safe flags.** See Agent-Safety Rules below.

## Tier Model
Four utility tiers. A tool's tier reflects *how broadly an agent benefits*, not how good the tool is.

- **Tier 1 — High:** invoked constantly, language-agnostic, broad payoff. `rg`, `fd`, `jq`, `ast-grep`, `yq`, `gh`, `tree`, `sd` (plus baseline `git`).
- **Tier 2 — Medium:** frequent across common workflows. Includes the `codex` agentic coding CLI plus `comby`, `universal-ctags`, `tokei`/`scc`, `gron`, `jc`, `rga`, `repomix`, `hyperfine`, `watchexec`/`entr`, `pandoc`, `xh`, `markdownlint`, `shellcheck`/`shfmt`, `just`, `difftastic`, `delta`, `fzf`, `mise`/`direnv`.
- **Tier 3 — Niche-segment:** high value, but only inside a specific domain. Image/visual-regression, doc/OCR, security scanning, tabular data, diagram rendering, indexed-search-at-scale, local LLM/RAG. Enumerated in `references/catalog-by-tier.md`.
- **Tier 4 — Lower / sometimes useful:** mostly human-facing pretty-printers or tools superseded by a Tier 1 choice. `eza`, `zoxide`, `bat`, `starship`, `atuin`, `glow`, `procs`, `dust`/`duf`, `ack`/`ag`/`ugrep` (superseded by `rg`), `tmux`/`zellij`.

The single most important distinction: **`bat`, `delta`, `eza` and friends are for a human reading the terminal.** A headless agent reading raw text gets no benefit from syntax color — and color escape codes can pollute its context. Recommend them for human-in-the-loop review, not for an agent's own pipeline. (The good ones auto-disable color when stdout is not a TTY.)

## Tier 1 Quick Reference
| Need | Tool | Reach for it instead of |
|------|------|-------------------------|
| Search file contents | `rg` (ripgrep) | `grep -r` — faster, respects `.gitignore` |
| Find files by name/type | `fd` | `find` — simpler syntax, gitignore-aware |
| Structural code search/rewrite | `ast-grep` (`sg`) | `rg`/`sed` when the match is syntactic, not textual |
| Query/transform JSON | `jq` | hand-parsing; pipe API output through it |
| Query YAML/TOML/XML | `yq` | `jq` when the input isn't JSON |
| GitHub PRs/issues/checks | `gh` | scraping the web UI |
| Orient in an unfamiliar repo | `tree` (then `tokei`) | listing directories by hand |
| Find/replace in a stream | `sd` | `sed` for simple substitutions |

## Agent-Safety Rules
- **Non-interactive by default.** Avoid tools/flags that need a TTY (`fzf`, pagers). Pass `--no-pager`, `| cat`, or the tool's batch flag. For `gh`, set `GH_PAGER=cat`.
- **Strip color in pipelines.** Most modern tools auto-disable color off-TTY; force it with `NO_COLOR=1` or the tool's `--color=never` when output is consumed by a model.
- **Presence ≠ identity.** `scripts/cli-audit.sh` checks for a name on `PATH`, not a fingerprint. An unrelated binary can shadow a name (e.g. `sg`). On a clean macOS this is rare, but treat an "ok" as "something by this name exists."
- **Never auto-install on a user's machine.** Always surface what is missing and let the install be confirmed. The script enforces this; preserve it.
- **Built-ins are free.** macOS ships capable CLIs (`mdfind`, `sips`, `textutil`, `qlmanage`, `pbcopy`/`pbpaste`, `osascript`, `plutil`). Prefer them when they suffice — zero install, always present. See `references/macos-builtins.md`.

## Scripts
- `scripts/cli-audit.sh` — audit what is installed, grouped by tier/category. Stock macOS `/bin/bash` 3.2 safe.
  - `cli-audit.sh` — audit; show installed vs missing.
  - `cli-audit.sh --versions` — also print versions of installed tools.
  - `cli-audit.sh --install` — prompted install of everything missing (brew/go/uv/gem), asks first.
  - `cli-audit.sh --lang rust|python|ruby` — audit (and with `--install`, install) just one language cluster.
  - Formula-name mismatches are baked in (`delta`→`git-delta`, `difft`→`difftastic`, `sg`→`ast-grep`); if a line ever errors, `brew info <name>` is the arbiter.

## References
- `references/catalog-by-tier.md` — full tiered catalog: every candidate tool, its tier, rationale, and install name/method.
- `references/catalog-by-task.md` — task-first decision guide ("I need to X" → ranked tool choices).
- `references/language-clusters.md` — Rust / Python / Ruby validation and inspection toolbelts.
- `references/macos-builtins.md` — zero-install native macOS CLIs and what each replaces.

## Core Rule
Match the tool to the *shape* of the task, verify it is installed, and prefer the tool an agent can drive non-interactively. A sharper tool the agent can't invoke cleanly is worse than a blunt one it can.
