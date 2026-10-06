# What makes a prompt score well

This page is the intent. `rubric.toml` is what the grader actually counts.
If a score and this page disagree, change the one that is wrong and say so
in `docs/ENGINEERING_LOG.md`. The script follows `rubric.toml`.

The characteristics come from the superprompt workflow: name the outcome,
make success observable, keep the work inside a boundary, and put effort on
the part that is hard to undo. They are properties of the prompt the human
writes, not a script the model must recite back.

## The characteristics

1. **Named outcome.** The first screen of the prompt says what will exist
   when the work is finished: a fix, a file, a decision, a draft. A verb
   plus a real object (a path, a screen, a quoted name) is stronger than a
   verb alone.
2. **Observable finish line.** "Done when" names a check a person can
   settle: a command and its exit, a test, an inspection. "Make it good",
   "professional", and "robust" are not finish lines. A label with no check
   is only partial credit. Pasting the task sentence under "Done when"
   does not create a check.
3. **Boundaries.** What must stay untouched, what is out of scope, and what
   the model must not invent. One prohibition that names an object is
   enough to start; a heading plus a prohibition is full credit.
4. **Output shape.** What the answer should contain, in reading order.
   "Return a short explanation of the cause" is a shape. "Be concise" is not.
5. **Named inputs.** Files, samples, or facts the work may rely on. Invented
   paths do not belong in a rewrite of someone else's prompt.
6. **Reported check.** Ask the answer to say what was actually run, and to
   say so in the first sentence when it was not run. This is separate from
   the finish line. The finish line defines success. The reported check
   demands evidence.
7. **Stop conditions.** Scored only when the request can delete, deploy,
   migrate, or touch secrets. Ordinary edits leave this row out of the
   average, and the rewriter does not add a stop paragraph to chase points.
8. **Step checks.** Required only when the prompt numbers two or more
   deliverables. A single outcome does not need a plan. Numbered requests
   without a pass/fail line on each item are the gap, not the absence of a
   plan on a one-line task.

## What a high score is for

The number runs from 300 to 850. The width matches a consumer credit score
so a jump is easy to feel. The floor is 300 even for an empty file. Full
marks need every applicable row, including a concrete check.

A rewrite should aim at a prompt the author can execute, usually somewhere
in the 600s or 700s if the source was vague. The improved file keeps the
author's words and adds at most four missing sections. Two cases may add
one more section: a numbered list with no per-step checks, and a destructive
verb with no stop line. A prompt that already clears the rewrite threshold
on every row is copied through unchanged.

## What this grade ignores

- Persona, roleplay, and "you are an expert" openers.
- Claim-label ceremony, self-attack scripts, and final-gate checklists
  copied into prompts that do not need them.
- Politeness, length, and repeated keywords. Saying "done when" five times
  counts once.
- Whether any model will produce a good answer. This is a structural grade.

## How to read a report

`score.md` is the number, the band, the row table, why the weak rows are
weak, and three tips. `markup.md` walks the prompt by paragraph.
`ideal.md` is the revised prompt inside a fence. Edit any finish line you
cannot actually run. A generic finish line is a draft, not a fact the
grader discovered about your repo.
