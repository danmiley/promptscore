# Python Style Scorecard

One scorecard per audit-lane assessment. Statuses: `meets`, `partial`,
`gap`, `n/a` (nothing the family governs is present), `not assessed`.
Fill every row; write `not assessed` rather than leaving a status blank,
and never mark `meets` without evidence. Labels: `verified` = measured or read at the cited site;
`inferred` = sampled or reasoned.

- **Target:** <packages / modules / files>  **Excluded:** <venv, generated, vendored, skill lanes>
- **Commit:** <sha>  **Tools:** <ruff / pyright / Python versions>
- **House posture:** <[tool.ruff] / [tool.pyright] / TOOL-2a block, or none; nested configs without `extend`>
- **Baseline:** `ruff format --check` <n files> · `ruff check` (repo config) <n> ·
  `pyright` (repo config) <n errors> · rule-set probe (TOOL-2a)
  <n production> / <n tests> / <n scripts, examples, benchmarks>
- **Triage sample rule:** <ranking rule and cutoff>

## Core Rules
| # | Rule (short) | Status | Evidence (count / measurement) | Examples (≤3 file:line) | Label |
|---|---|---|---|---|---|
| 1 | Boring dialect by default | | | | |
| 2 | Abstractions pay rent | | | | |
| 3 | Concrete before generic; function before decorator before metaclass | | | | |
| 4 | Cleverness quarantined (tricky-code gate) | | | | |
| 5 | Comments carry intent | | | | |
| 6 | Specific exceptions; narrow catches; `assert` for invariants only | | | | |
| 7 | Typed public signatures; labelled `Any` / ignores; parse at the edge | | | | |
| 8 | Mutable state deliberate | | | | |
| 9 | Style rewrites isolated from features (last 20 Python commits) | | | | |
| 10 | Spell it out when unsure | | | | |

## Rule families
| Family | Reference | Status | Evidence | Examples | Label |
|---|---|---|---|---|---|
| FLOW | control-flow-naming-modules.md | | | | |
| NAME | control-flow-naming-modules.md | | | | |
| MOD | control-flow-naming-modules.md | | | | |
| FMT | control-flow-naming-modules.md | | | | |
| TYPE | types-and-data.md | | | | |
| DATA | types-and-data.md | | | | |
| ITER | comprehensions-and-iteration.md | | | | |
| ERR | errors-and-exceptions.md | | | | |
| META | metaprogramming-and-dynamism.md | | | | |
| SAFE | safety-and-security.md | | | | |
| CONC | concurrency-and-async.md | | | | |
| DOC | comments-docs-tests.md | | | | |
| TEST | comments-docs-tests.md | | | | |
| TOOL | lint-posture.md | | | | |

## Tricky-code inventory
| File:line | Gated construct | `TRICKY` block present? | Zone: hot (request/loop/load), cold, unknown; call site |
|---|---|---|---|
| | | | |

## Work order (ranked; each an independent PR)
| Rank | Change | Rule IDs | Files | Zone + call site | Perf evidence needed (which cost)? | Owner decision? |
|---|---|---|---|---|---|---|
| 1 | Lint posture: adopt / adapt / reject the baseline | TOOL-2, TOOL-2a | pyproject.toml | n/a | no | yes |

## Not examined / not measured
- <item and reason>
