# Designing a CLI Over an Existing REST API

A CLI that fronts an existing REST API should **not invent a second platform**. Its job is to remove repeated ceremony around a backend that already exists. This reference captures the distinctive design lessons for that class of tool; the generic command/output/exit contracts live in `command-output-error-contracts.md`, and language-specific implementation lives in `rust-cli-app`.

## Where the CLI Adds Value Over Raw REST

If the backend already exists, the value is not "we can call HTTP." The value is that repeated API semantics become one reusable command surface with one shared contract. Centralize, early:

- auth header setup and token sourcing;
- base URL and environment selection;
- default profile and context resolution;
- polling and retry patterns;
- download and upload mechanics;
- error normalization;
- stable result formatting.

## Canonical Design Shape

The most durable shape separates concerns so the reusable core lives **below** formatting and dispatch:

```text
CLI parser
  -> effective config resolution   (flags > env > file > defaults, resolved once)
  -> auth/token resolution         (one shared precedence, never per-command)
  -> shared HTTP client            (one configured client: headers, timeouts, uploads, downloads, polling)
  -> typed command handler         (thin wrapper over shared logic)
  -> stable output envelope        (owns the stdout contract)
```

Keep these concerns separate regardless of language or filenames:

- **commands** own CLI nouns, flags, and dispatch;
- **config** computes one effective runtime configuration;
- **auth** resolves secrets and token sources consistently;
- **client** owns request construction, headers, timeouts, uploads, downloads, polling;
- **models** give typed shape to common API records, shared across commands;
- **output** owns the stdout contract;
- **errors** own normalized failures and exit-code policy.

This separation matters even more if the future includes an MCP server or another agent surface: the reusable core should be callable without scraping CLI output. Design the future MCP layer **through** the shared core, never by bypassing it.

## Follow the API's Real Resource Graph

Mirror the server's durable nouns and stable identifiers rather than flattening them into vague workflow verbs (`process`, `job`, `media`). When the API exposes resources like `catalog`, `asset`, `revision`, `master`, `rendition`, `export`, the CLI taxonomy should preserve them. This helps because:

- humans can learn the CLI from the API model;
- agents can infer likely next commands;
- docs stay close to backend reality;
- an escape hatch like `tool api <path>` feels additive rather than contradictory.

Resolve recurring semantics once — concepts like `self`, `latest`, or a default catalog — instead of re-deriving them per command.

## Provide One Raw API Escape Hatch

A low-level `tool api <method> <path>` command covers endpoints not yet modeled at the high level. It is a meaningful differentiator: the CLI stays useful the moment a new endpoint ships, without waiting for a first-class command. Keep it explicit and additive — it should reuse the same auth, base URL, and output envelope as modeled commands.

## Interactive Commands Need Their Own Policy

Interactive behavior is where human and agent needs most often conflict. Policy:

- no hidden interactivity by default;
- interactive flows must be explicitly named or flagged;
- a non-interactive alternative must exist for every interactive path (e.g. `auth login` interactive; `auth token set` + `TOOL_ACCESS_TOKEN` for automation);
- prompts and progress belong on stderr;
- command failure stays parseable even when an interactive path exists;
- if a command cannot be safely automated, it advertises that clearly.

This matters most for authentication, overwrite confirmations, destructive operations, and long-running polling.

## Recommended Default Pattern for a New Project in This Category

1. Define the API-aligned command nouns first.
2. Lock stdout/stderr and exit-code policy early.
3. Build shared config, auth, client, output, and error layers before expanding command count.
4. Keep JSON canonical; add text mode as a second view.
5. Provide one raw API escape hatch.
6. Add contract tests that execute the real binary.
7. Treat product/manual content as part of the shipped surface.
8. Keep the core reusable so an MCP wrapper can come later without scraping output.

## Anti-Patterns

- Flattening the API into vague verbs that hide durable resource concepts.
- Letting every command invent its own config or auth resolution.
- Making interactive behavior appear implicitly.
- Testing only internals and not the binary contract.
- Designing a future MCP layer by bypassing the shared CLI core.
