# Safety and Security

MUST-grade rules first; the rest are the skill's hygiene bar.

- **SAFE-1** *(MUST; ruff `S602`, `S603`, `S607`)* `subprocess` runs with
  an argument list, never `shell=True` with interpolated input, and with an
  explicit executable path or a name resolved through `shutil.which`. Set
  `check=True` or inspect `returncode`; set `timeout` for anything that
  could hang. `S603` fires on any argument list that contains a variable,
  including this compliant shape (a pinned binary path from configuration);
  such a call carries `# noqa: S603  # <where each argv element comes from>`
  (TOOL-4). A literal constant list does not fire it.
- **SAFE-2** *(MUST; ruff `S301`, `S307`, `S102`, `S506`)* Never unpickle,
  `yaml.load` without `SafeLoader`, `eval`, or `exec` data from outside the
  process. JSON, TOML, and CSV with the standard library or a validated
  parser are the boundary formats.
- **SAFE-3** *(MUST)* Paths from outside the process are `Path` objects,
  resolved, and checked to stay under the intended root before use
  (`candidate.resolve().is_relative_to(root)`); no string concatenation to
  build paths; no `os.system`.
- **SAFE-4** *(MUST; ruff `S105`, `S106`)* Secrets come from the environment
  or a keychain at the boundary, live in one typed settings object, never
  appear in defaults, logs, exceptions, `repr`, or committed files. A
  `SecretStr`-style wrapper whose `repr` is redacted is the canon shape.
- **SAFE-5** *(MUST)* Network calls carry a timeout and a documented retry
  policy, verify TLS, and record what they fetched (URL, status, size,
  timestamp) when the result is cached or becomes evidence.
- **SAFE-6** *(Skill)* Trust boundaries parse once at the edge (`TYPE-2`):
  CLI arguments, environment variables, files, HTTP bodies, and subprocess
  output become typed values in one function per source, and the rest of the
  code never sees strings from outside.
- **SAFE-7** *(Skill)* Integer and float edges are explicit: `int(text)`
  and `float(text)` are wrapped with the `ValueError` handled; no silent
  `float('nan')`; comparisons of floats use a tolerance named in the code
  (`math.isclose` with the `rel_tol` stated) when equality is the intent.
- **SAFE-8** *(Skill; ruff `S108`, `PTH`)* Temporary files via `tempfile`
  with the directory scoped by a context manager; never a fixed path under
  `/tmp`; `pathlib` over `os.path`.
- **SAFE-9** *(Skill)* Dependencies are pinned by `uv.lock`, declared in
  `pyproject.toml` with a lower bound, and reviewed on add: licence,
  maintenance, transitive count. `pip-audit` before a release. A dependency
  with one call site that the standard library covers is removed.
- **SAFE-10** *(Skill)* Randomness for anything security-relevant uses
  `secrets`; `random` with a fixed seed is fine for reproducible fixtures and
  says so.
- **SAFE-11** *(Skill)* Resource lifetimes are `with` blocks: files,
  sockets, locks, temporary directories, database cursors. An object that
  needs explicit `close()` gets `__enter__`/`__exit__` or is wrapped in
  `contextlib.closing`.
- **SAFE-12** *(Skill)* C extensions, `ctypes`, `cffi`, and `numpy`
  `as_strided` are gated; when kept, the call site names the memory
  ownership and the shape or size invariant the C side assumes.
