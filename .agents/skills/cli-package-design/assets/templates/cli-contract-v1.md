# CLI Contract — <tool-name> v1

Design-stage worksheet. Fill this in *before* implementing many commands; it is the source of the decisions that contract tests then enforce. Language-neutral.

## 1. Audience and positioning
- Primary audiences (humans / agents / CI): 
- What ceremony does this CLI remove over calling the REST API directly?
- Backend REST API and its durable resource nouns:

## 2. Command taxonomy
- Shape: resource/action | verb-led | mixed
- Resources (mirror the API graph): 
- Non-CRUD verbs (`run`, `doctor`, `completion`, `version`, `api`, ...):
- Raw API escape hatch command:

## 3. Global flags (only those every command can honor truthfully)
- [ ] `--output text|json|jsonl`
- [ ] `--fields <paths>` (needed in v1? yes/no)
- [ ] `--no-input`
- [ ] `--yes`
- [ ] `--dry-run`
- [ ] `--color auto|always|never`
- [ ] `--pager auto|always|never`
- [ ] `--quiet` / `--verbose`
- [ ] `--timeout <duration>`
- [ ] `--profile <name>` / `--config <path>`

## 4. Output contract
- Default output mode: 
- Envelope shape (e.g. `{schema_version, data, warnings, page}` or `{ok, data, meta}`):
- Streaming/long-running ops use JSON Lines? Discriminator field:
- stdout = ____ ; stderr = ____ (diagnostics, progress, traces)

## 5. Error and exit contract
- Machine error object goes to: stdout envelope | stderr JSON stream  (decide once)
- Exit-code map (see exit-code-map-v1.csv):
- Symbolic error codes (e.g. `auth.expired_token`):

## 6. Interaction and mutation policy
- Interactive commands (named/flagged) and their non-interactive equivalents:
- `--no-input` failure behavior:
- Which mutations are truly dry-run vs validate-only:
- Retry/timeout/cancellation policy:
- Secret redaction rule:

## 7. Config and auth
- Precedence: flags > env > profile/config file > defaults
- Config file location/format; token file; env var(s):
- `config paths` / `config show --origins` provided? 
- Auth: interactive login command + automation token path:

## 8. Capability manifest
- `tool help --output json` exposes: command tree / flags+types+defaults / output formats / side-effect class / schema ids
- Validated against command-manifest.schema.json in CI?

## 9. Packaging, docs, versioning (summaries; route to siblings)
- Target matrix:
- Distribution lanes (primary + always-publish fallback):
- Docs IA + generate-from-command-model toolchain:
- Versioning: package SemVer / output `schema_version` / config format version / deprecation window:
