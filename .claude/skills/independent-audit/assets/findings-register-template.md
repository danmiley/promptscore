# Findings Register: <subject>

<The register is normally embedded directly in the audit report (see
`audit-report-template.md`) so the handoff is a single file. Use this
standalone form only when the register outgrows the report — e.g. large
corpus audits — and link it from the report.>

Audit date: <date> · Auditor: <identity> · Subject state: <hashes/versions>

Field contract (one finding per row; IDs are stable across follow-up reports
and remediation):

- **ID** — `AUD-NNN`, never reused or renumbered.
- **Kind** — defect / gap / risk / inconsistency / opportunity / positive control.
- **Severity** — per the audit type's bands (P0–P3 for software release gates).
- **Confidence** — confirmed / high / medium / low / unverified.
- **Relationship** — introduced / retained / exposed / n/a.
- **Disposition** (gate) — block / conditional / advisory / accepted / provisional / not-assessed (`provisional` only under the audit type's durability rule).
- **Owner/acceptor** — required when disposition is `accepted`.

| ID | Kind | Severity | Confidence | Relationship | Disposition | Surface | Finding (one line) | Evidence entrypoint | Owner |
|---|---|---|---|---|---|---|---|---|---|
| AUD-001 | | | | | | | | | |
| AUD-002 | | | | | | | | | |

## Remediation disposition log

Filled in by the consumer, not the auditor. One line per finding ID:
`AUD-NNN — resolved (re-verified <how>) | accepted by <owner> | deferred to
<where> | withdrawn (<why the finding was wrong>) | disputed | blocked-on-owner
(authorized fixes done; <owner-reserved surface> pending owner accept/rewrite;
gate stays closed)`. Rows for defects found during remediation are tagged
`newly discovered` — a row tag, not a disposition.
