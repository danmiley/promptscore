# Comments, Docstrings, Tests

## Comments and docstrings (DOC)
- **DOC-1** *(Canon: PEP 257; ruff `D`)* Every public module, class, and
  function has a docstring whose first line is one sentence in the
  imperative ("Return the frame area in square points."). Google style
  sections (`Args`, `Returns`, `Raises`, `Yields`) when they add
  information; not restating the types.
- **DOC-2** *(Skill)* Comments explain why and what must remain true: the
  constraint, the trade-off, the bug this prevents, the invariant the next
  line relies on. A comment that restates the code is deleted.
- **DOC-3** *(Skill)* Prefixes are stable so review can grep them:
  `# TRICKY:` (gated construct, full block), `# PERF:` (measured number and
  command), `# WHY:` (a non-obvious decision), `# INVARIANT:` (what must
  hold), `# NOTE:` (a fact the reader would otherwise look up).
- **DOC-4** *(Skill; ruff `TD`, `FIX`)* `TODO` / `FIXME` carry an owner or
  issue and a condition for removal; never a bare `TODO`.
- **DOC-5** *(Skill)* Public functions that can fail list `Raises:`; ones
  with units, coordinate systems, encodings, or ordering guarantees name them
  in the docstring or the parameter name (`radius_m`, `decimals`, `sorted by
  Hilbert index`).
- **DOC-6** *(Skill)* Comment density is proportional to surprise. A plain
  loop needs none; a vectorized expression names its array shapes; a gated
  construct gets the full block.
- **DOC-7** *(Skill)* Doctests only for tiny pure examples that double as
  documentation; behaviour is tested under `tests/`, not in docstrings.

## Tests as readable specification (TEST)
- **TEST-1** *(Skill)* Tests live under `tests/`, mirror the package layout
  (`tests/geo/test_frame.py` for `src/<pkg>/geo/frame.py`), and use plain
  `pytest` functions; classes only to share a fixture scope.
- **TEST-2** *(Skill)* A test name states the behaviour and the condition:
  `test_chunk_splits_at_sixteenth_of_width`, `test_parse_width_rejects_zero`.
  Never `test_1`, `test_frame`, `test_works`.
- **TEST-3** *(Skill)* Tests verify observable behaviour, invariants, and
  error paths, not private helpers or call counts. A test that needs
  `mock.patch` on three internals is testing the wrong seam.
- **TEST-4** *(Skill)* A reproducible bug fix ships a regression test named
  after the bug.
- **TEST-5** *(Skill)* Helpers and fixtures clarify setup and assertions;
  they never hide the assertion. `assert result == expected` with a plain
  `expected` literal beats a helper that compares "semantically".
- **TEST-6** *(Skill)* Property tests (`hypothesis`) for pure transforms
  with a plain-twin oracle; goldens for deterministic serialized output;
  parametrized cases for enumerated inputs.
- **TEST-7** *(Route)* Test lanes, hermetic fixtures, golden approval,
  coverage gates, and reports belong to `python-test-harness`.
