# Ownership and Lanes

## Harness Ownership
This skill owns: lane and tier definitions, marker names, the hermetic
`conftest.py` defaults, golden governance, the coverage gate, the report
artifacts and their paths, and the stage/enforcement policy.

## Adjacent Ownership
- `python-cli-app`: `pyproject.toml` (including the `[tool.pytest.ini_options]`
  and `[tool.coverage]` tables this skill relies on), the CLI contract tests'
  content.
- `python-style-guide`: test naming and shape rules (TEST-*), the plain-twin
  oracle and perf guard that use the `bench` lane.
- `agentic-debugging`: what to do when a lane fails for an unknown reason.
- `maintain-audit-evidence`: the claim ledger when a milestone gate depends
  on these results.

## Lanes and Tiers (v1)
| Lane | Tier | Selection | What it proves |
|---|---|---|---|
| `unit` | A | `-m "not contract and not golden and not bench"` | Pure functions, dataclasses, parsers; runs with coverage |
| `contract` | B | `@pytest.mark.contract` | The CLI or public API as a black box: spawned process, exit codes, envelope |
| `golden` | B | `@pytest.mark.golden` | Deterministic serialized output byte-for-byte against `fixtures/golden/` |
| `bench-smoke` | C | `@pytest.mark.bench`, `PY_BENCH_ENABLE=1` | A hot path still runs and its plain twin agrees; numbers for the style guide's perf guard |

Markers are declared in `pyproject.toml` (`--strict-markers` rejects
typos). An unmarked test is a unit test. A test that needs a marker it does
not have is a defect the matrix shows as a missing lane, not a silent pass.

## Lane Exit Guidance
- `unit` red: fix before anything else; nothing downstream is trustworthy.
- `contract` red: the public surface changed; update the contract record and
  the test in the same diff, or revert.
- `golden` red: either a regression or an intended change; only the
  approval workflow in `goldens-and-approval.md` distinguishes them.
- `bench-smoke` red: the twin disagrees (correctness) or the run crashed;
  slowness is reported, not failed, at this tier.
- pytest exit `5` (no tests collected) is a `skip`, not a failure; the lane
  JSONL records it so an empty lane is visible.

## v1.1 Expansion (not in MVP)
Image goldens with a tolerance comparator, numeric goldens with named
tolerances, a scale lane (same pipeline at 2x/4x input), and CI wiring.
Each arrives with its own control.
