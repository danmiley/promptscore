# Project Bootstrap: From Empty Directory to First Green Run

For a repo with no `pyproject.toml`. Every step has a command and an
observable result; run them, do not describe them.

## 1. Interpreter and tool preflight
```bash
uv --version            # 0.11+ expected
uv python list --only-installed
ruff --version          # or rely on `uv run ruff` after step 3
pyright --version       # or `uv run pyright` after step 3
```
If `uv` is missing, route to `agent-cli-tools` (`cli-audit.sh --lang python`)
and stop; do not fall back to `pip` or `venv` by hand.

## 2. Pin the interpreter
Pick one minor version and write it down twice:
```bash
uv python pin 3.12      # writes .python-version
```
and `requires-python = ">=3.12"` in `pyproject.toml`. The two must agree.
Choose the minor that the team's existing environments already run (measure:
`uv python list --only-installed`, existing `.venv/bin/python --version`), not
the newest available. Upgrading the pin is its own change with its own test
run.

## 3. Write `pyproject.toml`
Copy `assets/templates/pyproject-baseline.toml`, replace `<pkg>` and
`<tool>`, delete the dev-group entries you will not use yet. The template
carries the `python-style-guide` lint set and the `python-test-harness`
pytest posture so all three skills configure one file.

Then:
```bash
mkdir -p src/<pkg> tests
printf '"""<pkg>: <one line>."""\n' > src/<pkg>/__init__.py
cp <skill>/assets/templates/cli_skeleton.py src/<pkg>/cli.py   # edit <tool>
cp <skill>/assets/templates/test_cli_contract.py tests/          # edit <pkg>, <tool>
uv sync                  # creates .venv, resolves, writes uv.lock
```
`<skill>` is `scripts/polymath/python-cli-app/../..`-relative in an installed
target: the assets live under `.agents/skills/python-cli-app/assets/` or
`.claude/skills/python-cli-app/assets/`.

## 4. Layout
```text
pyproject.toml
uv.lock                  committed
.python-version          committed
README.md
src/<pkg>/
  __init__.py            re-exports only
  cli.py                 thin entry point (see cli-architecture.md)
  commands/              one module per subcommand, typed functions
  <domain>/              importable without the CLI
tests/
  conftest.py            hermetic fixtures (python-test-harness)
  test_cli_contract.py
  <domain>/test_*.py     mirrors src layout
fixtures/                recorded inputs and goldens (python-test-harness)
scripts/                 repo-owned helpers; scripts/polymath/ is installer-owned
dist/                    gitignored; reports and build output
```
`.gitignore` gets `.venv/`, `dist/`, `__pycache__/`, `.pytest_cache/`,
`.ruff_cache/`, `*.egg-info/`, `.coverage`, `coverage.json`.

## 5. First green run (the "infra works" proof)
```bash
uv run ruff check
uv run ruff format --check
uv run pyright
uv run pytest
uv run <tool> --json doctor
```
All five succeed on the skeleton alone. Record the five commands and their
output in the engineering log as the baseline; a later failure is then
attributable to a change, not to setup. Measured 2026-09-20 on the template:
`All checks passed!`, `3 files already formatted`, `0 errors, 0 warnings`,
`2 passed`, and a JSON envelope on stdout.

## 6. Dependencies
- `uv add <name>` for runtime, `uv add --group dev <name>` for tooling. Lower
  bound only in `pyproject.toml`; `uv.lock` pins.
- Geospatial and numeric stacks (`numpy`, `shapely`, `pyproj`, `geopandas`,
  `osmnx`) ship wheels for macOS arm64 on 3.12; if `uv sync` starts building
  from source, stop and check the version pair before waiting on a compiler.
- A dependency that is only used by a script or a notebook goes in an
  optional group, not the runtime list.
- Re-run the five gates after every `uv add`; a dependency without type
  stubs shows up in `pyright` at its import and is labelled there
  (`python-style-guide` TYPE-6), not silenced globally.

## 7. What not to do
- No `setup.py`, `setup.cfg`, `requirements*.txt`, `Pipfile`, `poetry.lock`
  alongside `pyproject.toml`; one manifest, one lockfile.
- No `sys.path.insert` in tests or scripts; `uv run` puts the package on the
  path.
- No global tool installs for gates; `uv run ruff` and `uv run pyright`
  resolve from the lockfile so every checkout agrees.
- No CI workflow yet unless the project asked for it; the local gate list is
  the contract CI will later mirror.
