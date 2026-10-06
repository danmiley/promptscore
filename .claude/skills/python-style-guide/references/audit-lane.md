# Audit Lane: Read-Only Style Assessment

Read this once per assessment. Use it when the request is to audit, assess,
score, or report on how existing Python measures against this skill, without
changing it. The output is a report and a work order; the code, the lint and
type-checker configuration, and the history stay as they were.

The governing rule: measure, do not fix. An assessment that edits code,
writes `[tool.ruff]` / `[tool.pyright]` configuration, adds suppressions, or
quotes before/after perf numbers has become a normalization and needs that
lane's authority.

Contents: [1. Scope and boundaries](#1-scope-and-boundaries) ·
[2. Baseline](#2-baseline) · [3. Counts](#3-counts) ·
[4. Scorecard](#4-scorecard) · [5. Work order](#5-work-order) ·
[6. Report](#6-report)

## 1. Scope and boundaries
- Agree the target: packages, modules, or files. Exclude virtualenvs,
  vendored, generated (`_pb2.py`, migrations), and installed agent-skill
  lanes (`.agents`, `.claude`, `scripts/polymath`), and say so in the report.
- Read the repo's `pyproject.toml` and contract files first. Record the house
  posture (or its absence) as the first finding; the repo's conventions are
  the standard the code is scored against, this skill fills the gaps. A
  TOOL-2a decision block in `pyproject.toml` is the house posture: score TOOL
  against it, re-count its `next` rules, and do not re-open its `reject`
  entries unless the counts changed materially.
- Look for nested `ruff.toml`, `.ruff.toml`, or `pyproject.toml` files with
  a `[tool.ruff]` table below the root. One without `extend` pointing at the
  root silently replaces the root rule set for its subtree; that subtree is
  outside the house posture, and its clean baseline proves nothing.
- No source edits, no configuration edits, no commits unless the requester
  asks for the report to be committed. Scratch probes go in a temporary
  directory.

## 2. Baseline
Run and cite, with tool versions:
- `ruff format --check` (count of files that would change);
- `ruff check` and `pyright` with the repo's own configuration;
- the skill's rule set as a probe only, per `lint-posture.md` TOOL-2a steps
  1 to 4: from the repo root, with a scratch config, split into the buckets
  of step 3, counts per rule and per package.

The probe result is evidence for the owner's lint-posture decision, not a
defect count. Say so next to the numbers.

## 3. Counts
Where ruff and pyright do not cover a rule, count with a scan. Before
reporting any zero, show the query matches a known positive (a scratch file
or a known site); a pattern that cannot match proves nothing.
- `assert` used for input validation in production code; bare `except`,
  `except Exception: pass`, `contextlib.suppress(Exception)`;
- `# noqa` and `# type: ignore` / `# pyright: ignore` without a rule code,
  and with a code but no reason (a trailing comment on the same line, or a
  comment on the line directly above, counts as the reason per TOOL-4); ruff
  `PGH003`/`PGH004` catch only the first;
- every `assert` in production code is a candidate (ERR-4). Classify each by
  tracing where its value comes from to the caller or branch that
  establishes the condition: an invariant when earlier code guarantees it,
  input validation when the value arrives from outside unchecked. A
  suppression reason says which the author intended; it is a pointer for the
  trace, not the classification. `python -O` strips asserts, so a
  misclassified one is a missing check in production;
- `eval` / `exec` / `pickle.loads` / `subprocess(..., shell=True)` sites and
  whether their input can come from outside;
- metaclasses, `__init_subclass__` registries, `__getattr__`, descriptors,
  signature-changing decorators;
- functions over the FLOW-5 flags, from `PLR0915` as FLOW-5 defines the
  counter: one run at the aim (25) and one at the flag (50), each with
  `--select PLR0915`; parameter counts and boolean traps for FLOW-6 with
  TOOL-5's `PLR0913,FBT` recipe;
- public functions whose docstring omits the exceptions they raise;
- gated constructs from `tricky-code-gate.md`, and which carry the
  `TRICKY` block (threading primitives per CONC-10's list);
- Core Rule 9, from history: sample the last 20 commits that touch Python
  (`git log -n 20 -- '*.py'`) and count those that mix style-only hunks
  (renames, reformatting, restructuring with no behaviour change) into a
  feature or fix. The minimum proxy is `git show --shortstat` with and
  without `-w` plus rename detection per commit (label the row `inferred`);
  reading the diffs makes it `verified`. No history reviewed means
  `not assessed`; the audit's own lack of edits is not evidence.

## 4. Scorecard
Fill `assets/style-scorecard-v1.md`: one row per Core Rule (1 to 10) and
one row per rule family (FLOW, NAME, MOD, FMT, TYPE, DATA, ITER, ERR, META,
SAFE, CONC, DOC, TEST, TOOL). Do not merge families into one status; a
merged row reports the worst of them and hides the rest. Each row gets a
status (`meets`, `partial`, `gap`, `n/a` when the code base has no
construct the family governs, e.g. CONC on serial code, or
`not assessed`), the count or measurement behind it, at most three
`file:line` examples, and a label:
`verified` (measured or read) or `inferred` (sampled or reasoned). A family
with no evidence is `not assessed`, never `meets`.

## 5. Work order
- Sample files for triage with `review-normalize-lane.md` section 2 and
  record marks with rule IDs. Densest means most marks, not most lines:
  rank files by the count of section 2 signs from the corpus-wide scans and
  probe (functions over the FLOW-5 flags, nested comprehensions, `**kwargs`
  tunnels, gated constructs, reasonless suppressions), then add any file
  holding a function from the `PLR0915` list. State the ranking rule and the
  cutoff in the report.
- Tag each mark with that lane's section 3, by call frequency, not module
  name: `hot (request)`, `hot (loop)`, `hot (load)`, or `cold`, citing the
  call site. Hot marks carry "needs perf evidence before change" and name
  the cost to measure; do not measure before/after here.
- Rank recommendations by reader risk removed per diff size. Each is an
  independent PR that never rides with feature work. Put the lint-posture
  decision (adopt, adapt, or reject the baseline) first and mark it as the
  owner's decision, with a recommendation.

## 6. Report
Write the report where the requester says, else
`docs/audits/YYYY-MM-DD-python-style-assessment.md` in the target repo. It
contains the baseline, the scorecard, the tricky-code inventory, the work
order, and an explicit "not examined / not measured" list. No normalization
record: that belongs to the lane that makes changes.
