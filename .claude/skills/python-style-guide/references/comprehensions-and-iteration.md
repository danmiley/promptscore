# Comprehensions, Generators, Iteration

- **ITER-1** *(Canon: PEP 202, 289)* Comprehensions and generator
  expressions are the idiom for one transformation over one iterable. They
  are not a way to hide an algorithm on one line.
- **ITER-2** *(Skill; ruff `C4`)* Budget: one `for`, at most one
  `if`, one expression without a conditional. A second `for` clause, a
  conditional expression in the element, or a nested comprehension is a
  `for` loop with named locals.
- **ITER-3** *(Skill; ruff `E731`)* `lambda` only as an inline `key=` or
  `default_factory=`. A `lambda` with a conditional, a call chain, or
  assigned to a name is a `def`.
- **ITER-4** *(Skill)* No `functools.reduce`, `map` / `filter` with `lambda`,
  or `itertools.accumulate` where a `for` loop with an accumulator says it
  in fewer mental steps. `sum`, `min`, `max`, `any`, `all` over a generator
  expression are fine.
- **ITER-5** *(Skill)* `itertools` chains of at most three calls, each
  named in a comment or an intermediate variable when the reader cannot name
  the step from the call alone (`groupby` needs its sort stated; `chain`,
  `islice`, `pairwise` rarely do).
- **ITER-6** *(Skill)* A generator function when the sequence is large,
  lazy, or infinite; a list when it is small and reused. The name or
  docstring says which (`iter_features` versus `features`).
- **ITER-7** *(Skill)* Generators do not do I/O or hold locks between
  yields without a comment. A `with` inside a generator closes only when the
  generator finishes or is closed: a consumer that breaks early leaves it
  suspended, and the resource open, until garbage collection. So a consumer
  that can stop early owns the cleanup: `with contextlib.closing(gen()) as
  it:`, or call `it.close()`; or offer a context-manager API instead of a
  bare generator.
- **ITER-8** *(Skill)* A pipeline that mixes filtering, mutation, fallible
  calls, and early exit is a `for` loop with guard clauses, not a
  comprehension with a helper that raises.
- **ITER-9** *(Canon; ruff `B905` for `zip`)* `for x in items` not `for i in
  range(len(items))` (no ruff rule covers this one; review catches it);
  `enumerate` when the index is needed; `zip(..., strict=True)` when the
  lengths must match.
- **ITER-10** *(Skill)* Vectorized `numpy` or bulk `shapely` operations are
  the plain version for array-shaped data in a hot zone, and a per-element
  loop is the plain version for a handful of items in a cold zone. Choosing
  the other one is a measured decision (review lane section 5), and the
  vectorized expression names each array's shape in a comment.
