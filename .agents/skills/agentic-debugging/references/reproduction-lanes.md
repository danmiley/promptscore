# Reproduction Lanes

Reproduction is a stop-gate: no instrumentation analysis is meaningful until you know how the fault will be made to fire and where its evidence will land. Choose one of three lanes, record it in the ledger, and bind verification to the same lane — whoever reproduced the bug confirms the fix.

## Lane 1 — Agent-Driven (preferred)

The fault reproduces under a command the agent can run: a test, a CLI invocation, a headless run. Always try to reach this lane; it makes the whole loop autonomous and repeatable.

Make the repro **minimal and deterministic** before instrumenting:

- Seed all RNG (`StdRng::seed_from_u64(...)`, fixed seeds through config/env).
- Serialize test execution: `cargo test -- --test-threads=1`, or `cargo nextest run -j1`.
- Fix inputs: smallest fixture that still fails; pin timestamps/locale/env.
- Fixed-`dt` stepping for sim/game loops: drive the loop with a constant timestep and a scripted input sequence instead of wall-clock and live input.
- `RUST_BACKTRACE=1` (or `full`) and a pinned `RUST_LOG` level so runs are comparable.
- Flaky tests: `cargo nextest run --retries N` to measure the failure rate before and after; a fault that fires 1-in-20 needs enough trials to distinguish "fixed" from "lucky".

Record in the ledger the exact command, its failure signature, and (for flaky faults) the observed failure rate.

## Lane 2 — Human-Driven Handoff

The fault needs GUI interaction, a device, or manual timing the agent cannot drive. The agent instruments; the human reproduces; the agent analyzes. Script the handoff precisely — the user should never have to guess what you need:

1. Install probes (see `instrumentation-menu.md`), confirm the build compiles, and state which build/profile the user must run.
2. Give the user a short numbered script: launch X, perform steps Y, watch for symptom Z, then stop the app (or say "done").
3. Tell the user where evidence lands (the session evidence file) and that they need not read or send it — you will.
4. On their signal, analyze via filtered reads only. If evidence is inconclusive, refine probes and ask for one more pass; batch probe changes so the user's passes are few.

Verification in this lane is the user re-running the same script against the fixed build and confirming the symptom is gone. Do not declare victory on your own.

## Lane 3 — Armed-and-Waiting

For intermittent faults nobody can summon on demand: install probes, let the user work normally, analyze whenever the fault finally fires.

Probes parked in a working tree must be **safe to leave**:

- Compiled out of release builds: gate behind `#[cfg(any(debug_assertions, feature = "debug-probe"))]` or equivalent.
- Bounded evidence growth: emit on state transitions or ring-buffer/flush-at-exit counters, not per-frame spam; if the file can grow unbounded, add size-triggered rotation or a hard cap.
- Zero behavioral footprint at the fault's sensitivity level (see observer-effect rules in `instrumentation-menu.md`).
- Recorded in the ledger with an explicit "armed" status and the marker list, so any future session (or the zero-residue check) knows probes are deliberately outstanding.

When the fault fires, treat the evidence file as the reproduction and proceed to collect/localize. Verification: the fix ships with the probes still armed (or re-armed) until the fault's historical recurrence interval passes cleanly, then clean up.

## Regression Fast-Path (before any instrumentation)

"It used to work" changes the problem shape: temporal bisection is usually cheaper than spatial instrumentation.

1. Confirm a good commit: check out a plausibly-good revision and run the repro.
2. Script the repro as an exit-status oracle (0 = good, 1–124 = bad, 125 = skip):

```sh
#!/bin/sh
# bisect-oracle.sh — exit 0 if good, 1 if bad, 125 if unbuildable
cargo build --quiet 2>/dev/null || exit 125
cargo test --quiet failing_test_name 2>/dev/null
```

3. `git bisect start <bad> <good> && git bisect run ./bisect-oracle.sh`
4. A culprit commit collapses the hypothesis space: hypotheses now concern *that diff*. Record the culprit in the ledger and proceed — often straight to a confirmed hypothesis with one targeted probe.

If the repro is flaky, wrap the oracle in N trials and threshold, or bisect on a deterministic reduction of the fault first. If bisect is impractical (history rewritten, env drift), fall back to the normal lanes but keep the culprit-window note in the ledger.
