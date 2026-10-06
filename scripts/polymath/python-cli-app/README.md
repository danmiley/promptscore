# Script Pack

`check_cli_contract.sh` is a fast, dependency-free signal check for a
uv-managed Python CLI repo. It does not run the gates (that is
`python-test-harness`); it confirms the contract surfaces exist.

## Install

The polymath installer materializes this pack at
`scripts/polymath/python-cli-app/` in the target repo.

## Usage

```bash
./scripts/polymath/python-cli-app/check_cli_contract.sh            # root auto-detected
./scripts/polymath/python-cli-app/check_cli_contract.sh /path/to/repo
PY_PROJECT_ROOT=/path/to/repo ./scripts/polymath/python-cli-app/check_cli_contract.sh
```

Root detection order: explicit argument, `PY_PROJECT_ROOT`, the containing
Git worktree, the installed `scripts/polymath/` or agent-skill lane path,
then the current directory.

## Signals

pyproject present; `uv.lock` present; `requires-python` pinned;
`[project.scripts]` entry; `src/` layout; JSON mode; stderr/logging channel;
exit-code taxonomy; contract tests under `tests/`; ruff + pyright/mypy
configured. First-party `src/` only: `.venv`, installed skill lanes, and
`scripts/polymath` are excluded from scans.

## Output

- `dist/reports/cli-contract/check_cli_contract_report.txt`
- exit `0` all pass, `2` any fail.
