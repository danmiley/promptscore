# Testing and Gate Baseline

## Mandatory Baseline Gates
```bash
uv run ruff check
uv run ruff format --check
uv run pyright
uv run pytest
```
Green on a fresh checkout before the first feature. `python-test-harness`
wraps these in lane scripts with machine-readable results; this file is the
contract those scripts run.

## Contract-Test Baseline
`tests/test_cli_contract.py` (template in `assets/templates/`) verifies:
- in-process: `main([...])` returns the mapped exit code; `capsys.readouterr()`
  shows data on stdout and nothing on stderr for a clean `--json` run;
- subprocess: `python -m <pkg>.cli ...` and, once installed, the
  `[project.scripts]` entry point run and exit `0`;
- the JSON envelope parses, carries `schema`, and has sorted keys;
- exit-code mapping for one representative failure per class in the map;
- config precedence: flag beats env beats file beats default, using a temp
  config file and `monkeypatch.setenv`;
- `doctor` creates no files (snapshot `tmp_path` before and after);
- `--offline` fails fast with the `remote` class and no network call
  (a `conftest` fixture that fails any socket connect; see
  `python-test-harness`).

## Typing the tests
pyright strict applies to `tests/`. Fixture parameters are annotated
(`capsys: pytest.CaptureFixture[str]`, `tmp_path: Path`, `monkeypatch:
pytest.MonkeyPatch`); an unannotated fixture parameter is the most common
strict-mode error on a new repo (measured on the template: 7 errors from
one untyped `capsys`, 0 after annotating).

## Milestone Policy
- Early milestones run every gate but treat coverage as advisory
  (`python-test-harness` stage `pre-alpha`).
- Any change to the envelope, a command's arguments, or the exit map ships
  its regression test in the same diff.
- Promotion to a stricter stage raises coverage thresholds and turns the
  contract lane from advisory to enforced; it does not add new gate types.
