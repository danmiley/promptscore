# The Tricky-Code Gate

"Tricky" means any construct this skill marks as gated, plus anything a
reviewer would need a debugger, `inspect`, or a REPL session to follow.

Gated constructs: metaclasses; `__init_subclass__` or decorator-driven
registries; decorators that change a function's signature, return type, or
call count; descriptors and `__set_name__`; `__getattr__` / `__getattribute__`
on modules or classes; `__class_getitem__` beyond `Generic`; `exec`, `eval`,
`compile`, `importlib` dynamic imports of computed names; monkeypatching
outside tests; `sys.settrace`, `sys.setprofile`, frame inspection; `TypeVar`,
`ParamSpec`, `TypeVarTuple`, or overload sets used for one caller; C
extensions, `ctypes`, `cffi`; hand-written asyncio protocols, transports, or
event loops; `threading` primitives beyond `Lock`, `Event`, and `Queue`
(CONC-10); `numpy` stride
tricks, `as_strided`, `einsum` encoding an algorithm; vectorized or
`itertools` pipelines whose steps a reader cannot name; `__slots__` with
multiple inheritance; `pickle` custom reducers; `functools.singledispatch`
towers spanning modules; mixins (TYPE-8); `numpy` `out=` parameters
(DATA-6); mixing concurrency models in one call path (CONC-2). This list is
the single inventory the audit lane reads; a topical rule that gates a
construct adds it here.

Tricky code is permitted. "I can hold it in my head", "it is fewer lines",
and "it is more Pythonic" are never criteria. All of the following hold, and
the answers are written at the site.

Contents: [Criteria](#criteria-all-required) ·
[Mandatory comment block](#mandatory-comment-block) ·
[Worked example: vectorized hot path](#worked-example-a-vectorized-hot-path-that-passes) ·
[Worked example: registry](#worked-example-a-registry-that-passes) ·
[Patterns that almost never clear the gate](#patterns-that-almost-never-clear-the-gate)

## Criteria (all required)
1. **A plain version was written first, or shown infeasible.** The boring
   dialect (a function, an explicit loop, a dataclass, an `if` chain) was
   attempted. Either it is in the diff as the twin (criterion 5) or the
   comment says concretely why it cannot exist: measured cost, an external
   API or framework hook that demands the shape, a library that only exposes
   the vectorized path.
2. **Prior art was searched.** The standard library or a maintained
   dependency already in `pyproject.toml` does not already provide it. Name
   what was checked (`functools`, `itertools`, `dataclasses`, `contextlib`,
   `typing`, `shapely`, `numpy` are the usual suspects).
3. **The benefit is named and, where quantitative, measured.** "Faster" needs
   an A/B number on the target host with the command. "Safer" names the bug
   class made impossible. "Smaller" names the duplication removed.
4. **It is contained.** The construct lives in one module or one class behind
   a boring API. Callers see ordinary functions with typed signatures.
5. **A plain twin exists.** A readable reference implementation kept under
   `tests/` (or as a `_plain` sibling imported only by tests) and used as the
   oracle for a `hypothesis` property test; or, for typing tricks, a doc
   example showing the concrete signature a reader would have expected, plus
   a `pyright` negative test if compile-time rejection is the point. When
   criterion 1 shows the plain version cannot exist, the contract tests named
   under HOW TO VERIFY are the oracle, and the comment says so.
6. **It is commented for the reader's level, not the author's.** The block
   below is mandatory and complete.
7. **It is marked so review can find it.** `# TRICKY:` on the first line of
   the block or item; the change description lists every `TRICKY` site.
8. **A removal path is stated** where one exists: the condition under which
   the plain version could replace it (an interpreter speed-up, a library
   gaining the API, a relaxed contract, a dropped input-size ceiling).

## Mandatory comment block
Copy from `assets/tricky-comment-template.txt`:

```python
# TRICKY: <one sentence: what is unusual here>
#
# WHY NOT THE PLAIN VERSION:
#   <what the boring version was, and the concrete reason it was rejected:
#    measured cost with command and host / framework hook / library-only
#    path>
#
# HOW TO READ IT:
#   <2 to 6 lines walking a reader through the construct in order; name the
#    types, the dynamic attributes, or the array shapes they will see and
#    what each is>
#
# INVARIANTS:
#   <what must stay true for this to remain correct; who maintains it>
#
# HOW TO VERIFY:
#   <the test or property that fails if this breaks; the oracle twin>
#
# REMOVE WHEN:
#   <the condition under which the plain version becomes acceptable, or
#    "no known path">
```

The block describes reasoning, not syntax.

## Worked example: a vectorized hot path that passes
```python
# TRICKY: quantise every vertex of a layer in one numpy expression instead
# of a per-vertex loop.
#
# WHY NOT THE PLAIN VERSION:
#   `quantise_plain` (tests/oracles/quantise_plain.py) loops over each ring
#   and rounds with `round(x, decimals)`. On the panorama layer (543k
#   vertices) it measured 41x slower: `uv run pytest tests/bench --benchmark-
#   only -k quantise`, host arm64 laptop, Python 3.12.13, 2026-09-20.
#
# HOW TO READ IT:
#   `coords` is an (N, 2) float64 array of all ring vertices concatenated;
#   `offsets` marks where each ring starts. `np.round` rounds both columns
#   at once; `np.diff(..., axis=0)` finds consecutive duplicates created by
#   rounding, and the boolean mask drops them. Ring boundaries are re-derived
#   from `offsets` after the drop.
#
# INVARIANTS:
#   Every ring has at least 4 vertices before and 3 after the drop; the
#   caller (`areas.polygons`) guarantees closed rings. Shared vertices
#   between abutting polygons round identically because they are the same
#   float64 values (design rule G5).
#
# HOW TO VERIFY:
#   tests/test_quantise.py::test_matches_plain_oracle (hypothesis over ring
#   sets, decimals 0..4).
#
# REMOVE WHEN:
#   Layer sizes drop below ~10k vertices or shapely gains set_precision with
#   duplicate collapse we can call directly (check on each shapely bump).
```

## Worked example: a registry that passes
```python
# TRICKY: third-party theme packages add emitters through the
# `tessellate.emitters` entry-point group, loaded by `load_emitters()`.
#
# WHY NOT THE PLAIN VERSION:
#   The plain version is the static table `BUILTIN_EMITTERS` in
#   `emit/__init__.py`, and it stays: it is the whole registry for built-in
#   themes. The plugin contract in docs/designs/... section 6 requires
#   packages we do not own to add emitters without a patch here, which a
#   static table cannot satisfy. Prior art: `importlib.metadata.entry_points`
#   (stdlib); no framework dependency added.
#
# HOW TO READ IT:
#   `load_emitters()` is called once, from the CLI entry point, never at
#   import. It starts from `BUILTIN_EMITTERS`, then reads the entry-point
#   group and imports each named class (a dynamic import of a computed name,
#   which is why this is gated). Nothing registers itself on import (META-6,
#   MOD-6 hold).
#
# INVARIANTS:
#   Names are unique; a plugin name that collides with a built-in or another
#   plugin raises `EmitterConflictError` from `load_emitters()`, naming both
#   distributions. A plugin that fails to import raises with its entry-point
#   name; the built-ins still load in a process that has no plugins.
#
# HOW TO VERIFY (the oracle, per criterion 5: the plain table is the twin):
#   tests/test_emitters.py::test_no_plugins_equals_builtin_table,
#   ::test_plugin_added_from_entry_point (fake distribution on sys.path),
#   ::test_name_collision_raises, ::test_import_has_no_side_effects.
#
# REMOVE WHEN:
#   Third-party themes are dropped from the contract.
```

## Patterns that almost never clear the gate
Metaclasses for ordinary classes; decorators that swallow exceptions;
`**kwargs` pass-through as an API; `getattr` dispatch on user strings;
`exec` to build classes or functions; `__getattr__` to make a dict look like
an object; `Generic` machinery for one type; a `Protocol` with one
implementer; "clever" comprehensions that replace a ten-line loop; `lambda`
assigned to a name; monkeypatching a library at import time; caching
decorators on functions with mutable arguments; threads without a queue.

Anything that fails a criterion is rewritten in the boring dialect. The gate
is deliberately expensive; the cost is the point.
