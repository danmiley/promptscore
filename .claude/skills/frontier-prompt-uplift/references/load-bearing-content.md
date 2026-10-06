# Load-Bearing Content

What a capable model cannot derive from the request itself. This is what the
subtractive pass makes room for; a prompt that only loses text has been
compressed, not uplifted.

Add only what the diagnosis found missing. Adding all of it recreates the bloat.

## Intent — the reason, not only the request

The highest-value single addition to most prompts, and the one that shrinks the
procedure section fastest: a model that knows *why* can choose the *how*.

Shape:

> I'm working on [the larger task] for [who it's for]. They need [what the
> output enables]. With that in mind: [request].

Diagnostic: if the prompt would read identically for two different underlying
goals, intent is missing.

## An observable completion test

Vague success words — clean, production-ready, best, polished — give the model
nothing to check against, so it either pads or stops early. Replace with a
condition someone could evaluate:

> Done when: [observable fact].

Derive it from the request, the repo's conventions, or the acceptance criteria
that already exist. If no test can be stated, that is a finding to report, not a
gap to paper over: an unstatable completion test usually means the request is
still a research question.

## Boundaries — scope, authority, reversibility

Frontier models act. Three boundaries, each one or two sentences:

**Deliverable boundary** — what counts as done, and what would be overreach:

> When the user is describing a problem, asking a question, or thinking out loud
> rather than requesting a change, the deliverable is your assessment. Report
> your findings and stop.

**Authority boundary** — reversible work proceeds, irreversible work asks:

> Take local, reversible actions freely — editing files, running tests. For
> actions that are hard to reverse, affect shared systems, or could be
> destructive, ask first. Do not use a destructive shortcut to get around an
> obstacle.

**Scope boundary** — note its shape: it does not forbid the model from having a
better idea, it routes the idea into a sentence instead of into unrequested
work.

> Deliver what was asked, at the scope intended. If the request seems mistaken
> or a better approach exists, say so in a sentence and continue with the task
> as asked, rather than quietly narrowing, widening, or transforming it.

## Ground truth the model cannot see

Repo conventions, schema and field names, which of two similar directories is
authoritative, the fact that CI runs a different lane than local, the version
actually installed. This content always earns its tokens, and it is the content
most often crowded out by procedural filler.

When uplifting a repository-bound prompt, this is the category most likely to be
*missing* rather than excessive.

## The communication contract

Long runs produce final messages written in the model's own accumulated
shorthand. The core idea: the final message is for a reader who did not see any
of the work.

> Your final summary is for someone who did not watch you work. Lead with the
> outcome — one sentence answering what happened or what you found — then the
> supporting detail. Drop the working shorthand: no arrow chains, no
> hyphen-stacked compounds, no labels you coined mid-task. Give each file, flag,
> or identifier its own plain-language clause. If you must choose between short
> and clear, choose clear.

## Pause and escalation policy

Frontier models both over-ask and under-ask depending on framing. Pick the one
that matches the run:

**Interactive:**

> Pause for the user only when the work genuinely requires them: a destructive
> or irreversible action, a real scope change, or input only they can provide.
> If you hit one, ask and end the turn rather than ending on a promise.

**Autonomous:**

> You are operating autonomously; the user cannot answer mid-task, so asking
> "shall I…?" blocks the work. For reversible actions that follow from the
> original request, proceed. Before ending your turn, check your last paragraph:
> if it is a plan, a question, or a promise about work you have not done, do
> that work now. End only when the task is complete or you are blocked on input
> only the user can provide.

## Progress-claim grounding

For long or unattended runs. This is the one *added* verification instruction
that belongs on frontier models, because it verifies against tool results rather
than against the model's own memory:

> Before reporting progress, audit each claim against a tool result from this
> session. Report only work you can point to evidence for; if something is not
> yet verified, say so. If tests fail, say so with the output; if a step was
> skipped, say that.

## Memory and state

Where lessons persist, the prompt gets shorter over time. A markdown file is
enough: one lesson per file, a one-line summary at the top, why it mattered,
updated rather than duplicated, deleted when wrong.

Memory substitutes for prompt length. A lesson learned once and written down
beats a rule pre-emptively written into every prompt.

## Tools instead of instructions

Repeatedly, the right answer to a prompting problem is not prompt text:

| Problem | Weak: prompt text | Strong: a tool |
|---|---|---|
| No visibility mid-run | "narrate what you're doing" | a send-to-user tool rendered verbatim |
| Reasoning visibility | "explain your thinking" (a refusal risk) | structured thinking output |
| Verification | "double-check your work" | a test command, a validator, a fresh-context verifier |
| Fine visual detail | "look carefully at the image" | a crop or zoom tool |
| Long-run state | "remember that…" | a state file, git, a structured task list |

Two notes when recommending a tool: defining it is not enough — without an
eliciting instruction the model may rarely call it; and a tool recommendation
belongs in the off-prompt levers section of the report, because the requester
has to build it.
