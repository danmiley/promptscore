# Config, Environment, and Non-Interactive Operation

## Precedence Model
One documented order, resolved once in `config.py`:
1. CLI flags
2. Environment variables (`<TOOL>_*`)
3. Config file (`--config <path>`, else `$<TOOL>_CONFIG`, else the platform
   default under `platformdirs`-style user config; TOML)
4. Built-in defaults

Expose the config-path override as both a flag and an environment variable
so integration tests can create a temp config per test and run in parallel
without touching the developer's real configuration. The override bypasses
the default search entirely.

`Settings` is a frozen dataclass; `load()` returns it plus an origins map
(`{"cache_dir": "env"}`) that `doctor` prints.

## Secrets and Credentials
- Read from the environment or the OS keychain at load time; never from a
  config file committed to the repo; never from a flag that would land in
  shell history.
- Redacted in `repr`, in `doctor`, and in every log line
  (`python-style-guide` SAFE-4).
- Absent credential under `--json` is a deterministic `auth` exit, not a
  prompt.

## Non-Interactive Safety Rules
- No command blocks for input unless an explicit flag asks for it
  (`--interactive`); under `--json` interactive paths are an error.
- Anything that could prompt (overwrite, delete, network consent) has a flag
  that decides it (`--force`, `--yes`, `--offline`).
- Missing required input fails deterministically with exit `2` and a message
  naming the flag or variable that would fix it.
- Network-touching commands honour `--offline` (or `<TOOL>_OFFLINE=1`) and
  fail with a `remote` exit rather than hanging; every request has a
  timeout.
- `doctor` and other diagnostics are read-only: they report whether output
  and cache directories are writable and what a real run would create, and
  they create nothing. The contract test asserts the tree is unchanged.

## Caches
- Cache location is a setting with an origin, printed by `doctor`.
- Cache keys are content hashes of the request (bbox + tags + endpoint
  version), never timestamps, so a recorded fixture can replace the network
  in tests.
- A cache miss under `--offline` is a `remote` exit with the key named.
