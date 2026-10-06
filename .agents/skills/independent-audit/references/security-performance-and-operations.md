# Security, Performance, Operations, Documentation, and Process Audits

Thinner guidance for five audit surfaces; each runs the same core loop and
finding schema but defines its own severity bands. Expect these to grow into
full references once more field exemplars exist.

## Contents
- [Security audit](#security-audit)
- [Performance audit](#performance-audit)
- [Documentation / consistency audit](#documentation--consistency-audit)
- [Unattended automation / pipeline audit](#unattended-automation--pipeline-audit)
- [Process / bookkeeping audit](#process--bookkeeping-audit)

## Security audit
- The standard is a **threat model**; the posture is authorized-adversarial.
- **Explicit authorization is a precondition, not a formality.** Confirm the
  engagement scope (targets, techniques, time window, data handling) before
  any probe; this sits on top of the general preflight in
  `evidence-safety-and-authority.md`.
- Findings need an **exploitation scenario** — preconditions, path,
  impact/blast radius — not just a code smell.
- Severity maps to **exploitability × blast radius**, reported alongside
  confidence rather than merged with it: a severe-but-unverified hypothesis
  is not a confirmed exploit and must not read like one.
- Evidence is **redacted**: no live secrets, no weaponized payloads in the
  report; state disclosure restrictions.
- The **not-performed list (untested attack surfaces) is mandatory** — it is
  the difference between "audited" and "the parts we looked at."
- Remediation verification requires **re-testing the exploit path**, not
  reading the patch.

## Performance audit
- The standard is a **budget or baseline**. No baseline, no regression
  verdict — the first audit's job may be to establish one.
- Every finding carries a **measurement with methodology**: workload,
  environment, warmup, iterations, distribution/variance, and the raw result
  path.
- Separate **regressions (gate)** from **opportunities (advisory)** — they
  have different urgency and different owners.
- Refuse adjective-only findings ("feels slow"). If it cannot be measured in
  this audit, it goes in the not-performed list with the missing
  instrumentation named.

## Documentation / consistency audit
- The standard is the **source-of-truth hierarchy** — resolve which document
  wins before comparing.
- Findings are contradictions, staleness, and orphaned references, each with
  **both locations cited** and a proposed reconciliation direction.
- This class is cheap to lint. Where the same contradiction class can recur,
  recommend the lint — if escalation economics hold — and name the owner
  surface it belongs in.

## Unattended automation / pipeline audit

Use these when the decision is "can this run without a human watching it" — a
publication chain, a scheduled reconciler, an evidence pipeline, a release
automation. The defining property of this surface is that **its failures are
green**, so the run list is never the evidence.

- **Enumerate the states in which it reports success**, then ask which of them
  are indistinguishable from permanent loss of the work. Any such state is a
  finding at the severity of the loss, not of the disclosure.
- **A documented residual is not a mitigated one.** Writing a failure mode into
  the engineering log, the auditee brief, and the pull-request description feels
  like handling it. It is not a control: disclosure changes who is surprised,
  not whether evidence is lost. Treat "we documented it" as evidence about
  process quality and rate the finding on its own impact. The corresponding
  outcome constraint is that each eligible unit of work reaches an observable
  terminal state — published, or failed and attributable — with "waiting"
  non-terminal by construction.
- **Failed lookup versus empty answer.** For every step with a legitimate
  "nothing to do" outcome, ask what a *broken* lookup would look like. Where the
  answer is "the same thing", the step must branch on the producing operation's
  status, not on the emptiness of its result. `cmd || true`, blanket stderr
  suppression, `continue-on-error` feeding a value rather than a status, and
  default-returning catches are findings **in their own right** on any lookup,
  separately from whatever they were guarding — each converts "I could not find
  out" into "there is nothing."
- **A validator more permissive than the real consumer certifies nothing.**
  "A YAML library parses it" is not "the platform accepts it"; a passing local
  gate can ship a file the consumer rejects, and the capability silently never
  registers. Name the constraints the consumer enforces that the validator does
  not, and assert them directly.
- **Verify by the externally observable end state** — the deployed artifact's
  content, the published record, the delivered message — never by the run list
  being green. In field cases where three orchestration defects coexisted, the
  run list was entirely green while the product was wrong.
- **Time-varying claims carry a query timestamp.** Scheduled and event-driven
  subjects change between the audit and its consumption. Pin every event query
  to the audit's snapshot time and say so, so a later divergence reads as
  `changed since audit` rather than as a wrong finding.
- **Count the arity of an event-driven retry.** "It retries on the next event"
  is true only while events remain; a retry bounded by upstream completions has
  a last attempt with no successor, and a transient failure landing there is
  permanent. Ask for the time-based backstop.
- **A periodic reconciler needs three bounds, ordered:** grace (transient lag) <
  deadline (declare unrecoverable) < window (stop looking), with window shorter
  than the shortest retention of any input it reads. Without the window, every
  historical item eventually satisfies "past deadline, inputs missing" and the
  alarm goes permanently red with nothing behind it.
- **Check that a guard watches an invariant legitimate operations preserve.**
  Enumerate the lawful operations on the watched quantity — append, prune,
  compact, rotate, migrate — and confirm the guard's quantity survives all of
  them. A monotonicity check on entry count breaks the day retention pruning
  first bites. Where no such quantity exists, distinct verdicts per cause beat
  one alarm. State explicitly whether a control **detects** or **prevents**; a
  detection framed as a guarantee is how an accepted residual quietly becomes an
  assumed control.

## Process / bookkeeping audit
- Verifies the **chain of record** (logs, changelogs, decision records,
  version bookkeeping) against what actually happened in history.
- Findings are unrecorded decisions and records contradicting reality; the
  evidence is the expected chain, the observed state, and the contradiction
  or omission.
- Distinguish "the record is wrong" from "the process that produces the
  record is missing" — the second is the framework finding.
