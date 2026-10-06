# AI Memory

Durable, repo-scoped lessons shared by every agent, model, and IDE working
in this repository — and by the humans reviewing their work. This directory
is the shared memory layer; each IDE's native memory (Claude Code auto
memory, Codex memories, Cursor Memories, Antigravity knowledge base) remains
the personal, machine-local layer.

## Layout

- `README.md` — this contract.
- `INDEX.md` — one line per lesson. The only file read on every task.
- `<kebab-slug>.md` — one lesson per file.

## Lesson format

```markdown
# <Title>

<One-line summary: the lesson itself, standalone.>

- Why it matters: <consequence of ignoring it>
- How to apply: <concrete steps or file references>
- Evidence: <commit/PR/file reference that confirmed it>
- Last confirmed: <YYYY-MM-DD>
```

Cap ~40 lines per lesson. If it needs more, it is documentation, not a
memory — move it to `docs/` and keep a pointer lesson here.

Index line format (cap 200 lines total):

```markdown
- [<title>](<slug>.md) — <hook that lets a reader decide relevance>
```

## Rules

- Read `INDEX.md` before non-trivial work; open only relevant lessons.
- Record confirmed approaches and corrections alike, including why they
  mattered. Confirmed means verified by tool results, tests, or explicit
  user confirmation — never speculation.
- Don't save what the repo, `AGENTS.md`, or git history already records.
  Memory is for what the code cannot say: rationale, dead ends,
  environment quirks, decisions and their reasons.
- Update an existing lesson rather than creating a duplicate; refresh its
  `Last confirmed` date.
- Delete lessons that turn out wrong (file and index line). Git history is
  the archive; keep no tombstones.
- Personal or machine-local facts belong in your IDE's native memory, not
  here. If a lesson would help a different model or person working in this
  repo, it belongs here.
- Never store secrets, tokens, PII, or absolute host paths.
- Commit memory changes together with the work that produced them.

## What to remember

Treat repo memory as reviewable institutional knowledge, not a diary. Write a
lesson only when another competent agent, opening this repo cold months later,
would plausibly avoid a mistake or make a better decision because it exists.

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
