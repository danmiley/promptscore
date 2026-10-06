# agentic-debugging scripts

Installed into targets under `scripts/polymath/agentic-debugging/`. All scripts
are bash, not sh (`probe_cleanup.sh` uses process substitution), and are tested
against macOS system bash 3.2. Run them from the target repo root
(`ledger_init.sh` resolves its template from the installed skill lanes).

- `ledger_init.sh [--session <sid>] [--debug-root <dir>]` — stamp a new session
  ledger from `assets/hypothesis-ledger-template.md` into `dist/debug/<sid>/`.
- `evidence_run.sh --session <sid> [--debug-root <dir>] [--reports-root <dir>] -- <cmd...>` —
  run a repro command; probe JSONL lines (stderr lines carrying the session id)
  append to the session evidence file, everything else to `run.log`; writes
  `dist/reports/debug/<sid>-summary.json`.
- `probe_cleanup.sh --session <sid> | --all | --check [--list] [--allow-armed <sid>] [--root <dir>]` —
  remove `POLYDBG` marker-delimited probes; `--check` is the zero-residue scan
  (exit 1 on any survivor) usable standalone as a CI/pre-commit guard.

Evidence and ledger paths must be git-ignored in the target (default root
`dist/debug/`). Summary artifacts follow the target's `dist/reports/` conventions.
