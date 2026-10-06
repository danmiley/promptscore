---
name: frontier-prompt-uplift
description: "Use when explicitly asked to refactor an existing prompt, system prompt, skill body, or agent instruction file for an identified frontier-class model that plans, verifies, and delegates unprompted, and there is a named reason to suspect stale scaffolding, a suppressed creative ceiling, or a model-migration mismatch. Trigger on 'this prompt was written for an older model' or 'uplift this prompt for Fable'. Raises instruction altitude and removes prescriptive scaffolding, steering examples, negative-instruction stacks, emphasis inflation, and redundant self-verification; adds intent, boundaries, completion tests, and off-prompt levers, always as a proposal with a reversible change ledger. Returns 'no uplift warranted' when the baseline is already fit. Not for ordinary task execution, writing a new prompt, general editing, speculative optimization, weaker-model downshifting, or any repository file the requester did not name. Use superprompt to execute a task under verification discipline."
license: MIT
metadata:
  version: "1"
  track: addon
  model-posture: high-reasoning
argument-hint: "<path or text of the prompt to uplift> [target model class] [why you think it needs it]"
---

# Frontier Prompt Uplift

## Purpose
Repair an existing prompt whose scaffolding was written for a model that needed
it. Frontier-class models plan, decompose, self-verify, delegate, and sustain
long runs without being told to; instructions that supplied those behaviours now
cap them, and instructions that fought the old failure mode (laziness) feed the
new one (excess).

This skill is **elicitation**, not assurance. It does not execute the task, does
not verify the work, and does not make anything more trustworthy. It changes how
much room the prompt leaves the model, and it is wrong about as often as any
other judgment call — which is why it proposes and never applies.

Provenance, not a path to open: the guidance here is the operational form of a
synthesis of primary vendor prompting documentation (Anthropic, OpenAI, Google)
and practitioner reporting, current as of 2026-08-15. The source document lives
in the `polymath-skills-dev` repository and is not part of this install.

## Applicability Gate (apply before anything else)

Run an uplift only when **all three** hold:

1. **An identified frontier target.** The requester names the target model
   class, or the prompt is for the host this skill is running on. No identified
   target: ask once, then decline.
2. **A supplied baseline prompt.** An existing artifact to repair — prompt text,
   system prompt, skill body, agent instruction file. Not a task description,
   not a blank page.
3. **A named reason to suspect a mismatch.** One of: scaffolding authored for an
   earlier model generation; a suppressed ceiling, where the prompt
   over-specifies method on a task whose value is range; a model migration; or a
   failure the requester can describe. "It could probably be better" is not a
   reason.

**Decline outright for:** ordinary task execution · writing a new prompt from
scratch · copyediting, tone, or formatting work · speculative optimization with
no diagnosed mismatch · adapting a prompt *downward* for a weaker model ·
a prompt that is already fit for its target.

**Named-skill guard.** A skill body, `AGENTS.md`, `CLAUDE.md`, or other
repository-owned instruction file is eligible **only when the requester names
that specific file**. Never discover candidates, never widen from one named file
to its siblings, never sweep a directory. An authorized pass over several named
files is several invocations with one authorization; a pass over files nobody
named is the always-on optimization layer this skill exists to avoid being.

Declining is a successful outcome, reported in one sentence with the criterion
that failed. Say it plainly and stop — a gate that always opens is not a gate.

## Authority Boundaries
- **Propose, never apply.** The deliverable is a proposal. Writing it into a
  file is a separate action needing explicit authorization in the same session,
  and it applies the reviewed proposal rather than regenerating one.
- **Never remove a load-bearing wall:** safety constraints, authority and
  permission limits, destructive-action gates, legal or compliance text,
  verifiable local facts (paths, schemas, versions, conventions), and the
  requester's own hard constraints. Scaffolding is cheap to restore; a guardrail
  is not.
- **Never add authority the baseline did not have.** A rewrite is not a
  permission escalation. If the baseline required confirmation, so does the
  rewrite.
- Preserve the requester's voice in anything user-facing.
- Flag rather than resolve genuine ambiguity about intent.

## Workflow
1. **Apply the applicability gate.** Record which criteria hold and which
   exclusion fires. If the threshold is not met, emit `no uplift warranted`
   (`references/uplift-report-format.md`) and stop — do not classify, do not
   diagnose, and do not produce a partial rewrite to justify the invocation.
2. **Establish the target.** Use the model class the requester names; absent
   one, the executing host. Never carry a frozen per-model table into the
   answer — read current effort names, defaults, and caps from the requester,
   the host's configuration, or a live documentation check.
3. **Read the baseline in context.** When the prompt is repository-bound,
   inspect the governing repository and local instruction files first; much of
   what looks missing is ground truth living there. For a standalone prompt with
   no repository, work from supplied context, name material unknowns in the
   report, and decline only when an unknown makes a safe rewrite impossible.
4. **Classify the input** — one-shot task prompt, system prompt, skill body or
   instruction file, agent/harness prompt, or eval/judge prompt. The class sets
   which failure surface dominates and which reference to open.
5. **Diagnose** on the two-sided rubric below. If the diagnosis comes back
   clean, that is `no uplift warranted` as well: passing the gate does not
   oblige a rewrite.
6. **Subtract** (`references/subtractive-pass.md`), recording each removal with
   its reason and what to restore if behaviour regresses.
7. **Raise altitude** clause by clause. Keep deliberate low-altitude exceptions
   and say why each survived.
8. **Add** the load-bearing content the baseline lacks
   (`references/load-bearing-content.md`), plus counters only for failure modes
   the requester actually observed (`references/failure-mode-counters.md`).
   Where the task's value is range rather than compliance, open
   `references/creative-latitude.md`.
9. **Name the off-prompt levers** the requester must set themselves
   (`references/off-prompt-levers.md`) — they are recommendations, not edits.
10. **Run the damage self-check** before emitting: did any guardrail, hard
    constraint, verifiable fact, or safety text leave? Did the rewrite anchor
    the model on a single solution it was not anchored on before? Either answer
    yes means fix it and re-run this step.
11. **Emit the proposal** per `references/uplift-report-format.md`, stamped with
    the target model class and the date.

## The Rubric
Two sides, scored 0–2 each. Report both; a single number hides which way the
prompt is wrong and turns the skill into a compressor.

| Presence — want high | Excess — want low |
|---|---|
| intent and audience stated | procedural prescription where judgment suffices |
| observable completion test | examples used to steer rather than specify |
| hard constraints marked as hard | stacked negative instructions |
| authority and reversibility boundaries | emphasis inflation (`CRITICAL`, `MUST`, caps, repetition) |
| ground truth the model cannot infer | self-verification and double-check instructions |
| communication contract for the final message | chain-of-thought scaffolding |
| pause and escalation policy | instructions to echo or explain internal reasoning |
| creative ceiling raised, not just floor | the same rule restated across layers |

**Score a presence dimension only where the prompt's context makes it
load-bearing; `n/a` is a legitimate score and not a gap.** A short interactive
request needs no communication contract, a compliance task needs no raised
ceiling, and a prompt with nothing irreversible in reach needs no authority
boundary. Treating every zero as something to add is how this skill would become
the bloat generator it exists to reverse — and it is the most likely way for a
clean prompt to be talked into a rewrite it did not need.

A prompt scoring low on the left and low on the right is thin, not good: add
before subtracting. A prompt scoring high on both is bloated but contains the
right content — subtract hard and expect the presence scores to survive. A
prompt scoring high on the left and low on the right is **fit**: return
`no uplift warranted`.

## Hard Rules
- **`no uplift warranted` is a first-class result.** It has no rewritten prompt
  attached, not even a partial one offered as a courtesy.
- **Every removal carries a restore note.** A ledger entry without one is not
  reversible and is not finished.
- **Constraint hardness is preserved, or asked about.** A constraint that reads
  as offhand may be load-bearing; when the text cannot settle it, keep it and
  ask.
- **Shorter is not the objective.** Length is a symptom the rubric happens to
  measure. A rewrite that is 40% shorter and drops one authority limit is a
  regression.
- **No model-conditional branching in the produced text.** Phrase strictness,
  not audience: "follow this command exactly", never "if you are a smaller
  model".
- **Instructions to reproduce internal reasoning are removed, not softened.** On
  some frontier models this phrasing triggers a reasoning-extraction refusal and
  silent fallback to a weaker model. Replace with structured thinking output or
  a tool that surfaces progress.

## Reference Routing
Open one per decision; they are not a bundle.

- Removing scaffolding, steering examples, negative stacks, emphasis inflation,
  redundant verification, CoT scaffolds, reasoning-echo phrasing, and the
  diagnostic question for each: `references/subtractive-pass.md`
- Intent, completion tests, boundaries, ground truth, communication contract,
  pause policy, progress grounding, memory, tools-instead-of-instructions:
  `references/load-bearing-content.md`
- Ceiling raising, opening the option space, constraint-hardness labelling,
  anchoring, divergent versus convergent phases: `references/creative-latitude.md`
- A specific observed misbehaviour needing a targeted counter sentence:
  `references/failure-mode-counters.md`
- Reasoning depth, delegation caps, timeouts and asynchrony, tool provisioning,
  refusal and fallback surfaces: `references/off-prompt-levers.md`
- Both output shapes, the change ledger, and the damage self-check:
  `references/uplift-report-format.md`

## Use With Other Skills
- `superprompt` executes a task under verification discipline. It is assurance;
  this is elicitation. Never merge them, and never strip a `superprompt`-style
  guardrail on the grounds that it looks like ceremony — "verify before
  claiming" is load-bearing, "re-read your answer twice" is not.
- `polymath-skill-builder` owns skill packaging, catalog registration, and
  version discipline. When an uplift proposal for a skill body is applied, that
  skill's version bump and validation run under its contract, not this one.
- `independent-audit` is the right gate when an applied uplift changes a
  governing artifact; this skill produces no verdict and opens no gate.
- `project-web-search` supplies current vendor specifics when the target's
  effort names, defaults, or refusal surfaces need checking rather than
  assuming.

## Validation
- The applicability gate was applied and its outcome stated, including which
  criterion failed on a decline.
- A repository-owned instruction file was touched only when the requester named
  that file.
- The proposal was not written into any file without separate authorization.
- Every removal in the ledger carries a reason and a restore note.
- The damage self-check ran, and no safety constraint, authority limit,
  destructive-action gate, or verifiable local fact is absent from the rewrite.
- Rubric scores are reported for both sides, not netted into one number.
- The rewrite contains no model-conditional branching and no frozen per-model
  values presented as current.
- The proposal is stamped with the target model class and the date.
