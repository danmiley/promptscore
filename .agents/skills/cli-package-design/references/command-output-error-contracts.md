# Command, Output, and Error Contracts

These are the machine contracts — defined here language-neutrally. Text output may improve over time; the structures below need a compatibility policy and contract tests. The **Rust implementation** of these contracts (clap command model, crate wiring, `--json` plumbing, cargo-based contract-test gates) is owned by `rust-cli-app`; this reference is the design rationale it realizes. The exit-code taxonomy below is the family's canonical one (`assets/templates/exit-code-map-v1.csv`).

## Command Taxonomy

Prefer a resource/action hierarchy when the product manages objects:

```text
tool <resource> list
tool <resource> get <id>
tool <resource> create
tool <resource> update <id>
tool <resource> delete <id>
```

Use direct verbs for operations that are not resource management: `tool run`, `tool doctor`, `tool completion`, `tool version`, `tool api`. Do not force every concept into CRUD for symmetry.

`doctor`, `check`, `inspect`, and other diagnostic commands are read-only contracts unless their help explicitly says otherwise. A preflight that wants to verify an output directory must not create that directory as a side effect; check the nearest existing parent directory, report what would be created by a real run, and reserve mutation for an explicit setup or run command.

### Global flags

Keep a small, orthogonal set that means the same thing everywhere:

```text
--output text|json|jsonl
--fields <comma-separated paths>
--no-input
--yes
--dry-run
--color auto|always|never
--pager auto|always|never
--quiet
--verbose
--timeout <duration>
--profile <name>
--config <path>
```

Only expose a global flag that every command can honor truthfully. A global `--dry-run` that silently does nothing on half the mutating commands is worse than command-local support plus a clear capability manifest.

## Output Envelope

Keep JSON on stdout as the primary interface. Use a small envelope for bounded results so agents parse one shape repeatedly and humans can pipe to `jq`:

```json
{
  "schema_version": 1,
  "data": {},
  "warnings": [],
  "page": { "next_cursor": null }
}
```

A leaner `{ "ok": true, "data": {}, "meta": {} }` envelope is also workable; pick one shape and hold it. Either way: command-specific detail grows inside `data`, execution context lives under `meta`/`page`, and `schema_version` travels in the payload.

Use **JSON Lines** for potentially long-running or streaming operations. Each event needs a stable discriminator (e.g. `reason`), a sequence number or timestamp where ordering matters, and a terminal event.

Rules that hold across every command:

- stderr is the only place for progress, traces, and human diagnostics — never mix them into stdout;
- file-writing commands still emit structured stdout describing what they wrote;
- request-trace features (`--explain`, `--verbose`) must never contaminate stdout;
- secrets never appear in echoes, debug output, JSON, crash reports, or example shell history.

## Errors and Exit Classes

In machine mode, an expected application failure emits a **structured error object** and a nonzero exit status. Pick once whether the error object goes to stdout (as a result envelope) or stderr (as a separate JSON stream), document it, and contract-test it. A pragmatic choice: result/error envelopes on stdout in machine mode, diagnostics on stderr.

Define a small exit taxonomy, not one code per internal error:

| Code | Class |
|---:|---|
| 0 | success |
| 2 | invocation or validation error |
| 3 | authentication or authorization |
| 4 | requested object not found |
| 5 | conflict or failed precondition |
| 6 | remote/transient failure |
| 7 | partial success |
| 8 | operation still pending |
| 130 | interrupted by user |

Exact numbers matter less than stability, documentation, and tests. Include a **stable symbolic error code** such as `auth.expired_token` in structured errors so agents do not infer meaning from prose. See `assets/templates/exit-code-map-v1.csv`.

## Machine-Readable Capability Manifest

Expose `tool help --output json` (or equivalent). It lets an agent discover capabilities without scraping help text. It should describe the command tree, each command's flags with types/defaults/conflicts, supported output formats, side-effect classification (read-only vs mutating vs destructive), and the schema identifiers a command emits. Validate it against `assets/templates/command-manifest.schema.json` and diff it in CI so it cannot drift from the real command model.

## Field Selection

`--fields <paths>` (or `--json <fields>` à la `gh`) lets callers select parts of the JSON. Decide in v1 whether it is needed or whether full JSON is small enough initially — adding it later is additive and safe.

## What to Contract-Test

Execute the real binary and assert: exit codes per class; stdout is valid JSON in machine mode; stderr carries diagnostics/explain output with no stdout contamination; `data.*` paths stay stable; mocked 401/404/409/500 responses map to the expected exit classes; text mode vs JSON mode; diagnostic commands leave the filesystem unchanged; the capability manifest matches the command tree.
