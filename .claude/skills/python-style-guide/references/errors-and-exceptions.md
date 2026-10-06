# Errors and Exceptions

- **ERR-1** *(Canon: PEP 8; ruff `BLE001`, `E722`, `S110`)* Catch the
  narrowest exception the handler can actually handle. `except Exception`
  only at a process or request boundary that logs and re-raises or converts;
  never `except:`; never `except ...: pass`.
- **ERR-2** *(Skill; ruff `TRY`)* Raise the most specific built-in that fits
  (`ValueError`, `FileNotFoundError`, `KeyError`) or one package exception
  hierarchy rooted at `<Pkg>Error`. Message states what was expected and what
  was found, with the offending value or path.
- **ERR-3** *(Canon: PEP 3134; ruff `B904`)* Translate with `raise NewError(
  ...) from err` inside an `except`. Never lose the cause; never `from None`
  without a comment saying why the cause is noise.
- **ERR-4** *(Canon: ruff `S101`, `B011`)* `assert` states an invariant the
  code maintains and may be stripped by `-O`; it never validates input,
  never guards a side effect, and never has a message that would help a
  user. Input checks raise `ValueError` or `TypeError`. Under `python -O` an
  assert is removed entirely: `assert value > 0` guarding parsed input lets
  `-1` through, whatever its comment says.
- **ERR-5** *(Skill)* Every public function's docstring lists the exceptions
  a caller may reasonably catch under `Raises:`. Programming errors
  (`TypeError` from a wrong argument type) are not listed.
- **ERR-6** *(Skill)* `None` means "absence is normal" and the signature says
  `X | None`; an exception means "the operation failed". Do not return
  `None`, `-1`, `False`, or an empty container to signal failure.
- **ERR-7** *(Skill)* No exceptions for control flow across more than one
  frame: `StopIteration` inside a generator is the language's, a custom
  `Found` raised from three loops deep is not. Return early or restructure.
- **ERR-8** *(Skill)* Cheap invariants get an `assert` with a message
  naming the invariant; expensive ones are checked in tests, not in
  production paths.
- **ERR-9** *(Skill)* An error that reaches a user, a log, or a terminal is
  one line, names the operation, the target, and the cause, and never
  includes a secret, a full environment, or a traceback unless verbosity was
  requested. Tracebacks go to `logging.exception` at the boundary.
- **ERR-10** *(Skill)* Distinguish timeout, cancellation, validation, not
  found, and remote failure as separate exception classes when any caller
  handles them differently (the CLI exit-code map in `python-cli-app`
  depends on this).
- **ERR-11** *(Skill; ruff `TRY300`, `TRY301`)* `try` bodies are the one or
  two statements that can raise; the rest lives outside or in `else`. Never
  raise inside `try` to be caught by the same `except`.
- **ERR-12** *(Skill)* `contextlib.suppress` only for one named exception
  class the surrounding code has a reason to ignore, with the reason in a
  comment.
