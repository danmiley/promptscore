# Creative Latitude

Open this when the task's value is **range** rather than compliance: design,
architecture options, naming, writing, anything where the best answer is one
nobody specified.

The governing fact: **every specification is also a ceiling.** The model treats
the described solution space as the actual solution space. A prompt can be
perfectly clear, perfectly followed, and still produce mediocre work because it
described only the obvious region.

## The convergence problem

Left unsteered, models drift toward on-distribution output — the median
solution, the expected structure, the font everyone uses. This is not a
knowledge limit; it is a default. Naming it in the prompt measurably shifts it.

Effective anti-convergence language does three things: names the failure,
names *specific* attractors to avoid, and issues explicit permission to depart.
Generic encouragement ("be creative") does none of them and changes nothing.

## Raise the ceiling, not just the floor

Most prompts specify a minimum and get one. Add a maximum-facing clause:

- "Go beyond the obvious solution. If a better but less conventional approach
  exists, take it and say why."
- "The requirements below are a floor, not a ceiling."
- "Include as many relevant capabilities as the context justifies; go past the
  basics."

Nothing about *how*; everything about *how far*.

## Give it the hard version

Under-scoping is the most common way teams undersell a frontier model. If a
task sits at the top of the difficulty range, hand it over whole and let the
model scope it, rather than pre-chopping it into pieces sized for a weaker
model. Chopping destroys the context that makes the model good at the whole.

## Open the option space before narrowing it

A model told "implement X using Y" implements X using Y. One clause restores the
range without losing control:

> Before you start: if there is a materially better approach than the one I
> described, say so in two sentences and take it. If the framing of the problem
> is wrong, say that instead.

This is not "ask me clarifying questions", which produces ceremony. It is
standing permission to override the *method* while the *outcome* stays binding.

## Label constraints by hardness

Models cannot distinguish a genuine constraint from an offhand default, so they
treat everything as hard. Two lines of labelling buy more range than a paragraph
of encouragement, and they are mechanical to generate:

| Marker | Meaning |
|---|---|
| **Hard constraint** | Violating this makes the work useless. Never trade it away. |
| **Default** | Do this unless you find something better; tell me if you deviate. |
| **Guess** | I was speculating. Verify or discard freely. |

When uplifting, hardness labelling is usually an *addition*, and it is often the
single change that most increases range — because it lets the subtractive pass
be braver everywhere else.

## Do not anchor with your own draft

Showing your attempt, outline, or sample output before the model has formed its
own converts "solve this" into "improve this." When you need both, sequence
them: independent approach first, your version second, then a merge.

Same mechanism as removing steering examples, at the level of the whole task.

## Separate divergent from convergent

Models do both well but will not switch modes unbidden. Say which you want:

- Divergent: "Give me three genuinely different architectures, including one you
  think I'll dislike."
- Convergent: "Pick the best architecture and build it."

A prompt that quietly wants both gets a hedged average — balanced options, no
verdict, every alternative given equal weight. If you see that in the baseline's
output, the missing instruction is which mode you are in.

## The tension to hold

Latitude and reliability pull against each other. The resolution is consistent:
**strict about outcomes and boundaries, loose about method.** Where a single
clause tries to be both, split it into two.
