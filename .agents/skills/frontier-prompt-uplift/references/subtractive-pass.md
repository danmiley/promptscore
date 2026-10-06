# The Subtractive Pass

The highest-yield operation on an inherited prompt. Each pattern below has a
tell, a reason it now costs something, and a replacement. Work through the ones
the diagnosis flagged; do not run the whole list as a checklist.

**The governing question for every candidate removal:** *if this text were gone,
would the output be **wrong**, or merely **different**?* Only the first earns
its tokens back.

## Step-by-step procedure for a task the model can plan

**Tell:** numbered steps describing an approach the model would arrive at
unaided; "first… then… finally" over ordinary work.

**Cost:** caps the plan at the author's imagination. Frontier reasoning
routinely exceeds a hand-written plan.

**Replace with:** outcome, constraints, acceptance test. Keep ordering only
where a dependency is real and not discoverable from the artifacts.

**Keep when:** the sequence is fragile, irreversible, or must be byte-identical
— migrations, release steps, anything with a rollback.

## Examples used to steer rather than specify

**Tell:** three examples of competent output in a format the model already
produces well.

**Cost:** examples are an attractor. Teams removing them from frontier prompts
report *more* creative output, not less consistent output.

**Keep when:** the example carries information the model cannot infer — a house
format, an idiosyncratic schema, a domain convention with no general rule.

**Delete when:** the example only demonstrates competence.

## Stacked negative instructions

**Tell:** three or more "do not…" or "never…" clauses in sequence.

**Cost:** prohibitions are followed literally, over-generalized, and interfere
with each other at volume.

**Replace with:** one positive statement of the wanted behaviour plus the
reason. "Never use ellipses" becomes "This is read aloud by a speech engine,
which cannot pronounce ellipses." The model generalizes from the explanation and
handles the cases the list missed.

**Exception worth knowing:** a prohibition naming *specific attractors* still
works ("avoid Inter, Roboto, purple-on-white gradients"). The failure is
prohibiting a behaviour *class*, not naming concrete things to avoid.

## Emphasis inflation

**Tell:** `CRITICAL:`, `MUST`, `ALWAYS`, capitals, bold on whole sentences, the
same rule repeated for weight.

**Cost:** language that used to fix under-triggering now causes
over-triggering. When everything is critical, the genuinely inviolable rule has
no way to signal itself.

**Replace with:** normal declarative voice. Leave at most one emphatic
construct, on the rule that actually cannot be violated.

**Related, subtler:** absolutes the model can see counterexamples to invite it
to resolve the contradiction on its own terms. Softening "always verify" to
acknowledge the legitimate exception tends to *raise* compliance.

## Self-verification and double-check instructions

**Tell:** "double-check your answer", "re-verify before responding", "include a
final verification step", a mandatory review pass on every output.

**Cost:** compounds with self-verification the model already performs, adding
tokens and latency with no quality gain.

**Delete rather than rewrite.**

**Keep — this distinction is the whole rule:** instructions to consult
*reality* stay. Run this suite. Diff against this golden. Check with a
fresh-context verifier. Audit each progress claim against a tool result from
this session. Delete instructions to re-read its own work; keep instructions to
go look.

## Chain-of-thought scaffolding

**Tell:** "think step by step", `<thinking>` templates, "reason through this
before answering", multi-stage reasoning harnesses around a single call.

**Cost:** redundant where reasoning is native and depth is a parameter.

**Replace with:** the reasoning-depth setting (`off-prompt-levers.md`).
Prompt text may still *steer* thinking — "thinking adds latency; when in doubt
respond directly" — but should not manufacture it.

## Instructions to reproduce internal reasoning

**Tell:** "show your work", "explain your reasoning", "narrate your thinking",
"transcribe your chain of thought into the response".

**Cost:** on some frontier models this is a refusal trigger, not merely waste —
it can classify as reasoning extraction and cause a silent fallback to a weaker
model, degrading capability invisibly.

**Replace with:** structured thinking output where the platform exposes it, or a
tool that surfaces user-facing progress verbatim. Where the real intent is
*evidence*, say so directly: "cite the check you ran and its result" is not a
reasoning-echo instruction.

**This one is removed, not softened.**

## Anti-laziness and thoroughness prodding

**Tell:** "be thorough", "if in doubt, use [tool]", "default to using [tool]",
"do not be lazy", "make sure you really investigate".

**Cost:** frontier models are already proactive; this over-triggers, producing
tool spam and unrequested exploration.

**Replace with:** a conditional trigger — "use [tool] when it would improve your
understanding of the problem" — or a lower effort setting.

## Format-forcing tricks

**Tell:** prefilled assistant turns, "begin your response with…", elaborate
delimiters to force a shape.

**Cost:** prefill is unsupported on current frontier models and errors outright.

**Replace with:** structured output schemas, tool/enum definitions, or a direct
"respond without preamble" instruction, plus post-processing if a stray preamble
matters.

## Redundant restatement across layers

**Tell:** the same rule in the system prompt, the skill, and the task text.

**Cost:** three chances to conflict, three token charges, and an implicit signal
that the rule is contested.

**Replace with:** one home per rule, chosen by scope — harness-wide goes in the
system prompt, domain goes in the skill, this-task goes in the request.

## Explanation of common knowledge

**Tell:** a paragraph defining a widely-known format, library, or concept.

**Cost:** pure token spend against a model that already knows it.

**Test:** does this paragraph tell the model something it could not have?

## What never leaves

Restated because the subtractive pass is where damage happens:

safety constraints · authority and permission limits · destructive-action gates ·
legal and compliance text · verifiable local facts (paths, schemas, versions,
conventions) · the requester's own hard constraints.

When a line *looks* like scaffolding but might be one of these — a casually
phrased warning about a script, an authority limit buried mid-paragraph — keep
it and ask. The cost of keeping one redundant sentence is a sentence. The cost
of removing one guardrail is the incident it was written after.
