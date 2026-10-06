# Interaction, Mutation, Config, and Auth

## Configuration Precedence

Use one precedence order everywhere, resolved **once, centrally** — never let each command rebuild it:

1. CLI arguments
2. Environment variables
3. selected profile / config file
4. built-in defaults

A useful split for a CLI over REST:

- a **config file** for durable profile data (base URL, default project/profile, output preferences);
- a **token file** for local secret storage;
- **environment-variable overrides** for CI and agents, including an explicit config-file path override such as `TOOL_CONFIG`.

This keeps local human workflows ergonomic while giving automation a clean injection path. Validate configs eagerly and version their schema (integer format version with a migration/diagnostic path). Unknown keys should normally **warn** before becoming errors in a future major release.

Provide explainability: `tool config paths` and `tool config show --origins` so humans and agents can see the effective value and where it came from without guessing.

Hermetic tests should be able to point every config and token lookup at a temp directory through flags or environment variables. Do not let black-box tests depend on `./tool.toml`, `config/tool.toml`, `$HOME`, or the developer's real profile.

## Authentication

- Support **token credentials** for automation and an explicit **interactive login** for humans.
- Do not initiate a browser or device flow during an unrelated command.
- Credential sources, host/account selection, and redaction rules need one shared implementation.
- Example split: `auth login` (interactive, human) vs `auth token set` / `auth token status` / `TOOL_ACCESS_TOKEN` (automation).

## Interaction Policy

- Never prompt when stdin or stdout is not a TTY unless an explicit interactive mode was requested.
- `--no-input` must turn **every** possible prompt into a deterministic, actionable failure.
- `--yes` answers confirmations only; it must not invent missing semantic inputs.
- Prompts and progress belong on stderr; failure stays parseable even when an interactive path exists.

## Mutation Safety

- Destructive operations should accept immutable identifiers where possible and report the **exact target** in dry-run output.
- `--dry-run` must plan the *same* operation it would commit — contract-test dry-run equivalence. Decide which mutations can be truly dry-run vs which can only validate locally, and reflect that honestly in the capability manifest.
- Diagnostic commands (`doctor`, `check`, `inspect`) should remain non-mutating: do not create output folders, caches, or config skeletons while checking readiness. Report missing setup and, when helpful, provide the explicit setup command.
- Retries require bounded attempts, backoff, idempotency awareness, and a way to disable them.
- Long operations need a timeout, defined cancellation behavior, and resumability or a returned operation ID where practical.

## Secrets

Secrets must never appear in command echoes, debug output, JSON, crash reports, or shell-history examples. Redaction is part of the shared output/error layer, not a per-command afterthought.

## Environment Variables vs Flags

Mirror operational flags with environment variables for CI and managed environments — but do **not** create an env-var twin for every one-off command flag. Environment variables represent process-wide policy, credentials, or execution context; command arguments represent the request.
