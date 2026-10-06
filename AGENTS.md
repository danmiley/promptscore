# Agent Instructions

This repo uses an installed polymath skill stack. Start here before changing files.

## Required Reading
1. `READMEFIRST.md`
2. `docs/starting-prompt.md`
3. `docs/ARCHITECTURE.md`
4. `docs/ENGINEERING_LOG.md`
5. `docs/ai-memory/INDEX.md` when present.
6. Installed skill contracts (`.agents/skills/*/SKILL.md` and/or `.claude/skills/*/SKILL.md`) that apply to the task.

## Finding installed skills

Skill contracts live under dot-directories (`.agents/skills/` for Codex, `.claude/skills/` for Claude Code). Default file-discovery tools hide these: `rg --files`, `fd`, and `ls` (without `-a`) skip dot-directories, so a first-pass survey can look like the repo has no skills. To enumerate them:

- Read `docs/polymath-install.toml` — the installer-written lockfile lists every installed skill and the path of every file it wrote. This is the most reliable index (it works even when a tool would otherwise hide or git-ignore the skill dirs).
- Or scan explicitly: `rg --files --hidden .agents/skills .claude/skills`, or `ls -a .agents/skills .claude/skills`.

When instructions conflict: this `AGENTS.md`, then installed skill contracts, then docs under `docs/`, then the current request.

## Context Discipline
- Treat `SKILL.md` files as routing contracts. Read the installed `SKILL.md` files that apply to the task, then open only the referenced files needed for the current decision.
- Do not bulk-read every installed skill or every `references/` file just because a skill is present. Use `docs/polymath-install.toml` as the index, and load detail on demand.
- If a skill contract or reference was already read in the current session and has not changed, reuse that context instead of re-reading it.
- For long research or acquisition loops, summarize durable decisions and unresolved gaps in `docs/ENGINEERING_LOG.md` or the requested artifact, then continue from that summary instead of replaying all prior source material.

## Working Rules
- Keep edits scoped to the requested task and the installed skill contracts.
- Do not edit generated output (dist/, coverage, test reports) unless the task is explicitly about generated output.
- Review `.gitignore` before generating lots of new artifacts; keep agent install surfaces and repo-owned docs/scripts trackable.
- Preserve user changes; read files before editing.
- Record significant decisions, commands, artifacts, and residual risks in `docs/ENGINEERING_LOG.md`.
- `docs/polymath-install.toml` is installer-owned; do not hand-edit it.

## Validation Commands
Use the commands that exist in this repo; skill script packs live under `scripts/polymath/<skill>/`.

<!-- polymath:repo-memory:begin -->
## Durable AI memory

This repo keeps durable agent lessons in `docs/ai-memory/`. Before any
non-trivial task, read `docs/ai-memory/INDEX.md` and open only the lessons
relevant to the task. When you confirm an approach or correction worth
keeping, record it per `docs/ai-memory/README.md`: one lesson per file with
a one-line summary at the top; record why it mattered; don't duplicate what
the repo or chat already records; update existing lessons instead of adding
near-duplicates; delete lessons that turn out wrong. Never store secrets or
absolute host paths. Keep personal or machine-local facts in your own
tool's native memory, not here.
<!-- polymath:repo-memory:end -->
