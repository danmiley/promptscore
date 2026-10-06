# Lint, Formatter, and Type-Checker Posture

Rule IDs are stable for citation. The repo's own configuration outranks this
file: do not import this set into a repo that has one. Offer it to a repo
that has none (`python-cli-app`'s bootstrap does exactly that).

Contents: [Formatter, rule set, type checker](#formatter-rule-set-type-checker-tool-1-to-tool-3) ·
[First adoption](#first-adoption-tool-2a) ·
[Suppressions, thresholds, gates](#suppressions-thresholds-gates-tool-4-to-tool-7)

## Formatter, rule set, type checker (TOOL-1 to TOOL-3)

- **TOOL-1** *(Canon: PEP 8; ruff)* `ruff format` default style, line
  length 88. `ruff format --check` in every gate. A `line-length` override
  only for a project-wide, stated reason.
- **TOOL-2** *(Skill)* Configure lints once, in `pyproject.toml`
  `[tool.ruff]`, never in a second file. The set in
  `assets/ruff-pyright-baseline.toml` is the baseline.

  Verified 2026-09-20 on `ruff 0.15.22`, `pyright 1.1.414`, Python 3.12.13,
  `uv 0.11.14`, macOS arm64: every selector resolves (no unknown-rule
  warning from `ruff check`); a clean probe module and CLI produce no ruff
  or pyright finding; a negative-control module fires `B006` (mutable
  default), `E711` (`== None`), `E722` (bare except), `E741`, `F401`,
  `F403`, `F841`, `RET501`, `S101`, `S110` (except-pass), `S307` (eval),
  `SIM105`, `T201` (print), `D103`; a second control fires `ASYNC251`
  (`time.sleep` in a coroutine), `S301` (pickle), `PGH004` (blanket
  `noqa`), `TD002`/`TD004`/`FIX002` (bare TODO); pyright strict reports errors
  on the untyped control and 0 on the clean module (the count varies with
  the control and the pyright version; the test asserts > 0 and 0). Re-verify on a
  ruff minor bump: rule codes move between preview and stable over time.

  Families selected and why: `E W F I N UP B A C4 SIM RET ARG PTH PL RUF`
  (canon readability), `S BLE T20 ERA TRY EM ISC PIE PGH` (safety and
  exception hygiene), `ASYNC` (CONC-3), `TD FIX` (DOC-4), `D` with
  `convention = "google"` (DOC-1). Ignored on purpose: `D100 D104 D105 D107
  D203 D213` (docstring noise and incompatible pairs), `PLR0913` (FLOW-6 is
  a review prompt), `TRY003 EM101 EM102` (ERR-2 wants the value in the
  message), `TD003` (issue link optional). Tests relax `S101 D PLR2004 ARG
  T20`.

  `extend-exclude = [".agents", ".claude", "scripts/polymath"]` keeps a bare
  `ruff check` off the installed skill lanes, whose templates carry
  `<placeholders>` and are not project code (measured on the first target:
  22 findings, all from lane templates, before the exclude).

  Never `select = ["ALL"]`: it enables mutually exclusive rules and
  preview churn. Never enable `preview = true` in a gate.

  Re-verified 2026-09-23 on `ruff 0.15.22` and `pyright 1.1.411`: every
  code listed above still fires from its control, the clean module is
  silent, and pyright strict errors only on the untyped control
  (`tests/python_style_guide_test.sh`).
- **TOOL-3** *(Canon: pyright docs)* `pyright` in `strict` mode on `src`
  and `tests`, `pythonVersion` pinned to the repo's minimum,
  `reportMissingTypeStubs = false` so an untyped dependency is a labelled
  `Any` at its import (TYPE-6), not a wall of errors. `mypy` is not run in
  parallel; one checker, one set of ignores.

## First adoption (TOOL-2a)

- **TOOL-2a** *(Skill)* First adoption in an existing codebase. The baseline
  is a proposal, not a default: on a mature codebase whose current gate is
  green it can report thousands of findings. Adopting, adapting, or
  rejecting it is the repo owner's decision; an audit or a style sweep never
  writes configuration or suppressions as a side effect.
  1. Probe without editing the repo's configuration. Copy
     `assets/ruff-pyright-baseline.toml` unchanged to
     `<scratch>/pyproject.toml` (ruff reads the `[tool.ruff]` tables from a
     `pyproject.toml` passed to `--config`; no conversion needed) and run,
     **from the repo root**,
     `ruff check --no-cache --exit-zero --output-format json --config <scratch>/pyproject.toml .`
     - `--config <file>` replaces every discovered config, nested ones
       included, so the whole tree is probed with one rule set.
     - The scratch file's relative globs (`extend-exclude`,
       `per-file-ignores`) resolve against the working directory. Run from
       anywhere else and they silently stop matching.
     - **The exit status is not the result.** `ruff check` exits 1 whenever
       it finds anything; `--exit-zero` keeps a probe from reading as a
       failure. Count the JSON records.
     - For pyright, copy the asset's `[tool.pyright]` keys except `include`
       into a scratch `pyrightconfig.json`:
       `{"typeCheckingMode": "strict", "reportMissingTypeStubs": false, "pythonVersion": "<repo's>"}`,
       and run `pyright --outputjson -p <scratch>/pyrightconfig.json <repo paths>`
       from the repo's environment; the scratch file sets the mode, the path
       arguments set the files. Dropping `reportMissingTypeStubs` recreates
       the untyped-dependency wall TOOL-3 exists to prevent (on one real repo:
       170 errors, all that rule, where the baseline reports 0).
  2. Ruff reports each finding once; no deduplication is needed. Drop
     findings in files the repo does not own (vendored copies, generated
     code) and report how many were dropped.
  3. Split before calling a count policy debt, by path, into three buckets:
     **tests** (`tests/`, `test_*.py`, `*_test.py`, `conftest.py`, any
     directory named `tests` inside a package); **tooling** (`scripts/`,
     `examples/`, `benchmarks/`, `docs/`); **production** (everything
     else). `S101` in a test is not the same finding as an `assert` on a
     request parameter.
  4. Present counts per rule and per package, the few rules that carry most
     of the volume, and a recommendation per rule using the step 5
     statuses: `enable`, `next`, `adapt`, `later`, or `reject`.
  5. Apply the owner's decision in `pyproject.toml`, which becomes the
     record:
     - Select in `[tool.ruff.lint]` only rules with zero findings across the
       whole tree, tests included, because the gate runs `ruff check` over
       everything. A family is selected whole only when every rule in it is
       clean; otherwise select its clean codes individually. Findings name
       codes, not selectors (`T201` is family `T20`, `PLR2004` is `PL`):
       map each code to its family, and list a family's codes, with
       `ruff rule --all --output-format json` (fields `code`, `linter`).
     - Beside the selection, a comment block records every other baseline
       rule or family with its count and exactly one status:
       - `next`: fix its findings, then select it, in its own PR;
       - `adapt`: select it now, in the same PR adding a
         `per-file-ignores` entry with a reason for the named paths. Only
         valid when those paths hold every finding; otherwise the rule is
         `next` or `later` with the adapt plan noted beside it;
       - `later`: deliberately deferred, with the reason;
       - `reject`: not for this repo, with the reason.
       Head it with the date, owner, tool versions, and the commit the counts
       came from. The next audit reads this block as the house posture
       instead of re-deciding.
     - Pyright follows the same shape: keep the repo's mode and list the
       files or packages that are already clean under `strict = [...]`;
       each `next` package moves into the list in its own PR.
     - Check for nested ruff configs. A subdirectory `ruff.toml` or
       `[tool.ruff]` table without `extend` replaces the root set for its
       subtree, so the new rules never run there. The remedy is
       `extend = "<relative path to the root pyproject.toml>"` at the top of
       the nested file (for example `extend = "../../pyproject.toml"`), plus
       its own additions as `extend-select`, never `select`: a nested
       `select` replaces the inherited set even with `extend` present.
       `ruff check --show-settings <file>` prints the settings path that
       governs a file.
     - Verify with the repo's own gate command, then plant a finding for an
       adopted rule that the ruff defaults do not select (a `print()` in
       library code for `T201` when `T20` was adopted; otherwise any adopted
       off-by-default code) in each configured subtree, confirm the gate
       fails, and revert. A green gate alone does not prove the rules reached every
       file.
     - Never make a gate blocking on a set that is not already clean.

     ```toml
     [tool.ruff.lint]
     # Lint posture. Decided <date> (owner: <name>) by python-style-guide
     # TOOL-2a. Counts: whole tree, ruff <version>, <commit>.
     select = ["E4", "E7", "E9", "F", "B006", "T20", "S307", "S603"]
     # enable: E4 E7 E9 F B006 T20 S307, 0 each
     # adapt:  S603 4, all in src/pkg/render.py (per-file-ignores below)
     # next:   D 212 (docstrings), RET 14
     # later:  PL 96 (thresholds first)
     # reject: ERA (commented-out code is policed in review here)

     [tool.ruff.lint.per-file-ignores]
     "src/pkg/render.py" = ["S603"]  # argv[0] is the renderer path from config (SAFE-1)
     ```

## Suppressions, thresholds, gates (TOOL-4 to TOOL-7)

- **TOOL-4** *(Skill; ruff `PGH003`, `PGH004`)* Suppressions name the rule
  and a reason: `# noqa: S603  # argv[0] is the pinned binary from config, SAFE-1`,
  `# pyright: ignore[reportUnknownMemberType]  # shapely stubs incomplete`.
  When the line is already long, the reason may sit in a comment on the
  line directly above instead. A blanket `# noqa` or `# type: ignore` is a
  defect. `PGH003`/`PGH004` catch only the blanket form; a coded suppression
  with no reason passes every tool and is found by review or the audit
  lane's scan. Never contort clear
  code to satisfy an advisory rule; record a narrow exception instead.
- **TOOL-5** *(Skill)* Thresholds (`max-branches`, `max-statements`,
  `max-nested-blocks`, `max-returns`) are prompts for review, not
  definitions of good code. Leave the repo's values when it has them. To
  measure a flag without touching the repo, pass the threshold inline and
  select the rule explicitly: the `PL` rules are off in ruff's defaults, so
  `ruff check --select PLR0915 --config "lint.pylint.max-statements = 25"`
  counts, and the same command without `--select` silently reports nothing
  (FLOW-5). FLOW-6's flags:
  `ruff check --select PLR0913,FBT --config "lint.pylint.max-args = 5"`
  (verified on ruff 0.15.22: 6 parameters and a positional `bool` fire, a
  keyword-only `bool` does not). FLOW-4's nesting rule is preview-only; use
  the FLOW-4 recipe.
- **TOOL-6** *(Route)* Gate lanes (`ruff check`, `ruff format --check`,
  `pyright`, `pytest`, coverage, `pip-audit`) belong to `python-test-harness`
  and `python-cli-app`; this file specifies only the rule set they run. New
  work pins `requires-python = ">=3.12"` and commits `uv.lock`.
- **TOOL-7** *(Skill)* `ruff check --fix` and `ruff format` are run by the
  author before review, never by the gate. A gate that rewrites files hides
  the diff from the reviewer.
