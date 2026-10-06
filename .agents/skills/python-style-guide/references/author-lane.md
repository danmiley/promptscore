# Author Lane: Writing New Python From a Goal or Design

Read this once per authoring task. It is the procedure; the topical
references hold the rules it points at.

## 1. Orient before writing
- Read the repo's contract files in their stated precedence, then its
  `pyproject.toml`: `requires-python`, `[tool.ruff]`, `[tool.pyright]` or
  `[tool.mypy]`, `[tool.pytest.ini_options]`. Note the minimum Python.
- Read the nearest existing code that does a similar job: its exception
  model, dataclass versus dict convention, logging setup, async convention,
  serialization shape, test layout. Reuse a sound existing convention. Do not
  introduce a second one without saying, in the change description, why the
  existing one is inadequate.
- Run the repo's validation commands on the clean tree (`uv run ruff check`,
  `uv run ruff format --check`, `uv run pyright`, `uv run pytest`) so a
  pre-existing failure is not mistaken for one you caused.

## 2. Say what the code must do before choosing its shape
Write three to six lines, in the change description or a design note:
- the observable behaviour and its inputs and outputs, with types;
- the invariants that must hold, and who maintains each one;
- the failure paths, and which caller handles each;
- the hot or cold classification of the code (see the review lane's zone
  test if unsure).

If a public function or class is involved, its contract is decided first
(`superprompt` contracts-before-code when installed). This lane then decides
how that contract is spelled.

## 3. Write in the boring dialect
- Functions first. A class appears when there is state that several methods
  share; a base class appears with the second concrete subclass; a `Protocol`
  appears when a second implementation must be swappable by a caller that
  exists.
- `@dataclass(frozen=True, slots=True)` for records; `Enum` for closed sets;
  `match` or `if`/`elif` over an enum, never string comparisons on state.
- Guard clauses at the top; straight-line body; loops in the callee,
  conditions in the caller.
- A comprehension when it is one `for`, at most one `if`, and one expression;
  a `for` loop when the body has state, side effects, or early error return.
- Owned, immutable data across public boundaries: return new objects, do not
  mutate arguments; copy at the edge when a caller may mutate.
- Specific exceptions with context at library seams; `raise ... from err`
  when translating; `assert` only for invariants; no bare `except`.
- Type hints on every signature and field. `Any` is a labelled decision.
- Standard library before a dependency; `argparse`, `pathlib`, `json`,
  `dataclasses`, `logging`, `subprocess` cover most needs.

Detailed rules by topic: `control-flow-naming-modules.md`,
`types-and-data.md`, `comprehensions-and-iteration.md`,
`errors-and-exceptions.md`, `metaprogramming-and-dynamism.md`,
`safety-and-security.md`, `concurrency-and-async.md`.

## 4. When you want a gated construct
Stop and open `tricky-code-gate.md`. Write the plain version first. If the
plain version cannot exist or measurably cannot perform, the gate tells you
what to write down and where. If any criterion fails, ship the plain version.

Performance intuition is not measurement. If the reason for a dense shape is
speed, an A/B number on the target host is required before the dense shape
ships (`python-test-harness` benchmark lane when installed; otherwise the
minimal protocol in `review-normalize-lane.md` section 5).

## 5. Comment and document for the second reader
- Every public item: a one-line docstring summary; `Args`, `Returns`,
  `Raises` sections where they carry information (Google style unless the
  repo says otherwise); units and coordinate systems named.
- Every non-obvious decision: a `why` comment naming the constraint, the
  trade-off, or the bug it prevents. Comment density is proportional to
  surprise. See `comments-docs-tests.md`.

## 6. Tests as the readable specification
Test names state the behaviour (`test_rejects_zero_length_frame`). Cover the
error path. For a gated construct, the plain twin lives under `tests/` and is
the oracle for a `hypothesis` property test.

## 7. Finish
1. Run the SKILL.md Self-Review on the diff.
2. `ruff format --check`; `ruff check`; `pyright`; the test lane appropriate
   to the change. Report actual output, not "should pass".
3. The change description lists every `TRICKY` site, every deliberate
   deviation from house convention with its reason, and what was not
   verified.
