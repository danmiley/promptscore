# CLI Architecture

## Purpose
Keep the entry point thin, commands testable in-process, and the domain
importable by other programs (including a future port to another language)
without the CLI.

## Recommended Package Shape
```text
src/<pkg>/
  cli.py            build_parser(), main(argv) -> int, exception → exit map
  commands/
    __init__.py
    <verb>.py       def run(<typed args>) -> <typed result>
  <domain>/         pure functions and dataclasses; no argparse, no sys.exit
  io/ or acquire/   filesystem, network, subprocess, caches (the only I/O)
  output.py         text and JSON renderers for result types
  config.py         load(): flags + env + file → one frozen Settings
```

## Boundary Rules
- `cli.py` owns argument parsing, dispatch, the exception-to-exit-code map,
  and nothing else. It is under 150 lines for most tools.
- `commands/<verb>.py` takes typed arguments (not the `Namespace`), calls the
  domain, returns a typed result. It never prints; it returns.
- The domain never imports `argparse`, `sys`, or `output`; it raises typed
  exceptions and returns dataclasses.
- `output.py` is the only module that formats for humans or machines. Text
  and JSON renderers take the same result type.
- I/O lives in modules whose names say so; a function that fetches, reads,
  or spawns is not next to one that transforms.
- `config.py` resolves once, returns a frozen `Settings`, and records where
  each value came from (flag, env, file, default) for `doctor`.

## Design Priorities
- Minimize logic in `main`: parse, call, render, map.
- Every command runs in-process in tests (`main([...])` with `capsys`) and
  as a subprocess in contract tests.
- Deterministic output: sorted keys in JSON, stable ordering in text, no
  timestamps in data unless the data is a timestamp.
- The CLI is the first client of a library, not the library. When a second
  client appears (a service, a notebook, a Rust port reading the same
  JSON), the domain package moves unchanged.

## Framework choice
`argparse` by default: no dependency, typed enough with a thin wrapper,
`--help` for free. `click` or `typer` only when the command tree is large
enough that argparse's subparser boilerplate dominates `cli.py`, and then the
decision is recorded in the contract. Never both.
