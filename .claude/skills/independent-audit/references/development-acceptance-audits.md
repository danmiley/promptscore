# Development-Work / Acceptance Audits

Audit completed development work against the contract that commissioned it —
a build prompt, milestone contract, or acceptance-criteria list.

## Standard
The standard is the build contract itself. Resolve it first: which document,
which revision, and what precedence if the contract and the repo's standing
rules conflict.

## Mechanics
1. **Audit each acceptance criterion to an explicit pass / partial / fail
   with evidence.** Partial passes are the most informative verdicts — "pass
   in prose; partial fail in script output" tells the reader exactly where
   the gap is. Do not round them up or down.
2. **Give executable deliverables behavioral probes, adversarially chosen.**
   Quoted/escaped inputs, missing-file layouts, fresh-install paths, clean
   `$HOME`. The classic blockers — an installed script that cannot find its
   asset, invalid JSON under ordinary quoting — are invisible to static
   validation and only appear when the deliverable runs in the shape a user
   will run it.
3. **Test executable content by behavior, not folder name.** Templates,
   snippets, and copy-paste cells that agents will execute are operational
   dependencies and get syntax plus representative runtime checks, exactly
   like scripts — regardless of which directory they live in.
4. **Verify dogfood claims where feasible.** Where not feasible, say
   precisely which claim was taken on trust and at what confidence.
5. **Check the work's bookkeeping obligations** (logs, version bumps,
   registration rows) against the contract's requirements.

## Report shape
Include the conditional **Acceptance Criteria Review** section: one row or
subsection per criterion, verdict plus evidence. Findings that are contract
gaps (the criterion was ambiguous or untestable) are findings about the
standard — report them under the framework assessment, not as work defects.

## Verdict
Close with a **suggested gate before merge**: the exact fix set plus the
re-validation command list. If the contract named its own gates, run them
and report each.

For follow-ups, apply the scoped-but-independent contract in Core Loop step 6;
do not inherit the remediation record's validation claims.
