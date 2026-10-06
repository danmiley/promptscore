# Instrumentation Menu

Probes exist to discriminate hypotheses — nothing else. Every probe is minimal, uniquely marked for mechanical cleanup, tagged with the hypothesis it tests, and chosen least-invasive-first.

## Marker and Tag Contract

Every probe block is wrapped in unique markers so cleanup is mechanical and verifiable:

```rust
// POLYDBG-BEGIN <session-id> <probe-id>
...probe code...
// POLYDBG-END <session-id> <probe-id>
```

- `<session-id>` matches the ledger; `<probe-id>` is unique within the session (`p1`, `p2`, …).
- Single-line probes may use one trailing marker: `// POLYDBG <session-id> <probe-id>`.
- Use the target language's comment syntax; the token `POLYDBG` itself is what the cleanup scan matches.
- Never hand-write probe code without markers, and never nest marker blocks.

Every probe **record** carries its hypothesis tag. Emit one JSON object per line to the session evidence file (schema in `evidence-artifacts-and-promotion.md`):

```rust
// POLYDBG dbg-20260706-a3 p2
eprintln!(r#"{{"ts":{:?},"session":"dbg-20260706-a3","hyp":"H2","probe":"p2","loc":"cache.rs:141","event":"evict","data":{{"gen":{},"key":{:?}}}}}"#, std::time::SystemTime::now(), generation, key);
```

Probe output goes to the **evidence file**, not the agent's own stdout. Simplest reliable wiring: run the repro through `scripts/evidence_run.sh`, which redirects the probe stream (stderr by default) into `evidence.jsonl`; or have probes open/append the file directly (`OpenOptions::new().append(true)`), which is required for the armed-and-waiting lane. Ready-made snippets: `assets/probe-snippets.rs`.

A probe line without a `hyp` tag is scattershot logging and is banned. If you want to "just see what's happening", write the hypothesis that observation would test — or admit you are at the hypothesize gate, not the instrument gate.

## Probe Catalog (least-invasive first)

1. **Marked `eprintln!` / `dbg!` JSONL probe** — default. Cheap to add, easy to reason about, high perturbation in hot paths (formatting + I/O + possible serialization of timing).
2. **Structured `tracing` span/field probe with a file writer** — when the target already uses `tracing`, add a marked span or `event!` with fields and a `tracing_subscriber` JSON file layer scoped to the session. Better for async: spans carry causality across awaits.
3. **`assert!` / `debug_assert!` as executable hypotheses** — encode the hypothesis as an invariant; a firing assertion is a confirmed observation with a backtrace. `debug_assert!` costs nothing in release.
4. **Feature-gated probe cfg** — wrap heavier probes in `#[cfg(any(debug_assertions, feature = "debug-probe"))]` so they compile out of release. Mandatory for armed-and-waiting probes.
5. **Counters flushed at exit** — atomic counters incremented in the hot path, one JSONL record written at process exit. Lowest perturbation; use for timing-sensitive faults.
6. **Debugger reasoning (`rust-lldb` / `rust-gdb`)** — when print-probing is too coarse: conditional breakpoints, watchpoints on a corrupted address, single-run state inspection. Use for "what exactly is in memory at this instant" questions; record findings as ledger evidence manually.
7. **Sanitizers / Miri** — not probes but whole-program oracles; see the fault-class playbooks for when each pays.

## Observer-Effect (Heisenbug) Rules

Instrumentation perturbs the program. Note each probe's perturbation risk in the ledger, and match probe class to fault class:

- **Suspected data race / timing fault:** `println!`/`eprintln!` acquire locks and serialize execution — they can *mask the race you are hunting*. Prefer atomic counters flushed at exit (catalog #5), `debug_assert!` on invariants, or ThreadSanitizer. If a probe makes the fault vanish, that is itself evidence: record it, and treat the probe's serialization as the discriminating variable.
- **Opt-level-sensitive faults (float behavior, UB manifestation):** debug and release profiles differ in float contraction, inlining, and how UB manifests. Reproduce in the profile where the bug lives; use a release build with `debug-assertions = true` and probe cfg features rather than switching to a debug build.
- **Allocation-sensitive faults:** probes that allocate (format strings, `String` building) can shift heap layout and hide memory bugs; prefer preallocated/static probe paths or sanitizers.
- **I/O-timing-sensitive faults:** file writes inside a tight loop change scheduling; buffer and flush at exit, or emit on transitions only.

## Cleanup Contract

- Cleanup happens **only after verification** (the verify gate is signed off in the ledger).
- Run `scripts/probe_cleanup.sh --session <session-id>` to remove every marker-delimited block, then `scripts/probe_cleanup.sh --check` to scan the tree for any surviving `POLYDBG` token. The check fails loudly on survivors — paste its passing output into the ledger log.
- The check is standalone-safe: wire it as a CI or pre-commit guard in the target if debug sessions are frequent (see `host-integration-notes.md` for optional host hook wiring).
- Anything a probe taught you that deserves to live goes through the promotion path (`evidence-artifacts-and-promotion.md`) **before** cleanup deletes it — promote, then remove the ad-hoc probe.
