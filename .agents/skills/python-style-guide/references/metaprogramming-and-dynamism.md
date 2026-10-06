# Metaprogramming and Dynamism

Python's dynamism is the main way a codebase becomes unreadable without
anyone deciding to make it so. The escalation ladder is the rule: each rung
is permitted only when the one below cannot do the job.

- **META-1** *(Skill)* Escalation ladder: a function → a class with methods
  → a plain decorator that wraps without changing the signature → a
  class-level hook (`__post_init__`, `__init_subclass__`) → a descriptor →
  a metaclass → `exec`/`eval`. Rungs from the decorator upward are gated
  past the first (a signature-preserving decorator such as `@cache`,
  `@contextmanager`, `@property`, `@dataclass` is canon and not gated).
- **META-2** *(Skill)* A decorator that changes what a function accepts,
  returns, or how many times it runs (retry, memoize with mutable args,
  argument injection, signature rewriting) is gated. When kept, it uses
  `functools.wraps`, is typed with `ParamSpec`, and the wrapped function's
  docstring says it is decorated and what that changes.
- **META-3** *(Skill)* Registries are explicit tables by default (`EMITTERS:
  dict[str, type[Emitter]]` in one module). `__init_subclass__` or decorator
  registration is gated and requires the plugin contract that demands it.
- **META-4** *(Skill; ruff `S307` for `eval`, `S102` for `exec`)* `eval`, `exec`, `compile`, and
  `importlib.import_module` on a computed name are gated and never take
  input from outside the process. `ast.literal_eval` for literals.
- **META-5** *(Skill)* `getattr(obj, name)` with a computed `name` is a
  dispatch table in disguise; write the table. `getattr` with a literal name
  and a default is fine. `setattr` on objects you do not own is
  monkeypatching (META-7).
- **META-6** *(Skill)* Import-time side effects are configuration only (see
  `MOD-6`). Nothing registers, connects, reads the environment, or mutates
  another module when imported. A package that must be imported for its
  side effects is a defect.
- **META-7** *(Skill)* Monkeypatching (`module.func = ...`, `mock.patch`
  outside tests, `setattr` on library objects) is gated in application code
  and canon inside tests via `pytest`'s `monkeypatch` fixture.
- **META-8** *(Skill)* `__getattr__`, `__getattribute__`, `__setattr__`, and
  module-level `__getattr__` are gated. The one canon use is a deprecation
  shim that warns and forwards, with the removal version in the message.
- **META-9** *(Skill)* `dataclasses` and `enum` are the canon record and
  closed-set mechanisms; hand-written `__init__`, `__eq__`, `__hash__`,
  `__repr__` are a review flag unless the docstring says why the dataclass
  form cannot express it.
- **META-10** *(Skill)* Dynamic class creation (`type(name, bases, ns)`,
  `types.new_class`) and metaclasses are gated and rare; a metaclass to
  enforce an interface is a `Protocol` plus `pyright`.
- **META-11** *(Skill)* `inspect`, frame walking, `sys._getframe`,
  `sys.settrace` are gated to tooling (debuggers, profilers, test plugins)
  and never in library or application paths.
- **META-12** *(Skill)* Overloads (`@overload`) exist to type a genuinely
  polymorphic public function. Overload sets used for one caller are gated
  (`tricky-code-gate.md`); usually the function should be two functions.
