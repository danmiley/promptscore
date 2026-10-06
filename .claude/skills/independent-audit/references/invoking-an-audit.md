# Invoking an Audit: What to Ask For

For the person (or orchestrating agent) starting an audit session. An audit
request needs three things; everything else the skill derives or asks for:

1. **Subject** — what is under audit: a branch, a milestone's implementation,
   a design doc, a directory, a release candidate. Name it concretely.
2. **Standard** — what it is judged against: a design spec, milestone
   contract, acceptance criteria, repo contract, rubric. A file path or
   document name is ideal; "our design spec for milestone 3" is enough to
   start.
3. **Decision** — what the verdict gates: merge, tag, milestone sign-off,
   proceed-to-build. This picks the primary audit shape and the verdict
   vocabulary.

If the request omits one of the three, ask for it before the preflight —
an audit without a named standard is an opinion, and one without a decision
has no verdict to issue.

## Example asks

Milestone against a design spec (the most common shape):

> I want to audit the work in this repo for milestone M4 against
> `docs/design-spec.md`. The decision is milestone sign-off. Audit the
> committed work on this branch; the tree may be dirty — pin what you find.

Branch / release gate:

> Audit branch `feature-x` against `main` as a release candidate. Standards:
> the repo contract and the acceptance criteria in the PR description.
> Verdict: merge or hold.

Pre-build design review:

> Audit `docs/new-cache-design.md` before we build it. Compare it against
> the current implementation's actual APIs. Verdict is a design
> disposition, not a merge gate.

Completed work vs. a build prompt:

> Here is the prompt the implementing agent was given: <prompt or path>.
> Audit the resulting work against it, criterion by criterion.

## What the requester gets, and where

- A decision-grade report at `docs/audits/YYYY-MM-DD-<subject>-audit.md`
  in this repo (created untracked; committing it is the owner's call).
  Its frontmatter (`artifact: independent-audit-report`) carries the gate
  verdict and blocking finding IDs; the body carries the findings register,
  evidence, a dependency-ordered fix list, and the exact re-checks that
  reopen the gate.
- Nothing else in the repo is touched — the audit is read-only apart from
  that one file, and the report's integrity section confirms it.

## After the report

Acting on the report is a separate task with separate authority. Start a
session (typically the implementing agent) with:

> Process the audit report at `docs/audits/<file>` with remediate-audit.
> Fix findings <IDs or "all">; I accept <IDs> as residuals.

That workflow re-verifies every finding before editing, fixes in the
report's order, and writes a remediation record beside the report.

## If you are the implementer preparing for an audit

Fill in `assets/notes-to-auditor-template.md` (scope, design decisions with
rationale, what to audit closely, verification lanes, known residuals) and
tell the auditor where it is. It makes the audit sharper and cheaper; a
paragraph suffices for small changes. Apply the template's handoff-freshness
and conditional milestone-boundary rules immediately before sending it.

For work that spans multiple sessions or commits, keeping the brief current by
hand is the part that fails: earlier sections survive later edits that changed
what their claims mean. `maintain-audit-evidence` maintains a live claim ledger
for exactly that case and projects a dated brief into this template at handoff.
The auditor's protocol is unchanged either way — the ledger is read at Core Loop
step 5, after the independent risk map, and every label in it is a lead.
