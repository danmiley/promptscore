# CLI Contract v1

## Command Surface
- Tool name and `[project.scripts]` entry:
- Global flags (`--json`, `--config`, `-v`, ...):
- Subcommands (one line each, with read-only / writes-files marked):
- Machine mode flags:

## Stdout/Stderr Rules
- Stdout data-only policy:
- Stderr diagnostic policy (logging config):
- Progress output policy under `--json`:

## Exit-Code Taxonomy
- `0` success
- nonzero classes used (from `exit-code-map-v1.csv`) and the exception
  class that maps to each:

## JSON Stability
- `schema` string:
- Key naming and ordering:
- Backward-compatibility policy:
- Breaking-change trigger rules:

## Config and Environment
- Precedence order:
- Config path override (flag and variable):
- Environment variables read:
- Secrets: where they come from, where they never appear:
- Offline behaviour:

## Contract Tests
- In-process tests present:
- Subprocess / entry-point tests present:
- Exit-code regression tests present:
- Config precedence tests present:
- `doctor` read-only test present:
