# Control Flow, Naming, Modules

Rule IDs are stable for citation. *(Canon)* marks a rule the community
already enforces; *(Skill)* marks this skill's own bar; *(Route)* points to
another skill. The repo's own configuration outranks this file.

Contents: [FLOW](#function-shape-and-control-flow-flow) ·
[NAME](#naming-and-vocabulary-name) ·
[MOD](#modules-packages-visibility-imports-mod) ·
[FMT](#formatting-fmt)

## Function shape and control flow (FLOW)
- **FLOW-1** *(Skill)* One function, one idea, one level of abstraction. If
  the docstring needs "and", split it.
- **FLOW-2** *(Canon: "Push Ifs Up And Fors Down")* Conditions go to the
  caller, loops go to the callee. A function that both decides and iterates
  is usually two functions.
- **FLOW-3** *(Canon: PEP 8, ruff `RET`, `SIM`)* Guard clauses and early
  return over nested `if`. `if x: return a` then the body, not
  `if not x: ...big body... else: return a`.
- **FLOW-4** *(Skill)* Nesting flag: three nested blocks inside a function
  body (loop, `if`, `with`, `try` each count; the `def` itself does not,
  which is also ruff's count) is a review prompt; four is a rewrite. With
  ruff's recipe below, `max-nested-blocks = 3` lists the rewrites and `2`
  lists the review prompts. Its ruff rule, `PLR1702`, is preview-only (ruff 0.14 and 0.15), so
  under the no-preview rule (TOOL-2) the baseline's `max-nested-blocks` key
  configures nothing yet; it takes effect when ruff stabilizes the rule. To
  measure at review time:
  `ruff check --preview --select PLR1702 --config "lint.pylint.max-nested-blocks = 3"`.
- **FLOW-5** *(Skill; ruff `PLR0915`, `PLR0912`)* Length flag: aim under 40
  lines; 80 is a review flag. The mechanical counter is `PLR0915`, which
  counts statements, not lines: the baseline's `max-statements = 50` is the
  review flag and 25 is the aim. Measure either with `--select PLR0915` and
  an inline `--config "lint.pylint.max-statements = <n>"` (TOOL-5); without
  the `--select`, a repo that does not enable `PL` reports zero.
- **FLOW-6** *(Skill; ruff `PLR0913` and `FBT001`-`FBT003` as review
  probes)* More than five parameters is a prompt to introduce a dataclass or
  split the function. Keyword-only (`*,`) for any boolean or optional
  parameter. The baseline ignores `PLR0913` and does not select `FBT`,
  because this is a review prompt, not a gate; measure it with TOOL-5's
  recipe.
- **FLOW-7** *(Skill)* No expression-oriented cleverness at statement level:
  no `x and do_thing()`, no conditional expression that spans lines, no
  walrus except in a `while` header or a comprehension filter that would
  otherwise compute twice.
- **FLOW-8** *(Skill)* Boolean logic beyond two operators gets a named local
  (`is_visible = in_frame and not culled`).
- **FLOW-9** *(Skill)* No out-parameters. Return a value, a tuple with named
  fields, or a dataclass; never mutate an argument to communicate a result.
- **FLOW-10** *(Skill)* Retry, timeout, fallback, and cancellation are visible
  in the function that owns them, named as such, not hidden in a decorator or
  a helper the reader must open.
- **FLOW-11** *(Skill; `match` is PEP 634)* `match` for structural dispatch on enums,
  tagged dataclasses, or sequence shapes; `if`/`elif` for two or three
  conditions. Never `match` on strings from outside without an `Enum` parse
  first.

## Naming and vocabulary (NAME)
- **NAME-1** *(Canon: PEP 8; ruff `N`)* `CapWords` for classes and type
  aliases, `snake_case` for functions, methods, variables, and modules,
  `UPPER_SNAKE` for module constants, `_leading` for internal.
- **NAME-2** *(Skill)* Names are domain nouns and verbs, not types or
  mechanisms: `roads`, not `road_list` or `data`; `quantise`, not `process`.
- **NAME-3** *(Skill)* Single letters only where universal: `i`, `j` in
  short index loops, `x`, `y` for coordinates, `f` for a file handle inside
  a `with`. Never `l`, `O`, `I` (ruff `E741`).
- **NAME-4** *(Skill)* Abbreviations only when they are the domain's own
  (`bbox`, `crs`, `svg`, `aabb`); never invented to save characters.
- **NAME-5** *(Canon)* Do not repeat the module or class in the member name:
  `frame.width`, not `frame.frame_width`; `roads.chunk()`, not
  `roads.chunk_roads()`.
- **NAME-6** *(Skill)* Booleans read as predicates (`is_closed`,
  `has_holes`, `should_cull`); never `flag`, `ok`, `done` without a subject.
- **NAME-7** *(Skill)* A name never hides blocking work, I/O, network, or
  mutation. `load_tiles()` may hit disk; `tiles` as a property may not. A
  function that mutates its receiver is a verb (`sort`), one that returns a
  new value is a participle or noun (`sorted`, `chunks`).

## Modules, packages, visibility, imports (MOD)
- **MOD-1** *(Skill)* A module is one concept with one public story. Its
  docstring says what it owns in one or two sentences. Under ~400 lines is
  the comfortable range; a module that needs section banners is two modules.
- **MOD-2** *(Skill)* `src/<pkg>/` layout; every package has `__init__.py`;
  `__init__.py` re-exports the public names with `__all__` and holds no
  logic. Internal helpers are `_prefixed` and not re-exported.
- **MOD-3** *(Canon: PEP 8; ruff `F403`, `I001`)* No `from x import *`.
  Imports at the top, sorted by ruff's isort, grouped stdlib / third-party /
  first-party. A function-level import only to break a cycle or defer an
  expensive optional dependency, with a comment saying which.
- **MOD-4** *(Route)* File and package size thresholds, hotspot detection,
  and split decisions belong to `refactoring-governance`.
- **MOD-5** *(Skill)* Do not split code merely to reduce line counts. Split
  on ownership and change frequency.
- **MOD-6** *(Skill)* Import-time work is configuration only: constants,
  dataclass and enum definitions, logger creation. No I/O, no network, no
  environment reads, no registry side effects at import (see `META-6`).
- **MOD-7** *(Skill)* Relative imports inside a package (`from .frame import
  Frame`) or absolute from the package root; never `sys.path` manipulation in
  library or application code.

## Formatting (FMT)
- **FMT-1** *(Canon: `ruff format`; PEP 8 sets 79 and lets a team agree up
  to 99)* `ruff format` defaults, line length 88. A `[tool.ruff] line-length` override only for a project-wide,
  stated reason.
- **FMT-2** *(Canon)* Code must read in plain text: no alignment that depends
  on a font, no trailing-comma tricks to steer the formatter, no `# fmt: off`
  without a reason (tables of literal data are the usual one).
