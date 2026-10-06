# Milestone / Design-Conformance Audits

Audit an in-flight implementation milestone against its design or milestone
document.

## Standard
The design/milestone doc, at a named revision. If the implementation exposed
gaps or ambiguities in the doc, auditing the doc is in scope — report those
under the framework assessment.

## The three central questions
1. **Conformance.** Does the code do what the milestone says — behavior,
   interfaces, and the milestone's own acceptance evidence?
2. **Containment.** Does it avoid doing the next milestone's work early?
   Check that milestone N does not accidentally imply or hard-commit
   milestone N+1's semantics.
3. **Boundary preservation.** Dependency and ownership rules hold — e.g.
   "the headless crate must not import the renderer," "the parser owns
   validation, the CLI owns presentation."

## Mechanics
- Architectural boundaries get **mechanical checks where they exist**
  (boundary tests, dependency scans) and manual verification where they do
  not — plus a finding recommending the mechanical check where escalation
  economics justify it.
- **Split the audit into two lanes** and report them separately:
  - *Agentic lane*: build/test/lint/capture commands with expected
    artifacts — everything a machine can verify.
  - *Human lane*: visual/UX judgment with precise instructions for what
    "correct" looks like ("flush with the contact line at rest; any visible
    gap after settling is a bug"). If no human is available, the lane goes
    in the not-performed list — it does not silently disappear.
- **Prefer measured evidence for visual claims** — captured images with
  asserted pixel bounds beat adjectives.
- **Keep cross-cutting invariants as a standing checklist** rather than
  rediscovering them each milestone: idle/resource doctrine ("returns to
  quiet after animation"), determinism guarantees, error-path behavior —
  whatever the project's design doc declares as always-true.

## Verdict
Milestone disposition: complete / complete with conditions / not complete,
with the blocking finding IDs and the re-verification list. Where the
milestone doc named its own exit criteria, review each explicitly
(pass/partial/fail) like an acceptance audit.
