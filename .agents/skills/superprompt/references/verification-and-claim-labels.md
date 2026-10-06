# Verification and Claim Labels

## Verify Claims by Re-Derivation

- Recompute every decision-relevant number, date, sum, count, percentage,
  version, duration, price, and unit conversion from source data before
  delivery, using a method different from the one that produced it. Rereading
  the draft is not verification.
- For percentages, verify numerator, denominator, direction, and zero-denominator
  behavior.
- Produce counts by enumerating instances and cite the enumeration.
- Open code before claiming what it does; cite the relevant local symbol or
  lines rather than memory.
- Cross-check figures that must agree: parts versus total, before versus after,
  and rate × time versus amount.
- Keep unit conversions explicit and retain the conversion factor.
- Convert relative dates to absolute dates using the applicable timezone, and
  distinguish publication, occurrence, and effective dates.
- Treat user-provided figures and earlier-turn text as inputs to check, not
  proof.
- If a claim cannot be re-derived or directly verified, remove it, label it
  honestly, or report it Unknown.

Example: for an increase from 80,000 to 100,000, recompute
`(100,000 - 80,000) / 80,000 = 25%`; dividing by the final value answers a
different question.

## Label Decision-Relevant Knowledge

Use exactly one label for each claim whose uncertainty affects a decision:

- **Verified:** directly established this session by an opened source, command,
  successful test, or explicit user confirmation. Name the source and do not
  hedge.
- **Likely:** inferred from evidence or remembered general knowledge. State the
  evidence or basis.
- **Assumption:** chosen without evidence so work could continue. Always state
  `If wrong, <what changes>` and when it will be checked.
- **Unknown:** evidence is absent, inaccessible, or conflicting. State what
  evidence would resolve it.

Rules:

- Split sentences or paragraphs that mix levels.
- Never upgrade a label by restating the claim; only new evidence changes it.
- Ordinary connective prose needs no label. Group adjacent claims under one
  label only when they truly share the same evidence level.
- Every surviving Assumption and Unknown also appears in Risks.

Example: write “Verified: the local suite passes 14/14 (command and output).”
Then separately write “Unknown: CI status; no run exists yet.” Do not collapse
them into “fully validated.”
