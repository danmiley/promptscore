# Command and Output Contracts

## Command Surface Conventions
- Verb or noun-verb subcommands: `<tool> generate`, `<tool> probe budget`.
  Keep global flags (`--json`, `--config`, `-v`, `--no-color`) consistent
  across subcommands and declared once on the top-level parser.
- Every data-returning command supports `--json`. Every command supports
  `--help` with one-line descriptions that match the manual.
- Boolean and optional parameters are keyword flags, never positional.
- Commands that write files take `--output <path>` and refuse to overwrite
  without `--force`; commands that only read say so in their help text.

## Stdout/Stderr Discipline
- Stdout: data only. In text mode, the rendered result; in `--json` mode,
  exactly one JSON document.
- Stderr: diagnostics, warnings, progress bars, log lines, human narration.
  `logging` is configured to stderr; `print` is not used in library code
  (ruff `T20`).
- Never mix progress output into the JSON payload; progress goes to stderr
  or is suppressed under `--json`.
- Encoding is UTF-8 on both streams; set `PYTHONIOENCODING` in the contract
  tests so a locale mismatch is caught.

## JSON Envelope Baseline
```json
{"schema": "<tool>-cli-v1", "ok": true, "data": {...}}
{"schema": "<tool>-cli-v1", "ok": false, "error": {"code": "not_found", "message": "..."}}
```
- `schema` is a stable string with a version suffix; bump it only for an
  incompatible shape change.
- Keys are `snake_case`, sorted (`sort_keys=True`), and documented in the
  contract record.
- Numbers are numbers, not strings; paths are absolute or documented as
  relative to a named root; timestamps are ISO 8601 UTC.
- An error under `--json` is still on stdout, in the envelope, with the exit
  code from the map; stderr may carry the human sentence too.

## Exit-Code Baseline
The map is `assets/templates/exit-code-map-v1.csv`, single-sourced from
`cli-package-design`. In code it is an `IntEnum` (see `cli_skeleton.py`) and
every exception class that can leave `main` carries its exit class. Reserve
`0` for success, `2` for invocation and validation, `130` for interrupt.
Never `sys.exit` outside `cli.py`; never a bare integer.

## Contract Record
Fill `assets/templates/cli-contract-v1.md` before the second command lands.
Any change to the envelope, the exit map, or a command's arguments updates
the record and its regression test in the same diff.
