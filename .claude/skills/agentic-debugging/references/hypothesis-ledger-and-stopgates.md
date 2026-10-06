# Hypothesis Ledger and Stop-Gates

The ledger is the durable state of a debug session. It lives on disk, not in chat: long debug sessions outlive context windows in every IDE, and the ledger is what lets any agent (including a fresh session) resume exactly where the last one stopped.

## Ledger File

Create it at session start from `assets/hypothesis-ledger-template.md` (or run `scripts/ledger_init.sh`). Default location: `dist/debug/<session-id>/ledger.md` — a git-ignored path (see `evidence-artifacts-and-promotion.md` for path rules). The session ID is a short unique token (e.g. `dbg-20260706-a3`), reused in every probe marker.

Required sections:

```markdown
# Debug Session <session-id>
- Symptom: <exact observed behavior>
- Expected: <what should happen>
- Classification: deterministic|flaky, new-defect|regression
- Repro lane: agent-driven|human-driven|armed-and-waiting
- Repro command / handoff script: <cmd or instructions>
- Evidence file: <path>
- Current gate: frame|reproduce|hypothesize|instrument|collect|localize|fix|verify|cleanup|promote

## Hypotheses
| ID | Statement (falsifiable) | Discriminating observation | Prior (H/M/L) | Cost | Status | Evidence |
|----|--------------------------|----------------------------|-------|------|--------|----------|
| H1 | ... | ... | H | low | open|confirmed|refuted|needs-better-probe | grep tag + line refs |

## Log
- <ts> gate=<g> <what happened, what was decided>
```

Rules:

- Every hypothesis is a **falsifiable statement about the program**, not a vibe ("H2: the cache returns stale entries after eviction because the generation counter is not bumped" — not "H2: something wrong with the cache").
- Every hypothesis names, up front, the concrete runtime observation that would confirm or refute it. If you cannot name one, the hypothesis is not ready to instrument.
- The `Evidence` column holds **pointers** (grep command + matching-record summary), never pasted raw log bodies.
- Update the ledger at every gate transition and every hypothesis status change. The ledger is append-mostly; do not rewrite history, log corrections.

## Ranking and Falsification Discipline

- Generate 3–6 hypotheses. Fewer than 3 usually means anchoring on the favorite; more than 6 means the frame is too vague — sharpen the symptom first.
- Rank by prior likelihood × cost-to-test. Test cheap discriminators first even when a pricier hypothesis is more likely.
- Prefer probes with **high discriminating power**: a reading that splits the live set (refutes several at once) beats one that merely supports the favorite.
- A hypothesis is **confirmed** only by positive runtime evidence from a reproduction — never by code reading alone. Code reading may raise or lower priors; it cannot close a hypothesis.
- If all hypotheses are refuted, return to the hypothesize gate with what the evidence taught you. Record the refuted set; it is progress, not failure.

## Stop-Gate Rules

- You may not move to a later gate without the current gate's exit evidence recorded in the ledger.
- Gate order may loop backward (collect → hypothesize is normal); it may never skip forward past `fix` — there is **no path from symptom to code-fix that bypasses a confirmed hypothesis with collected evidence**.
- At any time you must be able to answer, from the ledger alone: what gate am I at, which hypotheses are live, and what observation moves me forward.
- Exit evidence per gate:
  - frame → symptom/expected/classification written; regression fast-path considered.
  - reproduce → lane recorded; agent-driven: command runs and exhibits the fault; human-driven: handoff script written; armed: probes declared safe-to-park.
  - hypothesize → table populated with discriminating observations.
  - instrument → probe list with markers, tags, perturbation notes.
  - collect → each live hypothesis has evidence pointers and a status.
  - localize → exactly one surviving hypothesis with positive evidence, narrowed to line/branch/state transition.
  - fix → diff tied to the confirmed hypothesis ID.
  - verify → same-lane re-run clean; reproducing party confirmed.
  - cleanup → zero-residue check output pasted into the ledger log.
  - promote → promotion decision recorded (what graduated, or why nothing did).

## Resuming After Context Loss

On resume (new session, compacted context, different agent):

1. Locate the ledger (the target's `dist/debug/` root; newest session dir).
2. Read the header and `Current gate` line, then the hypothesis table, then only the last few log lines.
3. Do **not** re-read prior evidence wholesale; the Evidence pointers tell you which filtered queries to re-run if a reading must be verified.
4. Continue from the recorded gate. If the working tree changed since the last log entry, re-run the zero-residue check first to learn which probes are still installed (`scripts/probe_cleanup.sh --check --list`).
