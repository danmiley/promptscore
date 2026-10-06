# Output Format

Two legal outcomes. Neither is a failure, and there is no third state.

## Outcome A — `no uplift warranted`

Emitted when the applicability gate fails, or when the gate passes but the
diagnosis comes back clean.

```
no uplift warranted — <one line: which criterion failed, which exclusion fired,
or "diagnosis clean">

<optional: at most three observations, each explicitly marked non-actionable>
```

**No rewritten prompt.** Not a partial one, not a restructured version offered
as a courtesy, not "but here's how it could look." The whole point of the gate
is that it sometimes closes; a gate that always produces a rewrite in the end
was never a gate.

If the requester disagrees with the decline, that is a fine conversation to
have — they can name the mismatch and re-invoke. Producing the rewrite anyway
pre-empts their judgment.

## Outcome B — the uplift proposal

Five parts, in this order.

### 1. The rewritten prompt

Complete and ready to paste — not a diff, not a list of suggested edits. Stamp
it with the target model class and the date it was tuned for, so the next
migration knows what to re-examine:

```
<!-- tuned for: <model class> · <YYYY-MM-DD> -->
```

### 2. The change ledger

One row per change. The restore column is what makes the rewrite reversible, and
a removal row without one is unfinished work.

| Change | Item | Why | Restore if regressed |
|---|---|---|---|
| removed | the six-step procedure in §2 | the model plans this unaided; the steps capped the approach | re-add if the model skips the schema check |
| raised | "run exactly `x`" → "apply the migration" | not a fragile operation; band-5 for no reason | — |
| added | completion test | no observable done-when existed | — |
| kept | the `--no-verify` prohibition | authority limit, not scaffolding | n/a |

Use exactly four change types: `removed`, `raised`, `added`, `kept`. `kept` rows
are not filler — a reader needs to see that the load-bearing lines were
considered and deliberately survived, especially the ones that look like
scaffolding.

### 3. Rubric scores

Both sides, reported separately, never netted into one number:

```
Presence (want high): intent 2 · done-when 0 · hardness marked 1 · boundaries 2 ·
  ground truth 1 · communication 0 · pause policy 2 · ceiling 0
Excess (want low): procedure 2 · steering examples 2 · negative stacks 1 ·
  emphasis 2 · self-verification 2 · CoT 0 · reasoning echo 0 · redundancy 1
```

### 4. Off-prompt recommendations

Separated because the requester has to act on them; the skill cannot. See
`off-prompt-levers.md`. Say plainly which are settings and which are things
someone has to build.

### 5. Risks and open questions

What could not be resolved without the requester's knowledge. Typically:

- constraints whose hardness the text could not settle (kept, flagged);
- examples that might be specification rather than steering (kept, flagged);
- ground truth the prompt implies but does not state;
- anything the standalone-prompt path could not verify because there was no
  repository to read.

If nothing survives, write exactly `No open risks.`

## The damage self-check

Run before emitting Outcome B. Not a formality — this is the check that stands
between a helpful rewrite and a quiet regression.

1. Does every safety constraint, authority limit, destructive-action gate, and
   piece of legal or compliance text in the baseline appear in the rewrite?
2. Does every verifiable local fact — path, schema, version, convention —
   survive?
3. Does the rewrite grant any permission the baseline did not?
4. Did any constraint change hardness without being flagged?
5. Does the rewrite anchor the model on one solution where the baseline left the
   space open?
6. Does the rewrite contain model-conditional branching, or a per-model value
   presented as current?

Any yes on 3–6, or any no on 1–2: fix it and run the check again. Report that
the check ran.

## Applying a proposal

Only on explicit authorization, in the same session, and by applying the
reviewed text — not by regenerating it. Regeneration produces something the
requester did not review, which defeats the review.

When the applied file is a skill body or other versioned artifact, the version
bump, validation, and any audit gate belong to that artifact's own contract.
