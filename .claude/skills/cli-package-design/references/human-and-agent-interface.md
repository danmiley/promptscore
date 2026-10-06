# Human and Agent Interface

The CLI serves more than one audience from one semantic interface. Humans deciding whether to install it, humans learning the command model, agents needing a concise "how to use this safely" surface, and reviewers wanting release context all touch the same tool. Design for all of them on purpose rather than treating one as an afterthought.

## Complementary vs Divergent Requirements

Humans and agents both benefit from: consistent command naming, predictable config precedence, normalized errors, stable resource identifiers, explicit file-output paths, good help text, and one shared auth/client layer. Get these right once and both audiences win.

Where they diverge:

| Humans often want | Agents usually want |
|---|---|
| guided setup | non-interactive defaults |
| readable text mode | deterministic JSON |
| selective interactivity | no hidden prompts |
| examples and narrative docs | stable top-level keys |
| color, progress, paging | explicit exit codes; strict stderr/stdout split |
| | compact commands that reduce prompt overhead |

## The Practical Rule

Make the default command path **agent-safe**, then layer human affordances on top:

- default to machine-readable JSON on stdout;
- keep diagnostics, progress, and traces on stderr;
- require explicit opt-in for prompts (`--no-input` must turn every possible prompt into a deterministic failure);
- provide a text presentation mode for humans (`--output text`);
- keep interactive commands clearly scoped and named (e.g. an interactive `auth login` is fine, but `auth token set` / an env var must exist for automation).

Terminal detection picks **presentation defaults only**. It must never change which resource is addressed, what an operation does, or whether a destructive action is confirmed. Every TTY-driven default needs an explicit override flag so a script can pin behavior regardless of where it runs.

## Discoverability Is Part of Correctness

Every command and flag needs a short description, a useful metavariable, and at least one realistic example where the syntax is not obvious. Help should answer:

1. What will this do?
2. What does it read and change?
3. What output can I request?
4. Can it prompt, page, retry, or wait?
5. How do I preview or undo it?
6. What are the important exit statuses?

The high-value agent feature is a **machine-readable command manifest** (`tool help --output json`): the command tree, flags, types, defaults, conflicts, output formats, side-effect classification, and schema identifiers. It lets an agent inspect capabilities without scraping prose. See `command-output-error-contracts.md` for its shape.

## Anti-Patterns

- An `agent` subcommand or undocumented alternate API that drifts from normal behavior.
- Hidden interactivity that blocks an unattended shell.
- Mixing narration, progress, or ANSI escapes into stdout.
- Inheriting account/project/profile/output-mode invisibly with no way to name them explicitly.
- Documenting a nicer product than the actual shipped command surface.
