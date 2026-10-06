---
artifact: audit-remediation-record
format: remediate-audit/v1
consumes: <filename of the audit report this record closes, e.g. 2026-07-11-subject-audit.md>
subject-state-at-remediation: <commit hash(es) the fixes landed on>
remediator: <agent/model identity; note if same as implementer and/or auditor>
date: <YYYY-MM-DD>
gate-reopen: <passed | failed | partial — headline outcome of the report's re-check list>
---

# Remediation Record: <subject>

<Save beside the consumed report as
`docs/audits/YYYY-MM-DD-<subject-slug>-remediation.md`. Keep the frontmatter
intact — `artifact: audit-remediation-record` plus the `consumes:` field is
how producers and follow-up auditors pair this record with its report.
Delete this instruction block.>

## Authority

<Who authorized the fix set, and its boundaries: findings to fix now,
residuals accepted (each needs a named owner), disputed, deferred.>

## Dispositions

<Use tables and deltas only; the `consumes:` pointer owns the audit narrative.>
One row per finding ID from the consumed report — none skipped:

| ID | Re-verified? | Finding disposition | Prescription outcome | Detail |
|---|---|---|---|---|
| AUD-001 | <reproduced / not reproduced / changed since audit> | <resolved / accepted / deferred / withdrawn / disputed / blocked-on-owner> | <category from calibration-record.md> | <how re-verified; who accepted; where deferred; why withdrawn; for blocked-on-owner: which surface is owner-reserved and the decision escalated> |

<Use `blocked-on-owner` when authorized fixes are complete but a surface is
reserved to a named owner — e.g. an `owner-gated: history-rewrite` purge of a
sensitive payload — so the gate stays closed pending accept-or-rewrite. Add
rows tagged `newly discovered` for second-order breakage and other defects
found during remediation.>

## Deviations from prescriptions

<Per finding ID: the constraint the auditor could not see, the intent
implemented instead, and why it satisfies the finding.>

## Gate-Reopen Checks

<The report's exact re-check list, each with its outcome (verbatim result
lines, not summaries). For a sensitive-payload finding, report the worktree/index
scan and the reachable-history scan as separate rows — a purged worktree does
not close a non-purged history. State the final gate status and that opening it
is the owner's decision.>

## Calibration

<Per `references/calibration-record.md`: claim reproduction rate; withdrawn
findings; missed issues; severity/disposition agreement; recommendation
implementability; prescription efficiency; yield; second-order breakage
predicted vs. actual; one qualitative lesson; optional anchored headline
score.>
