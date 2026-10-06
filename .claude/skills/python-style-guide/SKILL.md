---
name: python-style-guide
description: "Use when writing new Python, reviewing and normalizing existing Python (including dense agent-written code), or auditing existing Python read-only against the guide, for human readability: control flow, naming, modules, type hints and data modelling, comprehension and generator style, exception style, metaprogramming and dynamism policy, security hygiene, asyncio and thread legibility, ruff/pyright posture, the tricky-code gate, and performance-guarded cleanup of hot paths. Not for project bootstrap or CLI contracts (python-cli-app), test lanes and goldens (python-test-harness), or hotspot scoring (refactoring-governance)."
license: MIT
metadata:
  version: "5"
  track: addon
  model-posture: any
  ported-from: polymath-skills-dev/rust-style-guide
---

# Python Style Guide

## Purpose
Make Python that a competent human teammate can read once, review in a diff,
and change safely, without reconstructing the author's private runtime model.

Python lets you write code that no reviewer can follow: metaclasses that
rewrite classes, decorators that change signatures, `**kwargs` passed through
four layers, comprehensions that hold a whole algorithm, dynamic attributes
resolved at import time. In a codebase under this skill that is the risk being
managed, not a strength. The reader you write for reads at diff speed, in a
review pane, often without a language server, sometimes during an incident.
Optimize for that reader.

Priority order when directives conflict:

1. Correctness and security: no silent exception swallowing, no trust-boundary
   holes, no `eval` on input, no leaked secrets, no mutable-default surprises.
2. Human comprehensibility: a reader with ordinary Python fluency follows the
   control flow, the data shapes, and the failure paths from source alone.
3. Idiomatic canon: what PEP 8, PEP 20, `ruff format`, the ruff default rules,
   and the standard library already do. Conform; do not re-derive.
4. Performance and cleverness: earned only with measurement, and only through
   the tricky-code gate.

Authority order inside a target repo: the repo's own `pyproject.toml`
(`[tool.ruff]`, `[tool.pyright]`, `[tool.mypy]`) and documented house
conventions, then `ruff format` defaults, then ruff's default rule set, then
PEP 8 and the typing PEPs, then this skill. Project facts win; state an
override in one line and move on.

## Core Rules (always in force)
1. Default to the boring dialect: functions, `@dataclass(frozen=True)`,
   `Enum`, `match` or `if`/`elif`, `for`, explicit `return`, `with`, plain
   modules. A class exists because it has state and behaviour, not for
   namespacing.
2. Every abstraction pays rent in the reader's head. A base class, decorator,
   metaclass, generic `TypeVar`, protocol, or plugin registry must remove more
   confusion than it adds, today, for a caller that exists.
3. Concrete before generic; function before decorator; decorator before
   metaclass; explicit before dynamic. Generalize on the second real caller.
4. Cleverness is quarantined, never ambient. Gated constructs pass the
   tricky-code gate in full or are rewritten plainly.
5. Comments carry intent for humans: why, and what must stay true. Never
   narrate the next line.
6. Raise specific exceptions with context; catch the narrowest class that the
   handler can actually handle; never `except:` or `except Exception: pass`.
   `assert` states an invariant, never validates input.
7. Type hints on every public signature and every dataclass field; `Any`,
   `cast`, and `# type: ignore` are labelled decisions with a reason.
   Trust boundaries parse once, at the edge, into typed values.
8. Mutable state is a design decision: no mutable default arguments, no
   module-level mutable singletons without a stated owner, frozen dataclasses
   by default, copies at boundaries when a caller may mutate.
9. Style rewrites of existing code never ride inside a bug fix or a feature
   diff, never touch vendored or generated code, and never slow a hot path
   without measured evidence and a recorded decision.
10. When unsure, spell it out: two named locals beat one dense expression; a
    `for` loop beats a comprehension that needs a diagram.

## Workflow
1. Classify the task, then open one lane reference (it may route you into a
   named section of another lane):
   - Writing new code from a goal, design, or ticket:
     `references/author-lane.md`
   - Reviewing, normalizing, or cleaning up existing code, including code
     written by other agents or in a denser style:
     `references/review-normalize-lane.md`
   - Auditing, assessing, or scoring existing code without changing it:
     `references/audit-lane.md`. Only an explicit request to change code
     selects the normalize lane.
2. Read the target repo's `pyproject.toml` and contract files before editing.
   Match house conventions; do not import this skill's lint set into a repo
   that has its own.
3. Apply the Core Rules. Open a topical reference only for the decision in
   front of you (see Reference Routing).
4. Any gated construct (metaclass, `__init_subclass__` registry,
   signature-changing decorator, descriptor, `__getattr__` magic, `exec` /
   `eval`, monkeypatching outside tests, `TypeVarTuple` / `ParamSpec`
   lattices for one caller, C extension or `ctypes`, hand-written event loop
   or protocol, `numpy` stride tricks, vectorization that hides the
   algorithm) goes through `references/tricky-code-gate.md` before it ships.
5. Run the self-review below on the final diff, then `ruff format --check`,
   `ruff check`, and `pyright` with the repo's configuration. The audit lane
   has no diff; it runs these as its baseline instead.

## Self-Review (every Python diff; any "no" is fixed, or carried as a residual with an owner in the change description)
1. Could a new teammate explain each changed function in two minutes from
   source alone?
2. Any function past the length or nesting flags without a one-line reason?
3. Any base class, protocol, `TypeVar`, or decorator with exactly one user?
4. Any comprehension past the budget, lambda with a conditional inside, or
   `functools.reduce` a loop would say better?
5. Any bare `except`, swallowed exception, `assert` on input, or public
   function whose docstring omits the exceptions it raises?
6. Any decorator or metaclass that could be a function; any dynamic attribute
   without its resolved shape shown?
7. Any `eval` / `exec` / `pickle.loads` / `subprocess(shell=True)` on data
   from outside; any path join from untrusted input; any secret in a log?
8. Any lock held across `await`, unnamed `create_task` result, blocking call
   inside a coroutine, or thread sharing mutable state without a lock?
9. Every gated construct carries the full `TRICKY` block and is listed in the
   change description?
10. `ruff format --check`, `ruff check`, and `pyright` clean; every
    suppression a `# noqa: RULE  # reason` or `# pyright: ignore[rule]` with
    a reason (inline, or on the line above), and every `per-file-ignores` entry recorded with its reason
    (TOOL-2a)?

## Reference Routing
- New-code procedure: `references/author-lane.md`
- Existing-code review, normalization, perf-guarded rewrites, super-agent
  code triage: `references/review-normalize-lane.md`
- Read-only style assessment, scorecard, and ranked work order:
  `references/audit-lane.md`
- Permission and comment contract for tricky code:
  `references/tricky-code-gate.md`
- Recognizing dense agent-written shapes and their plain replacements:
  `references/frontier-antipattern-catalog.md`
- Function shape, nesting, naming, modules, imports, visibility:
  `references/control-flow-naming-modules.md`
- Dataclasses, enums, typing, protocols, generics, mutability:
  `references/types-and-data.md`
- Comprehensions, generators, itertools, `functools`, lambdas:
  `references/comprehensions-and-iteration.md`
- Exceptions, context, `assert`, logging of failures:
  `references/errors-and-exceptions.md`
- Decorators, metaclasses, descriptors, dynamic attributes, `exec`,
  import-time work: `references/metaprogramming-and-dynamism.md`
- Input trust, subprocess, paths, serialization, secrets, dependencies:
  `references/safety-and-security.md`
- asyncio, threads, processes, locks, cancellation:
  `references/concurrency-and-async.md`
- Comment prefixes, docstrings, test naming and shape:
  `references/comments-docs-tests.md`
- Ruff and pyright baseline, first adoption in an existing codebase,
  suppressions, thresholds: `references/lint-posture.md`
- Community sources behind each rule family: `references/sources.md`

## Assets
- `assets/ruff-pyright-baseline.toml`: the `[tool.ruff]` and `[tool.pyright]`
  tables from `lint-posture.md`, verified against the toolchain named there.
- `assets/tricky-comment-template.txt`: the mandatory comment block for gated
  code.
- `assets/normalization-record-v1.md`: before/after record for a review-lane
  cleanup, including perf evidence.
- `assets/style-scorecard-v1.md`: per-rule scorecard and ranked work order
  for an audit-lane assessment.

## Use With Other Skills
- `python-cli-app` owns project bootstrap (`uv`, `pyproject.toml`, `src/`
  layout) and CLI output and exit-code contracts. Its `pyproject` baseline
  embeds this skill's lint set; when both are installed, edit the set in one
  place.
- `python-test-harness` owns test lanes, hermetic fixtures, goldens, and
  coverage gates. This skill's perf guard and plain-twin oracle are written
  as ordinary tests in that harness.
- `refactoring-governance` decides when a file or package is a hotspot that
  must split. This skill gives the per-function bar.
- `rust-style-guide` is the sibling for Rust; the rule-ID scheme, lanes, and
  gate are the same so a mixed repo reads one way.
- `superprompt` owns contracts-before-code and the final delivery gate. Its
  contract wins on what a public function exposes; this skill wins on how it
  is spelled.

## Validation
- `ruff format --check`, `ruff check`, and `pyright` with the repo's
  configuration on the final tree, output reported.
- The Self-Review list above, answered on the diff.
- Review lane only: the normalization record filled in, with perf before/after
  numbers or the words `perf impact unmeasured` and the reason.
- Audit lane only: the scorecard filled in with verified/inferred labels, no
  source or configuration changes, and a "not examined" list.
