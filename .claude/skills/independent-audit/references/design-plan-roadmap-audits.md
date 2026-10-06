# Design / Plan / Roadmap Audits (pre-build)

Audit an artifact *before* it is built — a design doc, milestone plan, or
product roadmap — at the decision point where revising is cheap and building
on a flaw is expensive. What makes it an audit is the decision point and the
named standard, not the maturity of the subject.

## Standard
The original ask, the north-star/architecture documents, and the **actual
current implementation**. The last one matters most: verify the artifact's
claims about existing APIs, data shapes, and dependencies against source, not
against the artifact's own assertions.

## What to test
- **Internal consistency.** Milestone ordering, contradictory statements
  across sections, terms that drift meaning between chapters.
- **Feasibility.** Will the proposed mechanism produce the claimed output?
  The strongest pre-build findings are domain-reasoning counterexamples
  (e.g. a sampling design that will almost always produce empty results) —
  proven by mathematics or source constraints, not by a failing command.
- **Dependency ordering and premature dependencies.** Does milestone N
  quietly require milestone N+2's output? Does the plan build on components
  that do not exist yet without saying so?
- **Containment.** Does each milestone avoid doing the next milestone's work
  early?
- **Migration and rollback.** Is there a path back from each step?
- **Observability and validation strategy.** How will the builders know each
  step worked?
- **Policy coverage.** Privacy, security, provenance, licensing — gaps here
  harden into code if not caught pre-build.
- **Operational ownership and unresolved decisions.** Who owns each surface;
  which decisions the artifact defers without flagging.

## Evidence
Reasoning-chain-plus-citations: the requirement, the proposed model, a
counterexample or failure scenario, and the conflicting document locations
for inconsistencies. Commands appear only where a claim about existing code
can be mechanically checked.

## Finding kinds
Design audits generate more **missing decision** findings than defect
findings. Separate blockers, missing decisions, risks, opportunities, and
nits explicitly — conflating them buries the blockers.

## Verdict
A **design disposition**: approve / approve with conditions / revise before
build. Do not force a tag/merge verdict where no release gate exists. Name
the conditions precisely enough that the author can satisfy them without
guessing.

An uncommitted pre-build artifact may receive a provisional review, recorded
as `gate: provisional`, but a document intended to govern multi-session work
must be committed before the design gate is closed.
