# Review and Normalize Lane: Existing Code, Mixed Authors, Dense Styles

Read this once per cleanup or review task. It covers reviewing older code,
code written by other agents or humans in different styles, and code written
in an ultra-compact or metaprogramming-heavy register that reads naturally to
a frontier model and poorly to a human accustomed to conventional logic flow.

The governing rule: a normalization must leave behaviour identical, must leave
hot paths no slower without a recorded decision, and must be reviewable as a
style change on its own.

This lane changes code. A request to assess, audit, or score style without
edits uses `audit-lane.md` instead, which reuses sections 2 and 3 below.

Contents: [1. Scope the sweep](#1-scope-the-sweep) ·
[2. Triage each file](#2-triage-each-file) ·
[3. Classify the zone](#3-classify-the-zone-hot-or-cold) ·
[4. Choose the action](#4-choose-the-action-per-mark) ·
[5. Perf guard](#5-perf-guard-for-hot-zone-rewrites) ·
[6. Behaviour preservation](#6-behaviour-preservation) ·
[7. Diff discipline](#7-diff-discipline) ·
[8. Finish](#8-finish)

## 1. Scope the sweep
- Agree the target with the requester: which packages, modules, or files, and
  whether the sweep may touch public signatures. Public-signature changes are
  compatibility events for any importer; list them explicitly.
- Read the repo's contract files, `pyproject.toml`, and any documented house
  style. The repo's conventions outrank this skill's defaults. A repo with no
  lint set gets TOOL-2a (`lint-posture.md`) as a separate owner decision,
  not as part of the sweep.
- Run the full validation baseline on the clean tree and keep the output.
  Without a green baseline (format, lint, type check, and tests all as the
  repo gates them) the sweep cannot claim to have preserved behaviour; a red
  check is fixed in its own commit first or recorded as a pre-existing
  failure.
- Exclude vendored, generated (`_pb2.py`, migrations, notebooks exported to
  scripts), and third-party-copied code. Files already flagged as hotspots by
  `refactoring-governance` are not restyled in place; they go through that
  skill's gate, and a style pass must not make them worse.

## 2. Triage each file
In a normalization, every file in scope. In an audit, the sampled files
(`audit-lane.md` section 5). Read the file and mark every construct that matches
`frontier-antipattern-catalog.md`. Typical signs of super-agent code:

- comprehensions with two or more `for` clauses, nested comprehensions,
  conditional expressions inside comprehensions, walrus inside a
  comprehension;
- `functools.reduce`, `map`/`filter` with `lambda`, `itertools` chains past
  three calls, generator expressions passed through three functions before
  being consumed;
- `**kwargs` forwarded through more than one layer; `*args` where the
  parameters are known;
- decorators that change a function's signature or return type; decorator
  factories with their own state; class decorators that add methods;
- metaclasses, `__init_subclass__` registries, `__getattr__` on modules or
  classes, `__class_getitem__` tricks, descriptors, for ordinary workflows;
- `TypeVar` / `ParamSpec` / `Generic[...]` signatures with one instantiation;
  `Protocol` with one implementer; ABCs with one subclass;
- `try` / `except Exception` around whole functions; `except: pass`;
  `contextlib.suppress(Exception)`;
- dict-of-dicts or tuple-of-tuples where a dataclass would name the fields;
  positional tuples unpacked five deep;
- `getattr(obj, name)` dispatch tables built from strings; `globals()` lookups;
  `eval` / `exec` on anything;
- `numpy` expressions with `einsum`, stride tricks, or fancy indexing that
  encode the algorithm in index arithmetic without a comment;
- functions past 80 lines with every branch inlined "for speed";
- `# noqa` and `# type: ignore` without a rule code or a reason.

For each mark, record the construct, the file and line, and the rule ID that
replaces it. This list is the work order and goes into the normalization
record (`assets/normalization-record-v1.md`).

## 3. Classify the zone: hot or cold
Before deciding what to do with a mark, decide whether it sits in a
performance-critical zone. Classify the function or operation, not the file
or module that contains it. Evidence, in order of strength:

1. an existing benchmark or perf scenario that exercises it and reports its
   cost (an end-to-end request timing does not measure one-shot setup);
2. a profile (`cProfile`, `py-spy`, `scalene`) that shows it, or a `# PERF:`
   comment with a number;
3. call frequency, traced from real call sites: per request, per record, per
   feature, or inside a loop is hot; once per process, import, file open, or
   cache miss is setup;
4. structural position when the call path cannot be traced: inner loop over
   per-feature or per-vertex data, parser or decoder over untrusted-size
   input, `numpy`/`shapely` bulk operation, anything under a `kernels`,
   `geo`, `emit`, `encode`, `hot`, or `fast` module name, anything called
   from such a path;
5. nothing: startup, configuration, CLI parsing, error construction, logging,
   tests, one-shot tooling.

Evidence 1, 2, 4, and per-iteration findings from 3 are **hot**. Setup found
by 3, and evidence 5, are **cold**. When the position is genuinely unknown,
treat it as hot until measured.

Name the cost a hot tag protects, because it decides the perf guard:
`hot (request)` for work on the interactive or service path; `hot (loop)`
for the body of a long-running batch loop; `hot (load)` for per-element work
inside a loop that runs once per file, dataset, or batch, whose cost scales
with input size. Its guard is load time on a representative large input, not
request latency. The one-shot setup around that loop stays cold.

Example: in a `geo` package, building a `shapely` `STRtree` once when a
dataset is opened is setup, so cold, even though it sits in a hot-sounding
module. The per-feature `query` against that tree during load is
`hot (load)`. The module name alone would have tagged both hot and demanded
a load-time guard for a rewrite of the constructor that load time cannot
separate from the queries. Never assume
cold because the code looks simple. In Python the difference between a
vectorized `numpy` expression and a plain loop can be 100x; that is exactly
why the plain twin must be measured, not assumed.

## 4. Choose the action per mark
| Situation | Action |
|---|---|
| Cold zone | Rewrite plainly. No measurement needed; note "cold path" in the record. |
| Hot zone, plain rewrite plausibly equivalent | Rewrite plainly **under the perf guard** (section 5). |
| Hot zone, the dense shape is the reason it is fast (vectorization, C-backed call, cached decorator) | Keep the construct; add the full `TRICKY` block, the plain twin under `tests/`, and the property test. Record the measured reason. |
| Hot zone, no way to measure on this host | Do not rewrite. Add the `TRICKY` block if the construct is legible enough to document; otherwise record `perf impact unmeasured` and hand off. |
| Gated construct, cold zone, no correctness reason | Rewrite plainly; the gate is not met. |
| Public signature change | Contract decision first; then style. List every importer touched. |
| Hotspot file per `refactoring-governance` | Route to that skill; do not restyle in place. |

The bar for keeping tricky code in existing files is the same gate as for
writing it: `tricky-code-gate.md`, all criteria. Legacy status is not an
exemption; it is a reason to add the missing comment block and twin.

## 5. Perf guard for hot-zone rewrites
A documented perf policy in the target repo (for example an owner ruling
that small generation-time deltas are not gating) outranks this default;
cite it in the record and measure only what it still requires.

Use `python-test-harness`'s benchmark lane for capture and compare when it is
installed. When it is not, this is the minimum:

1. **Baseline on the original.** Same interpreter and host, representative
   input size, no other load. Prefer an existing `pytest-benchmark` case;
   else `hyperfine` on a CLI invocation that exercises the path; else a
   `timeit` script under `benches/` with the input generator checked in (it
   ships in its own commit before the rewrite, so both sides are measured by
   the same code).
   Take enough runs to see the noise floor (at least 10 for `hyperfine`,
   default rounds for `pytest-benchmark`). Record command, numbers,
   interpreter version, host, and commit.
2. **Memory when the zone is memory-bound.** Peak RSS via the platform time
   command, or `tracemalloc` snapshots around the call. Record the same way.
3. **Rewrite.** Behaviour-preserving only. Keep the original implementation
   under `tests/` (or a `_plain` sibling) as the oracle for a property or
   golden test until the rewrite is accepted.
4. **Measure the rewrite** with the identical command.
5. **Decide by the noise floor.** Within noise: ship the plain version and
   delete the oracle or keep it as the twin. Slower beyond noise: do not ship
   the plain version silently. Either find a plain shape that matches, or
   restore the original with the full `TRICKY` block and the measured reason
   ("plain version measured N% slower on <host>, <bench>"). Faster: say so;
   do not claim it without the numbers.
6. **Record** before and after in the normalization record. A claim without
   numbers is written as `perf impact unmeasured`.

Attack a favourable result before believing it: check that the input size is
representative, that a cache (`functools.cache`, `lru_cache`, an in-memory
fixture) is not warming the second run, and that the interpreter is the one
the repo pins.

## 6. Behaviour preservation
- Existing tests are the first oracle. If the code has none, write
  characterization tests before the rewrite: goldens for deterministic
  output, `hypothesis` property tests comparing old and new on generated
  inputs.
- Preserve exception classes and messages that any caller or test observes.
  A "cleanup" that changes an exception type or message is a behaviour change
  and is called out.
- Preserve public signatures, keyword names, and defaults unless the contract
  owner agreed otherwise. A renamed keyword breaks every caller silently at
  runtime; `pyright` on the whole tree is the minimum check.
- Preserve iteration order, float formatting, and dict key order where any
  output is compared byte-for-byte.

## 7. Diff discipline
- Style normalization is its own change. Bug fixes found during the sweep are
  reported and fixed in a separate diff with their own regression test.
- Batch by module or by construct class, small enough to review in one
  sitting. One 3,000-line normalization is not reviewable and defeats the
  purpose.
- The change description lists: files touched, each construct replaced with
  its rule ID, each `TRICKY` site kept or added, perf before/after per hot
  zone, tests added, and what was not done.
- Do not regress lint posture. A rewrite that needs a new `# noqa` is not
  finished; if a suppression is truly required, it carries the rule code and
  a reason.

## 8. Finish
1. Full validation on the final tree; report actual output.
2. SKILL.md Self-Review on the diff.
3. Normalization record complete; residuals named with an owner.
