---
artifact: independent-audit-report
format: independent-audit/v1
subject: <branch / artifact / corpus>
subject-basis: <committed | committed-plus-staged | committed-plus-untracked | filesystem-only>
subject-state: <commit hashes; dirty-tree scope; artifact versions>
comparison-base: <base ref @ merge-base hash, where applicable>
auditor: <agent/model identity; note if same-agent as implementer>
date: <YYYY-MM-DD>
standards: <governing documents, precedence order>
mode: <full | focused | follow-up | spot-check>
gate: <hold-or-merge-or-tag-or-approve-or-approve-with-conditions-or-revise-before-build-or-provisional>
# Include secondary-gates only when per-gate verdicts diverge; delete the
# two-line block otherwise. Values use the same vocabulary as gate:.
secondary-gates:
  merge: <disposition>
  tag: <disposition>
blocking: [<AUD-NNN>, <AUD-NNM>]  # use [] when nothing blocks
---

# <Subject> Audit

<Save this file as `docs/audits/YYYY-MM-DD-<subject-slug>-audit.md` in the
subject repo. Keep the frontmatter above intact — the path pattern plus
`artifact: independent-audit-report` is how the implementing agent recognizes
and acts on this report. Cite files repo-relative, pinned to the audited
hashes; never absolute host paths. Delete this instruction block.>

## Scope, Standard, and Coverage

<What is audited; what is explicitly not; how pre-existing defects are
treated; for sampled audits: population, sample, selection method. In
follow-up mode, keep only the sections required by Core Loop step 6.>

## Executive Assessment

<Verdict first: is the work good, and can the gate open? Two paragraphs max.
Name the blocking findings by ID.>

## Findings Register

<The full register is embedded here — the report is a self-contained
handoff. Every finding, blocking or not, carries all schema fields and an
evidence entrypoint. Field contract: see the finding model in the skill
body.>

| ID | Kind | Severity | Confidence | Relationship | Disposition | Surface | Finding (one line) | Evidence entrypoint | Owner |
|---|---|---|---|---|---|---|---|---|---|
| AUD-001 | | | | | | | | | |

<Table hygiene: escape any `|` inside a cell as `\|`; keep multi-command
evidence in the finding's subsection and let the cell point to it ("see
AUD-001 below") — raw pipes break the table.>

<!-- Conditional: follow-up mode only. Delete for other modes. -->
## Prior-Finding Dispositions and Affected-Surface Evidence

| Prior ID | Disposition | Independent closure evidence | Changed surface inspected | Verdict effect |
|---|---|---|---|---|
| AUD-001 | | | | |

## Gate-Blocking Findings

<One subsection per blocker. For each: files with pinned line/symbol
citations; claim-appropriate evidence (reproduction command + observed output
where executable); impact; recommended fix (concrete steps, files to change
together, following the skill's finding-model recommendation contract); the framework follow-up — only if it passes the
escalation-economics test — with its owner surface.>

### AUD-00N: <title>

## Non-Blocking Findings

<One short subsection (or tight paragraph) per remaining finding: pinned
citation, the evidence entrypoint expanded enough to verify, and the
recommended fix. No finding appears only as a table row.>

## Per-Item Review

<Skill-by-skill, milestone-by-milestone, criterion-by-criterion as the audit
type dictates. For each item: what worked well (specific); issues and
improvements (numbered, actionable); scores if a rubric is declared.>

<!-- Conditional: include when auditing against a build prompt or milestone
contract. -->
## Acceptance Criteria Review

| Criterion | Verdict (pass / partial / fail) | Evidence |
|---|---|---|

<!-- Conditional: include when the work exposed gaps in the governing
standard itself. -->
## Framework Assessment

<What the work proves about the governing standard, and which gaps in the
standard should close (with owner surfaces).>

## Validation Evidence

- **Ran and passed:** <...>
- **Ran and failed (with output):** <...>
- **Not performed (with why):** <...>
- **Not applicable:** <...>

## Recommended Fix Order

<Numbered, dependency-ordered, executable as written. Name the files to
change together and the re-verification to run per step.>

## Gate Recommendation and Audit Integrity

<Explicit disposition (tag / merge / approve / hold / design disposition)
with the exact re-verification required to reopen the gate. Confirmation the
audit did not mutate user work (final state vs. preflight snapshot), evidence
locations, temporary-artifact cleanup, and redaction notes.>
