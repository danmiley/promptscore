# Report Quality and Calibration

Open this before writing the report. It carries the quality bar, the
anti-pattern list, escalation economics, and the calibration record the
report's consumer will produce about you.

## Contents
- [The quality bar](#the-quality-bar)
- [Anti-patterns](#anti-patterns)
- [Escalation economics](#escalation-economics)
- [What the consumer will do with your report](#what-the-consumer-will-do-with-your-report)
- [The calibration record](#the-calibration-record)

## The quality bar
Distilled from closed feedback loops where remediation agents consumed audit
reports end-to-end and re-verified every claim before acting. These are the
properties that made that cheap:

1. **Every finding is cheaply verifiable.** Pinned citations, a verification
   entrypoint, claim-appropriate evidence. The reader's first act is to
   distrust you; make distrust cheap.
2. **Severity is argued, not asserted.** Each blocker says *why* it blocks
   this gate — tie it to the named standard or the user-visible failure.
3. **Recommendations follow the finding model's goal-first, minimum-sufficient
   contract.** Name the files to change together and the re-verification to
   run; another agent can follow the fix order without clarification.
4. **Verified and believed are kept apart.** Confidence is explicit; checks
   that could not run produce labeled residual risks, not implied facts.
5. **It resists scope flattery and scope creep symmetrically.** Do not soften
   findings because the work is impressive; do not manufacture findings to
   seem thorough. Advisory items may say "the current choice is defensible."
6. **It survives being wrong gracefully.** Preserve the closing constraint
   from the finding model when a suggested edit meets an unseen constraint.
7. **It audits its own tooling assumptions.** Recommendations trace their own
   side effects: version bumps break fixtures that hard-code versions;
   renames break routes; regenerated surfaces churn diffs. Name what your
   recommended changes will break.
8. **It preserves the subject.** The report states the audit left the work
   untouched — or discloses exactly what changed and under what authority.

## Anti-patterns
Each observed in real audit corpora:

- **Validation by inheritance.** Repeating the auditee's "all tests pass"
  without re-running them. Re-running in a fresh environment is where the
  blockers hide.
- **Findings without evidence.** "The escaping looks insufficient" vs. an
  actual parse error on a real command. For non-executable claims, the
  equivalent failure is a conclusion without the reasoning chain and cited
  locations.
- **Fixing during the audit.** Contaminates evidence, blurs authorship,
  exceeds granted authority.
- **Anchoring on the auditee's frame.** Reading the implementer's brief
  before forming an independent risk map, then auditing only what the
  implementer worried about. A structured producer evidence ledger anchors
  harder than prose does — its per-claim statuses and trust labels read as
  results rather than as the assertions they are — so the ordering rule binds
  with more force, not less, when one exists.
- **Taxonomy-driven blind spots.** Deciding testing depth by folder name
  ("no script tests apply, the code lives in assets/") rather than by
  whether the content gets executed. Audit behavior, not filing.
- **Developer-machine masking.** A documented path "works" because your
  machine has a global install the target will not have. Check the
  fresh/installed/deployed shape.
- **Severity inflation and deflation.** Everything-is-a-blocker reports get
  ignored; everything-is-advisory reports get rubber-stamped.
- **The unordered laundry list.** Fifty findings with no fix order transfers
  prioritization to a reader with less context than you have.
- **Ghost positives.** Omitting what works; the reader then cannot
  distinguish "unexamined" from "examined and sound."
- **Advice to nobody.** Framework recommendations with no owner surface
  ("someone should add a lint") instead of naming the contract file or test
  suite the rule belongs in.
- **Process manufacture.** A new permanent gate for every one-off mistake —
  see escalation economics.

## Escalation economics
**Tier 1 — relevance:** every proposed fixture, rubric field, gate, document,
or abstraction must change a decision, catch a plausible recurrence, or
materially reduce verification cost; otherwise omit it.

**Tier 2 — proportionality:** a relevant proposal that would become a
permanent rule, test, rubric, or gate must also justify its ongoing cost:
severity, recurrence, deterministic cheap checking, contract contribution,
prior occurrence, and a natural owner surface. Relevant and proportionate,
or it does not ship.

A shipped proposal names its **acceptance check** — the concrete signal that
tells the owner the rule actually took effect, not merely that it was filed: a
test that fails on the bad input and passes after the fix, a gate that now
rejects what slipped through, a fixture that now exists. "Add a lint" with no
way to confirm the lint is live is advice to nobody with extra steps.

## What the consumer will do with your report
Write for this protocol — it is how strong reports get consumed:

0. Locate the report at the canonical handoff path
   (`docs/audits/*-audit.md` with `artifact: independent-audit-report`
   frontmatter) and trust its identity from that contract — this is why the
   path and marker are fixed.
1. Re-verify every finding before changing anything (credibility is
   per-claim, not global); finding IDs preserved throughout.
2. Confirm authority for the fix set: which findings get fixed, which are
   accepted as residuals and by whom.
3. Apply fixes in your recommended order (it encodes dependency knowledge —
   e.g. regenerate the catalog *after* version-bearing edits).
4. Where a prescription meets a constraint you could not see: implement the
   intent, document the deviation.
5. Absorb second-order breakage you did or did not predict (fixtures,
   generated files) with the same bookkeeping.
6. Record a disposition per finding ID: resolved (re-verified) / accepted
   (by whom) / deferred / withdrawn (finding was wrong) / disputed /
   blocked-on-owner (authorized fixes done, but a surface — e.g. history
   rewrite — is reserved to a named owner, so the gate stays closed). Rows
   for defects found during remediation are tagged `newly discovered`.
7. Run the exact gate-reopen checks you named; report final disposition.

Every element of the report contract exists to make one of those steps cheap.

## The calibration record
The consumer closes the loop with structured feedback about the audit itself:
claim reproduction rate; false-positive/withdrawn count; issues missed but
discovered during remediation; severity/disposition agreement; recommendation
implementability; predicted vs. actual second-order breakage; one qualitative
lesson. A headline score is welcome on top only when its bands are anchored
(e.g. 9+ = every sampled claim reproduced and the fix order executed without
clarification) — an unanchored number alone is noise.

Expect this record; do not optimize for a single consumer's satisfaction
number. Durable lessons belong in the target's engineering log or repo
memory where one exists; routine scores do not.
