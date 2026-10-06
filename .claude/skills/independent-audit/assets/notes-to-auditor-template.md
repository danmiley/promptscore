# Notes to Auditor: <work / milestone name>

<For the implementer to fill in when handing work to an independent auditor.
Scale to the work: a paragraph for small changes, full sections for
milestones. Claims here are leads for the auditor, not evidence — expect
everything to be re-verified. At handoff time, regenerate the scope, hashes,
and path inventory rather than trusting the authoring-time snapshot. Every
milestone presented as an independently shippable or auditable boundary must
name its identifying commit or tag; do not create checkpoints for milestones
not yet implemented.>

## Scope summary

<What is committed vs. working-tree; what is intentionally absent; the
comparison base the auditor should diff against.>

## Design decisions and rationale

<Each significant decision WITH the road not taken and why — "I did not
reinterpret X as Y because that would silently change committed semantics."
This is the highest-value section for the auditor.>

## What to audit closely

<Your own list of load-bearing risks — the places you are least confident.
Honesty here makes the audit cheaper and sharper; the auditor treats gaps in
this list as signal.>

## Verification lanes

### Agentic / mechanical
<Exact commands with expected artifacts and outcomes — build, test, lint,
capture. No absolute host paths; runnable from a fresh checkout.>

### Human judgment
<Visual/UX/feel checks with precise pass criteria — what "correct" looks
like, stated observably ("flush with the contact line at rest; any visible
gap after settling is a bug").>

## Claimed validation

<What you ran and its results — the auditor will re-run these, so include
enough detail to reproduce (environment, versions where they matter).>

## Known non-goals and residuals

<Pre-declared limitations and accepted debt, so audit effort goes to real
risk rather than rediscovering accepted limitations. Name who accepted each
residual where known.>
