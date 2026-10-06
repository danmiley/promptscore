# Corpus-Alignment Audits

Audit many artifacts against one named standard — a skill library against a
design doctrine, a docs set against a style contract, a service fleet against
an operational baseline.

## Mechanics
1. **Declare the rubric before scoring**, with anchored bands: what a 10
   looks like, what a 1–3 looks like. Unanchored scores are noise.
2. **State the population**; if not auditing everything, state the sample,
   the selection method, and the unsampled risk. Sampled results are only
   meaningful when the denominator and selection method are stated.
3. **Lead with a summary table** — item, score, one-line read — so the reader
   gets the landscape in one screen. Per-item notes follow for depth.
4. **Include a highest-leverage fixes section above the per-item notes**: the
   handful of changes that move the most items, ordered by payoff. This is
   usually the most-consumed part of the report.
5. **Use measurable proxies as signals, and say so.** Line counts, reference
   counts, link density are evidence, not verdicts — judgment overrides the
   number when cohesion justifies bulk.
6. **Per-item notes carry both directions**: what works (specific) and
   numbered, actionable issues. Scores without notes cannot be acted on.
7. **End with a prioritized cleanup plan** (P0/P1/P2 batches) — this is what
   the remediation branch will actually execute.

## Score distribution is information
If everything scores 7–9, either the corpus is genuinely healthy or the
rubric has lost discrimination — check which before publishing. A rubric that
cannot produce low scores on known-weak items is measuring the wrong thing.

## Verdict
Corpus disposition plus the cleanup plan. There is usually no single gate;
instead name which items (if any) individually block their own gates, and
what corpus-wide score movement the cleanup plan predicts.
