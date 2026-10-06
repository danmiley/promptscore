# Off-Prompt Levers

The prompt is one lever among several. A rewrite that only edits text hits a
ceiling fast, and some of the most common complaints about a prompt are actually
complaints about a setting.

**No frozen per-model values in this file.** Level names, defaults, caps, and
limits change between model releases; a table written today is wrong within
weeks and would be wrong *authoritatively*, inside a canonical reference. What
follows is the set of lever **classes**, what each controls, and where to read
its current value. Read the value from the requester, the host's own
configuration or documentation, or a live check — never from memory.

These go in the report's off-prompt section as recommendations. The requester
sets them; this skill does not.

## Reasoning depth

**Controls:** how much the model deliberates before and between actions, and
therefore latency and cost more than output length.

**Where it lives:** an effort or thinking-level parameter on the request, or the
host's equivalent setting. Current frontier models generally think adaptively —
depth responds to both the parameter and the query's difficulty — and manual
token budgets for thinking have been retired on recent models.

**When it is the real fix:** the prompt says "think carefully" or "be thorough"
(raise the setting and delete the sentence); the model over-explores routine
work (lower it); a chain-of-thought scaffold is being used to manufacture
reasoning that is now native (delete the scaffold, set the parameter).

**Worth telling the requester:** lower settings on a current frontier model
often outperform the highest settings on the previous generation, so effort
defaults inherited from an older model are usually too high. Re-sweep rather
than assume.

## Verbosity, separately from depth

**Controls:** how much the model *says*, which is not the same lever as how much
it *thinks*. On several current models, lowering reasoning depth does not
reliably shorten the visible response.

**Where it lives:** the prompt, unavoidably. This is the one case where prose is
the correct instrument — but say it once, in one place.

## Delegation and concurrency

**Controls:** whether and how widely the model spawns subagents.

**Where it lives:** harness settings — spawn depth, concurrent-agent caps, spend
budgets — plus tool availability.

**When it is the real fix:** cost blowups from parallel subagents on small
tasks. A deterministic cap is a control; a sentence asking for restraint is a
preference. Recommend both, and say which is which.

## Timeouts, streaming, and asynchrony

**Controls:** whether a long run survives at all.

**Where it lives:** client configuration and harness architecture.

**When it is the real fix:** single requests on hard tasks can occupy many
minutes, and autonomous runs hours. A prompt written against a synchronous
request-response assumption is a latent failure, not a prompting problem.
Recommend checking client timeouts and considering an asynchronous check-in
pattern before blaming the prompt.

## Tool provisioning

**Controls:** what the model can actually do, and it frequently substitutes for
prompt text (see `load-bearing-content.md`).

**Where it lives:** the tool definitions the harness exposes.

**Recurring recommendations:** a verbatim send-to-user channel for long
unattended runs; a real verification command instead of a self-check
instruction; a crop or zoom tool for fine visual work; a state file or task list
for multi-window runs.

**Warn the requester:** defining a tool is often not enough. Without an
eliciting instruction in the prompt, some tools are rarely called.

## Memory and state surface

**Controls:** whether lessons persist across runs, and therefore whether the
prompt has to keep growing.

**Where it lives:** a notes file, a repo memory lane, a structured state file,
git history.

**When it is the real fix:** the prompt is accumulating one-off corrections.
Each is a lesson that belongs in memory, not a rule that belongs in every
future prompt.

## Context handling

**Controls:** what survives a long session.

**Where it lives:** compaction behaviour, context-window size, and whether the
harness surfaces a remaining-token countdown to the model.

**When it is the real fix:** the model wraps up early or offers to hand off. The
countdown is usually the trigger; stop showing it before adding reassurance text.

## Refusal and fallback surface

**Controls:** whether requests silently degrade to a weaker model.

**Where it lives:** the platform's safety classifiers and the fallback the
application configures.

**Why a prompting concern:** some frontier models classify certain *prompt
phrasings* — notably instructions to reproduce internal reasoning — and can
return a refusal that falls back to a lesser model. The capability loss is
invisible unless someone is watching fallback rates. Flag both the phrasing (see
`subtractive-pass.md`) and the recommendation to monitor fallbacks.

## Model choice itself

Sometimes the honest finding is that the prompt is fine and the model is wrong
for the task — too small for the horizon, or too large for a mechanical loop
that runs thousands of times. Say so. It is a legitimate outcome of a diagnosis
and it belongs in the report rather than being worked around in text.
