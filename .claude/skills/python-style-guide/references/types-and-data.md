# Types and Data

## Types that help a reader, not hide from one (TYPE)
- **TYPE-1** *(Canon: PEP 484, 526; pyright strict)* Every public function,
  method, and dataclass field is annotated. Locals only when inference
  fails or the type is the point. Modern syntax: `list[int]`, `X | None`,
  `type Alias = ...` on 3.12.
- **TYPE-2** *(Canon: "Parse, don't validate")* Trust boundaries parse once
  into typed values: a `Path`, an `Enum`, a frozen dataclass, a `Decimal`.
  Downstream code takes the typed value and never re-checks a string.
- **TYPE-3** *(Canon: PEP 435; ruff `PLR2004`)* `Enum` (or `StrEnum`) over
  string constants and magic numbers for any closed set: layer kinds, line
  caps, profiles. Compare with `is` or `==` on the member, never on `.value`.
- **TYPE-4** *(Skill; the mechanism is PEP 557)* `@dataclass(frozen=True, slots=True)` for
  records. Fields typed; defaults immutable (`field(default_factory=list)`
  for mutable). `NamedTuple` only when tuple unpacking is the interface.
  Plain dicts as records only at the JSON edge, converted immediately.
- **TYPE-5** *(Skill)* Concrete before generic. A `TypeVar` appears with the
  second concrete instantiation; a `Protocol` appears when a caller that
  exists needs to accept a second implementation. `Generic[T]` on a class
  with one `T` in the codebase is a gated construct.
- **TYPE-6** *(Skill)* `Any` is a labelled decision: `x: Any  # json from
  overpass, parsed in acquire.parse`. `object` when you mean "anything, and I
  will not touch it". `cast` carries a comment naming why the checker cannot
  see it.
- **TYPE-7** *(Canon: PEP 544)* `Protocol` over ABC when the implementers do
  not share code; ABC when they inherit behaviour. Neither for one
  implementer.
- **TYPE-8** *(Skill)* Inheritance depth two is the comfortable maximum
  (`Emitter` → `SvgEmitter`). Mixins are gated. Composition (a field holding
  the collaborator) before inheritance.
- **TYPE-9** *(Skill)* `TypedDict` for JSON shapes that cross a boundary and
  are not worth a dataclass; never as an internal record type.
- **TYPE-10** *(Skill; ruff `PGH003`)* `# type: ignore` and `# pyright:
  ignore` carry the rule in brackets and a reason; a bare ignore is a defect.
- **TYPE-11** *(Skill)* Optional means absence is normal and the caller must
  branch. Do not return `None` for "error"; raise. Do not accept `None` to
  mean "use the default"; use a keyword default or a sentinel `Enum`.
- **TYPE-12** *(Skill)* Numeric types are explicit at boundaries: `float`
  versus `int` versus `Decimal`, `numpy` dtype named in a comment or a
  `NDArray[np.float64]` annotation, units in the name or docstring
  (`width_pt`, `radius_m`).

## Mutability and ownership (DATA)
- **DATA-1** *(Canon: ruff `B006`, `B008`)* No mutable default arguments;
  no function calls in defaults.
- **DATA-2** *(Skill)* Functions return new values and do not mutate their
  arguments. When mutation is the point, the function is a method on the
  owner, its name is a verb, and it returns `None` (the `list.sort`
  convention).
- **DATA-3** *(Skill)* Module-level mutable state (a cache dict, a registry
  list, a counter) has one named owner function that mutates it and a comment
  saying why it is not passed explicitly. Tests reset it through that owner.
- **DATA-4** *(Skill)* Copy at the boundary when a caller may mutate what you
  hand out or you may mutate what you were handed: `tuple(items)`,
  `dict(mapping)`, `frozenset`, `array.copy()`. Say so in one comment when
  the copy is a deliberate cost.
- **DATA-5** *(Skill)* Mutable dataclasses (`frozen=False`) are the exception
  and say why in the class docstring (builder pattern, accumulator).
- **DATA-6** *(Skill)* `numpy` arrays and `shapely` geometries: name whether
  a function returns a view or a copy, and whether it accepts arrays it will
  write into. `out=` parameters are gated.
- **DATA-7** *(Skill)* Iteration order is part of the contract wherever
  output is compared or hashed: sort explicitly (`sorted(..., key=...)`)
  rather than relying on dict insertion order of an upstream parser.
