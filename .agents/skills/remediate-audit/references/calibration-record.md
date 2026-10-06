# The Calibration Record

The remediator's structured feedback about the audit itself — how the audit
process improves. It lives in the remediation record's Calibration section.
Fill every field; "not applicable" is a value, an empty field is not.

## Fields

- **Claim reproduction rate** — of the findings re-verified, how many
  reproduced exactly as reported (e.g. `5/5`). Name any that reproduced
  differently than described. Findings recorded as `changed since audit` are
  excluded from the denominator, not counted as failures to reproduce.
- **Withdrawn findings** — count and IDs of findings that did not survive
  re-verification, with the contradicting evidence.
- **Changed since audit** — count and IDs of findings that were true at the
  pinned subject state and have since been overtaken by events, with the new
  evidence. This is a distinct outcome from *withdrawn* and it is **not** an
  audit-quality defect. Audits of scheduled or event-driven automation go stale
  by design: a correct "no scheduled run has fired yet" finding at the snapshot
  becomes false hours later when the schedule fires. Scoring healthy automation
  against the auditor punishes the audit for working. Withdrawn means the claim
  was never true; changed means it stopped being true.
- **Missed issues** — defects discovered during remediation that the audit
  should plausibly have caught (in-scope, on an audited surface). Out-of-scope
  discoveries are tagged `newly discovered` (a row tag, not a disposition),
  not misses.
- **Severity/disposition agreement** — did the remediator and owner agree
  with the audit's severities and gate calls? Note each disagreement and how
  it resolved.
- **Recommendation implementability** — was the fix order executable as
  written? Count the steps that needed clarification or intent-over-letter
  deviation.
- **Prescription efficiency** — one summary line derived from disposition
  rows, counting: implemented as prescribed / equivalent-or-smaller fix /
  implemented to intent because the letter was infeasible / prescription
  withdrawn because the finding did not reproduce / accepted or deferred
  without remediation. Finding validity and prescription fate stay separate:
  `blocked-on-owner` is a *finding* disposition, not an efficiency category —
  a `blocked-on-owner` row still records how its authorized portion performed
  here (e.g. implemented as prescribed), with the owner-reserved remainder
  named in the row's Detail. Never put one value in both the finding-disposition
  and prescription-outcome columns.
- **Yield** — one line with counts for blockers, material non-blockers,
  withdrawn findings, and systemic proposals adopted.
- **Second-order breakage: predicted vs. actual** — what the audit said its
  recommendations would break, vs. what actually broke.
- **Probes promoted to standing checks** — the audit's gate-reopen probes that
  crossed from one-off diagnosis into stable user-visible acceptance, with the
  owner surface and the milestone where each becomes a test. A good audit
  reduces the cost of the next one; repeating its exact manual matrix by hand
  guarantees drift. Promote only at a real implementation boundary, and keep
  evidence-producer tests separate from presentation tests. Record `none` when
  every probe was genuinely single-use — this field does not license inventing
  test work.
- **One qualitative lesson** — the single most reusable thing this loop
  taught about auditing or remediating.

## Optional headline score

A 1–10 is welcome **on top of** the record only with anchored bands:

- **9–10** — every sampled claim reproduced; fix order executed top-to-bottom
  with no clarification; no in-scope misses.
- **7–8** — all material claims held; minor evidence gaps or one deviation.
- **5–6** — a withdrawn finding, an in-scope miss, or a fix-order step that
  required rework.
- **≤4** — multiple withdrawn findings or a wrong gate call; the audit cost
  more than it saved.

An unanchored number alone is noise — omit it rather than guess.

## Discrimination watch

The bands are anchored, but the aggregate is secondary. If headline scores
stop distinguishing loops that differ on the component measures above, add
or re-anchor a component before trusting the aggregate. Do not trigger this
mechanically from one repeated score or a small selected sample.

## Where feedback lands

The record itself stays in the remediation file. Promote a lesson to durable
memory (the target's engineering log or repo-memory lane, where present)
only when it teaches something reusable beyond this loop. Do not create a
durable record for every routine score, and never tune auditors toward one
consumer's satisfaction number.
