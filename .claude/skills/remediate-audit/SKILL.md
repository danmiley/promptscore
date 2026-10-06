---
name: remediate-audit
description: "Use when an independent audit report exists and must be acted on: 'remediate this audit', 'apply the audit findings', 'process the auditor's report', 'consume the audit', or whenever a docs/audits/*-audit.md file with artifact: independent-audit-report frontmatter is the input to the task. Re-verifies every finding before editing, confirms the authorized fix set, applies fixes in the report's dependency order, traces second-order breakage, records per-finding dispositions and a calibration record to a canonical remediation file, and runs the exact gate-reopen checks. Not for producing audits (use independent-audit) and not for general bug fixing without a report."
license: MIT
metadata:
  version: "7"
  track: addon
  model-posture: any
---

# Remediate Audit
## Purpose
Consume a decision-grade audit report as a field report from someone who was not here. Its credibility is established per-claim, not globally: re-verify every finding before changing anything, fix only what is authorized, and close the loop with dispositions the next audit can build on and a calibration record that grades the audit itself.

## Scope
- Consuming reports produced by `independent-audit` (or matching its format): re-verification, authorized fixes, disposition bookkeeping, gate-reopen checks, calibration feedback.

## Out of Scope
- Producing audits — that is `independent-audit`, with different (read-only) authority.
- General debugging or feature work without a report as the driving artifact.
- Deciding gate openings that the report reserves for the repo/release owner; surface the decision, do not make it.

## Starting a Remediation
A usable request names the report and the authority, e.g.: "Process the audit report at `docs/audits/<file>`; fix findings <IDs or 'all'>; I accept <IDs> as residuals (owner: <name>)." If the request names no report, locate candidates as below; if it grants no explicit fix authority, settle that at step 3 before any edit. The outcome lands beside the report as `docs/audits/YYYY-MM-DD-<subject>-remediation.md`.

## Locating the Report
The input is a file at `docs/audits/YYYY-MM-DD-<subject>-audit.md` (or `audits/` at the repo root) whose frontmatter says `artifact: independent-audit-report`. Trust its identity from that path-plus-marker contract. If several unconsumed reports exist and the request does not name one, list them and ask. If the named input lacks the marker or the findings register, say so and confirm before proceeding — it may predate the format or not be an audit at all.

## Workflow
1. **Parse the report.** Extract the findings register (IDs, severities, confidence, dispositions), the recommended fix order, and the gate-reopen check list. Preserve finding IDs verbatim through everything that follows.
2. **Re-verify every finding before changing anything.** Use each finding's evidence entrypoint; work from the pinned subject state (`git show <hash>:...`) when the tree has moved. Record per finding: reproduced / not reproduced / changed since audit. A finding that does not reproduce is a candidate *withdrawn*, not a silent skip. Keep `changed since audit` strictly apart from `not reproduced`: for time-varying subjects — schedules, event-driven automation, external service state — re-query at remediation time and record both the audit-time and current observations. A finding true at the pinned state and overtaken since is not an audit defect and must not be scored as one.
3. **Confirm authority for the fix set.** Which findings get fixed now, which are accepted as residuals (acceptance needs a named owner), which are disputed, which deferred. Do not start editing before this is settled with the requester.
4. **Apply fixes in the report's recommended order** — it encodes dependency knowledge (e.g. regenerate a catalog *after* version-bearing edits). Run the relevant tests after each meaningful group, not only at the end.
5. **Implement intent over letter.** Where a prescription meets a constraint the auditor could not see, implement the goal, document the deviation against the finding ID.
6. **Trace second-order breakage.** Version bumps break fixtures that hard-code versions; renames break routes; regenerated surfaces churn diffs; doc claims go stale. Fold these fixes in with the same bookkeeping, tagged `newly discovered`.

   A landed fix also moves the producer's own claims. When the subject carries an evidence ledger (`docs/audits/<subject>-evidence-ledger.md` with `artifact: audit-evidence-ledger`), run its currency check after the fix set is applied and update the claims whose basis paths moved: `stale` where the evidence must be regenerated, `invalidated` with a replacement ID where a fix changed what the claim means. Skipping this leaves the next audit reading a green ledger that your own fixes falsified. Findings, dispositions, accepted residuals, and inherited audit debt stay in this record and **never** become producer claims — the ledger's subject is the work, not the audit.
7. **Record dispositions and calibration** in the canonical remediation record (below), one line per finding ID. Record the finding's fate separately from the prescription's fate: a reproduced finding closed by a replacement edit is `resolved`, not a defect in the audit. When authorized fixes are done but a surface is reserved to a named owner — an `owner-gated: history-rewrite` purge, an acceptance only the owner can grant — the disposition is `blocked-on-owner`: it is not `resolved` (the gate stays closed) and not `deferred` (the work is done); escalate the accept-or-rewrite decision to that owner. Use the prescription-outcome categories in `references/calibration-record.md`.
8. **Run the exact gate-reopen checks the report named** — the full list, with outcomes. When a finding covers a sensitive payload committed to history, report the **worktree/index scan and the reachable-history scan as separate results** — a purged worktree does not close a non-purged history, and reporting a single "0" hides the open surface. Both scans must be the report's redacted count/existence probes. Remediation ends when that named list is green; a surface left `blocked-on-owner` keeps the gate closed. Report polish or optional systemic work is out of scope unless newly authorized. Report the final gate state to the owner; opening the gate is their decision.

## Remediation Record (canonical handoff)
Write the outcome beside the report it consumes: `docs/audits/YYYY-MM-DD-<subject>-remediation.md`, from `assets/remediation-record-template.md`, keeping its `artifact: audit-remediation-record` frontmatter (which names the consumed report file). This closes the automatable loop: producers and follow-up auditors recognize the pair by path and markers. Include the calibration record per `references/calibration-record.md` — it is how the audit process improves. Commit only what the requester authorizes.

## Use With Other Skills
- `independent-audit` produces the reports this skill consumes; follow-up audits go back to it.
- `maintain-audit-evidence` owns the producer's evidence ledger. This skill updates claim currency after fixes land (step 6) and nothing else in it: do not add claims, do not upgrade a status, and do not mark the ledger closed — those are producer and owner actions.
- Use `agent-cli-tools` when a finding's evidence entrypoint or gate-reopen list needs a missing CLI, or when the report names an evidence task but leaves tool selection open. It owns task-to-tool selection, install identities and tiers, availability checks, and prompted installation; this skill still owns finding re-verification, fix authority, disposition, and exact gate closure.
- Tool substitution must preserve the report's verification intent and be recorded as a deviation against the finding ID. Disclose the substitute's blind spots: if it enforces less than the named tool — an ignored `format`, a skipped rule — its passing result is bounded by that gap, not a clean bill, and a gate-reopen "0" from it is a lower bound. Installing a tool requires the requester's confirmation and never authorizes a fix, networked/credentialed probe, residual acceptance, or a replacement for an exact named gate without documented equivalence.
- The subject repo's own build/test/validation contracts govern how fixes are verified; this skill adds no test policy of its own.

## Validation
- Every register ID has a disposition; none skipped silently.
- Re-verification happened before every edit; withdrawn findings carry the contradicting evidence.
- Deviations from prescriptions are documented against their finding IDs.
- The gate-reopen list ran in full, outcomes recorded verbatim.
- The remediation record sits at the canonical path with its recognition frontmatter and the calibration record filled in.
- Where the subject carries an evidence ledger, its currency was re-checked after the fixes and the claims the fixes moved are marked, with replacement IDs where a claim's meaning changed.
