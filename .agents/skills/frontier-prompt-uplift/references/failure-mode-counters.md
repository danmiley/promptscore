# Failure-Mode Counters

Targeted sentences for behaviours that survive a good prompt. Two rules govern
this whole file:

1. **Add a counter only for a failure the requester actually observed.** These
   are remedies, not hygiene. Adding all of them prophylactically rebuilds the
   bloat the subtractive pass just removed — and each one is a constraint the
   model must reconcile with every other instruction.
2. **Prefer the parameter when one exists.** Overthinking has a reasoning-depth
   fix; over-delegation has a concurrency cap. Prose is the fallback.

One symptom, one sentence. These work *because* they are short and singular.

## Fabricated or optimistic progress

> Before reporting progress, audit each claim against a tool result from this
> session. Report only what you can point to evidence for.

## Unrequested actions

> When the user is describing a problem or thinking out loud rather than
> requesting a change, the deliverable is your assessment. Report findings and
> stop. Before running a command that changes system state, check that the
> evidence supports that specific action.

## Scope expansion and over-engineering

> Don't add features, refactor, or introduce abstractions beyond what the task
> requires. A bug fix doesn't need surrounding cleanup. Don't design for
> hypothetical future requirements, and don't add error handling for scenarios
> that cannot happen — validate at system boundaries only.

## Over-verification

No counter sentence. **Delete the verification instruction that is causing it.**
Adding "don't over-verify" to a prompt that says "always verify" gives the model
a contradiction to resolve.

## Over-delegation to subagents

> Delegate only for large, genuinely independent, parallelizable work. Don't
> delegate what you can finish in a handful of tool calls, and don't use
> subagents to double-check your own work. If one subagent suffices, use one.

Pair with a hard concurrency or spend cap where the harness supports it — the
cap is the real control; the sentence only shapes intent.

## Overthinking and analysis paralysis

> When deciding how to approach a problem, choose an approach and commit to it.
> Avoid revisiting decisions unless new information contradicts your reasoning.

Or lower the reasoning-depth setting, which is cheaper and more reliable.

## Overplanning on an ambiguous task

> When you have enough information to act, act. Don't re-derive facts already
> established, re-litigate a settled decision, or survey options you won't
> pursue. If you're weighing a choice, give a recommendation, not a survey.

## Ending a turn on intent instead of action

> Before ending your turn, check your last paragraph. If it is a plan, a
> question, a list of next steps, or a promise about work you have not done, do
> that work now. End only when the task is complete or you are blocked on input
> only the user can provide.

## Context-budget anxiety

First, stop surfacing remaining-token counts to the model — the countdown is
usually the cause. Where the harness must show one:

> You have ample context remaining. Do not stop, summarize, or suggest a new
> session on account of context limits. Continue the work.

## Unreadable final messages

Use the communication contract in `load-bearing-content.md` rather than a
one-liner; this failure needs the shape described, not a rule.

## Excess narration between steps

> Before your first tool call, say in one sentence what you're about to do.
> While working, give a brief update only when you find something important or
> change direction. When you finish, lead with the outcome.

Positive examples of the cadence you want beat prohibitions on the cadence you
don't.

## Correction ceremony

> Only correct an earlier statement when the error would change the reader's
> code, conclusions, or decisions. State corrections plainly and briefly, then
> continue. For slips that change nothing, make the fix and move on.

## Padded written deliverables

> Match the length of written documents to what the task needs: cover the
> substance, but don't pad with filler sections, redundant summaries, or
> boilerplate.

## Gaming the tests

> Implement a solution that works for all valid inputs, not just the test cases.
> Don't hard-code values or build workarounds. Tests verify correctness; they
> don't define the solution. If a test is wrong or the task is infeasible, say
> so rather than working around it.

## Speculating about unread code

> Never claim what code does before opening it. If the user references a
> specific file, read it before answering.
