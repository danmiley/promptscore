# Branch / Release-Gate Audits

Audit a branch, release candidate, or tag gate: is this work good, and may
the gate open? The verdict is explicit — tag/merge, hold, or provisional —
with the exact re-check list for reopening the gate.

## Scope mechanics
- Filesystem, index, and commit history are distinct evidence surfaces; the
  report's `subject-basis` declares which surface contains verdict-bearing
  content.
- When the verdict-bearing content is a **sensitive payload committed to
  history** (secrets, PII, private locations), the surfaces close under
  different authorities: the write path and worktree are remediable, but
  purging reachable history is an `owner-gated: history-rewrite` action. Split
  the finding's outcome constraint and gate-reopen checks by surface (finding
  model, recommendation contract) and keep both checks redacted count/existence
  probes — a deletion-only commit is not history closure.
- Scope is `<base>...HEAD` or a tag candidate. Always name the merge base by
  hash, and **detect the intended base** rather than assuming the default
  branch (long-lived feature branches, release branches, and stacked PRs all
  break the `main` assumption).
- Distinguish committed work from working-tree residue. If the tree is
  dirty, audit both deltas by name — the committed delta and the working-tree
  delta — and never silently omit one.
- State how pre-existing defects exposed-but-not-introduced by the branch are
  treated. Track the relationship per finding (introduced / retained /
  exposed): the branch is not charged with old debt, but materially-rewritten
  surfaces are expected to fix the debt they touched — "missed high-value
  fix" is a fair finding for retained defects in rewritten code.

## What to verify
1. **The release bookkeeping chain, end-to-end.** Version fields ↔ catalog or
   manifest rows ↔ changelog entries ↔ generated/public surfaces ↔ logs.
   Generated artifacts (docs sites, catalogs, lockfiles) are the most common
   stale surface because nothing forces regeneration.
2. **The full validation suite** — the repo's own validators *and* the
   product/public-surface tests, not just the checks the branch's own
   workflow happens to name.
3. **Documented commands and paths from a clean environment.** Fresh clone,
   clean `$HOME`, scratch install target. Developer-machine state (global
   installs, warm caches, stale exports) masks the most embarrassing
   blockers.
4. **The branch's own claims.** Whatever the changelog, commit messages, or
   brief assert was done — re-run it, do not inherit it.
5. **Content/inventory schema, enforced not assumed.** If the tree ships a
   schema or inventory validator, run the strictest available validator
   against every record and put it in the gate-reopen matrix. A passing
   product build — site renders, Playwright green — is *not* evidence that
   records are valid when the product reads data without schema enforcement
   and CI never runs the content gate; "site renders" and "records are valid"
   are different claims. Two traps when you validate against a schema
   yourself: (a) if the schema uses `format`, enable format assertion
   (`ajv-formats`, `jsonschema` `FormatChecker`, or equivalent) or state in
   the evidence that formats were *not* asserted — a silently-ignored
   `format` keyword hides real violations; (b) when the finding *is* that the
   in-tree gate does not run, any error count from your substitute validator
   is a **lower bound**, not a total — say so, and prefer the strictest
   validator available.

## Severity anchoring
Use the P0–P3 ladder from the skill body. Argue each P1 against the gate:
"this blocks because the changelog calls this release X and surface Y still
shows the previous version" — not "this is bad."

## Verdict
- **Tag/merge**: zero blocking findings; validation evidence recorded.
- **Hold**: name the blocking finding IDs and the exact re-verification list
  (commands, expected outcomes) that reopens the gate.
- **Provisional**: when verdict-bearing content is not wholly committed, useful
  findings may stand but final approve/tag/merge is unavailable. Use
  `gate: provisional`, and state in the executive assessment that findings
  against uncommitted work cannot pin durable history.
- Where quality and readiness diverge (excellent work, blocked release),
  report both scores; one number would hide the tension.

For follow-ups, apply the scoped-but-independent contract in Core Loop step 6;
do not substitute the historical full matrix by default.
