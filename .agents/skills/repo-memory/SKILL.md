---
name: repo-memory
description: Use when setting up, using, or maintaining a durable repo-scoped AI memory in docs/ai-memory/ — seeding the memory contract, wiring always-on recall into AGENTS.md, recording or updating lessons, bootstrapping lessons from repo history, consolidating an overgrown memory set, or auditing memory hygiene. Works identically for any model or IDE that reads repo instruction files (Codex, Claude Code, Antigravity, Cursor, others).
license: MIT
metadata:
  version: "3"
  track: addon
  model-posture: any
---

# Repo Memory
## Purpose
Give every agent working in a repo one shared, durable, repo-committed memory: one lesson per file under `docs/ai-memory/`, indexed for cheap recall, complementing (never replacing) each IDE's own machine-local memory. A lesson learned once by one model becomes context for every model, tool, and teammate thereafter.

## Memory Contract
- Layout: `docs/ai-memory/README.md` (the contract), `docs/ai-memory/INDEX.md` (one line per lesson, the only always-read file), `docs/ai-memory/<kebab-slug>.md` (one lesson per file).
- Lesson shape: `# Title`, then a standalone one-line summary, then optional `Why it matters` / `How to apply` / `Evidence` / `Last confirmed` lines. Cap ~40 lines; longer content is documentation — move it to `docs/` and keep a pointer lesson.
- Index line shape: `- [<title>](<slug>.md) — <hook that lets a reader decide relevance>`. Hard cap 200 lines.
- Plain markdown only: no YAML frontmatter, no tool-specific syntax, no secrets or PII, no absolute host paths.
- The full contract text lives in `assets/templates/ai-memory-readme-v1.md` and is stamped into the target as `docs/ai-memory/README.md`.

## First run after install
When `repo-memory` is in the install composition, the polymath installer
seeds target infrastructure once (only if absent): `docs/ai-memory/README.md`,
`docs/ai-memory/INDEX.md`, and the managed recall block in root `AGENTS.md`
(and in independent `.agents/AGENTS.md` when present). After that, every agent
session gets always-on recall from `AGENTS.md` without loading this skill.

Still agent-owned on first use:
- **Bootstrap** — distill initial lessons from repo history (optional).
- **Consolidation** — merge duplicates or cull obsolete lessons when the
  index approaches its cap or on request.

To verify a fresh install, run the smoke-check prompt in
`assets/templates/memory-smoke-check-prompt-v1.md` (see `scripts/README.md`).

## Setup Workflow
Run when install seeding was skipped, files were removed, or a repo predates
installer seeding:
1. If `docs/ai-memory/README.md` or `INDEX.md` is absent: create `docs/ai-memory/`, stamp `assets/templates/ai-memory-readme-v1.md` as `docs/ai-memory/README.md`, and create an empty-but-valid `INDEX.md` (title line plus zero entries).
2. Wire always-on recall: check the target's root `AGENTS.md` for the managed block markers in `assets/templates/agents-md-memory-block-v1.md`. If absent, append the block verbatim (markers included). Never rewrite surrounding content; the block is the only thing this skill owns in that file.
3. If the target bridges Antigravity rules via `.agents/AGENTS.md` (symlink or stub to the root file), no extra wiring is needed; if `.agents/AGENTS.md` is an independent file, append the same managed block there.
4. Do not create any per-IDE copies of memory content. The memory is IDE-neutral by construction; IDEs without a skill lane (for example Cursor) get full read/write behavior from the `AGENTS.md` block alone.

## Recall Workflow
1. At the start of any non-trivial task, read `docs/ai-memory/INDEX.md`.
2. Open only the lessons whose hook matches the task. Do not bulk-load the directory.
3. Treat lessons as advisory context recorded at a point in time: if a lesson names a file, command, or flag, verify it still exists before acting on it.

## Record Workflow
Record only what is confirmed — verified by tool results, tests, or explicit user confirmation, not speculation.
1. Qualify: record corrections and confirmed approaches alike, including why they mattered. Skip anything the repo, `AGENTS.md`, or git history already records; memory is for what the code cannot say (rationale, dead ends, environment quirks, decisions and their reasons).
2. Route: if the fact is about the user or their machine rather than the repo, leave it to the IDE's native memory. If it would help a different model or person working in this repo, it belongs here.
3. Check `INDEX.md` for an existing lesson that covers the topic. Update that file instead of creating a near-duplicate, and refresh its `Last confirmed` date.
4. New lessons: copy `assets/templates/lesson-template-v1.md`, name the file with a short permanent kebab-case slug, and add one index line.
5. Delete lessons that turn out wrong — remove the file and its index line. Git history is the archive; keep no tombstones.
6. Commit memory changes together with the work that produced them; they ride normal PR review.

## Memory Judgment
Treat repo memory as reviewable institutional knowledge, not a diary. A lesson
earns a file only when another competent agent, opening the repo cold months
later, would plausibly avoid a mistake or make a better decision because it
exists.

Good candidates:
- Repeated failure modes and their verified workarounds.
- Non-obvious decisions, especially rejected alternatives and stable "why".
- Destructive, overwrite-prone, or order-sensitive workflows.
- Repo-specific tooling, environment, or validation quirks.
- Corrections to assumptions that future agents may reasonably repeat.

Bad candidates:
- Temporary task status, edit logs, or "I changed X today".
- Guidance already clear in `README.md`, `AGENTS.md`, docs, code comments, or tests.
- Generic engineering advice, personal preferences, speculation, secrets, PII, or machine-local paths.

Prune or delete a lesson when it becomes false, duplicate, too broad to guide
action, no longer decision-useful, promoted into canonical docs, or sensitive.
Update instead when the lesson remains true but needs a changed command, path,
date, evidence link, or sharper wording.

## Bootstrap Workflow
For a repo with history but no memory yet, after Setup:
1. Review the repo's engineering/decision log if present, recent commit messages, and merged PR descriptions.
2. Distill recurring themes, corrections, and hard-won constraints into candidate lessons; verify each against the current code before recording it.
3. Record per the Record Workflow. Aim for a small high-confidence seed set (5–15 lessons), not exhaustive coverage.

## Consolidation Workflow
Run when `INDEX.md` approaches its 200-line cap, when duplicates accumulate, or on request:
1. Read every lesson (this is the one workflow that bulk-loads).
2. Merge overlapping lessons into the strongest single file; delete the rest.
3. Delete lessons invalidated by current code; tighten summaries and hooks.
4. Rebuild `INDEX.md` to agree bidirectionally with the files, then run the audit script.

## Audit
- `scripts/memory_audit.sh [target-root]` — deterministic contract check: README/INDEX present, every lesson titled with a one-line summary, index and files agree both directions, per-lesson and index caps respected, no absolute host paths, no obvious secret patterns. Hard failures exit non-zero; style issues are advisory warnings.
- Installed under `scripts/polymath/repo-memory/` in targets. See `scripts/README.md`.

## Validation
- Run `scripts/memory_audit.sh` against the target after setup, bootstrap, or consolidation.
- Confirm the `AGENTS.md` managed block is present exactly once.
- Confirm `INDEX.md` entries resolve and every lesson file is indexed.
- Optional: run the smoke-check prompt in `assets/templates/memory-smoke-check-prompt-v1.md`.
