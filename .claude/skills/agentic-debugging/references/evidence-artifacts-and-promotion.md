# Evidence Artifacts and Promotion

Evidence is file-based, structured, filtered on read, and either promoted or deleted at session end. This reference owns the schema, the paths, and the promotion paths out of the session.

## Paths

- **Live evidence file**: `dist/debug/<session-id>/evidence.jsonl` by default. Must be a git-ignored path — if the target ignores a different scratch/report root (check its `.gitignore`), use that root instead and record the path in the ledger. Never commit evidence files; never write them into `dist/reports/`.
- **Ledger**: `dist/debug/<session-id>/ledger.md` (same ignored root).
- **Summary artifact**: `dist/reports/debug/<session-id>-summary.json` — the one durable, reviewable output, following the target's `dist/reports/` conventions. If the target has no reports root, skip the summary rather than inventing a tree.

## Probe Record Schema (JSONL)

One JSON object per line. This schema is a **sibling** of the `rust-test-harness` runtime-probe events contract: line-oriented JSONL that its pattern-based gate tooling can ingest unchanged (fail/warn regex over lines), but with hypothesis-scoped fields. Example record and field contract in `assets/evidence-record.schema.json`.

Required fields:

- `ts` — timestamp (RFC3339 or monotonic ms; be consistent within a session).
- `session` — the session ID from the ledger.
- `hyp` — hypothesis tag (`H1`…). Required; untagged records are banned.
- `probe` — probe ID (`p1`…), matching the code marker.
- `loc` — `file:line` of the probe site.
- `event` — short machine-matchable event name (`evict`, `tick-checksum`, `lock-acquired`).

Optional fields:

- `data` — object with the observation payload (keep values small; hash/checksum large state instead of embedding it).
- `level` — `info|warn|fail`, when a record should trip harness-style warn/fail pattern gates.

## Filtered-Read Discipline (hard rule)

Never read the evidence file wholesale — a debug session can emit far more than a context window holds, and flooding your own context with raw logs is the failure mode this skill exists to prevent.

Read through filters only:

```sh
grep '"hyp":"H2"' evidence.jsonl | tail -20          # one hypothesis, recent events
jq -c 'select(.hyp=="H2" and .event=="evict") | .data' evidence.jsonl | tail -5
jq -s 'group_by(.hyp) | map({hyp: .[0].hyp, n: length})' evidence.jsonl   # volume per hypothesis
tail -5 evidence.jsonl                                # did the run reach the end?
wc -l evidence.jsonl                                  # size before anything else
```

Start every analysis with counts (`wc -l`, per-tag counts), then drill into the smallest slice that answers the current hypothesis. Record the *filter command and its conclusion* in the ledger's Evidence column — pointers, not pasted output.

## Summary Artifact

Written by `scripts/evidence_run.sh` (or by hand at session end): session ID, repro lane, per-hypothesis record counts and final status, the confirmed hypothesis, fix reference (commit/diff summary), verification result, and cleanup check result. Machine-readable JSON so review tooling and future agents can consume the session outcome without the raw evidence.

## Promotion Paths (stage 10)

A probe that revealed a durable invariant graduates before cleanup deletes it:

1. **`debug_assert!`** — the confirmed precondition/invariant becomes a permanent debug-build assertion at the probe site. Unmarked, reviewed, committed with the fix.
2. **Regression test** — the repro becomes a test in the target's harness; route matrix/gate/fixture placement to `rust-test-harness` where installed, otherwise a plain `#[test]` beside the fix.
3. **Opt-in telemetry counter** — for faults only observable in long-running use (armed-and-waiting lane), promote the probe into the target's telemetry/diagnostics lane as a properly named, feature-gated counter or event — following the target's existing telemetry conventions, not the `POLYDBG` ad-hoc form.

Then remove the ad-hoc probe (cleanup contract in `instrumentation-menu.md`). Record the session outcome — root cause, fix, lesson — in the target's engineering log and repo memory (`docs/ai-memory/`) if those exist.
