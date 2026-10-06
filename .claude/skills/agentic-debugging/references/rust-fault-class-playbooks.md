# Rust Fault-Class Playbooks

Each playbook names the fault shape, the discriminating evidence that separates its common causes, and the tools that pay. Playbooks refine the loop's hypothesize/instrument gates; they do not replace them. Perf-shaped findings route to `rust-perf-assessment`/`rust-gpu-perf` after localization; harness/test contracts to `rust-test-harness`.

## Panics, `unwrap`, and Error Propagation

- First evidence is free: `RUST_BACKTRACE=full` on the repro. Frame the panic site vs. the *fault* site — the `unwrap()` that fired is rarely the bug.
- Discriminate "value legitimately absent" vs. "value corrupted upstream": probe the producer of the `None`/`Err` with the input that made it decline, not the consumer that panicked.
- `Result` chains that swallow context: temporary marked probe on each `?` boundary along the path, logging the error variant — locates where a typed error degrades into a generic one.
- Promote: the confirmed precondition becomes a `debug_assert!` or a typed error with context at the producer.

## Async / Tokio Deadlock and Cancellation

- Hang ≠ deadlock: first discriminate starved (task never polled), blocked (sync mutex/blocking call on the runtime), or wedged (circular await). `tokio-console` (or `tracing` spans per task) shows which.
- Discriminating probes: marked `tracing` spans at task spawn/entry/exit with task IDs; a watchdog task that dumps "tasks alive + last checkpoint" JSONL on a timer — the missing checkpoint names the wedged task.
- Classic causes to hypothesize: `std::sync::Mutex` held across `.await`; blocking I/O on a worker thread pool sized 1; two tasks each awaiting the other's channel with bounded capacity (probe: channel depth at send/recv); a `select!` arm cancelling a future that holds a guard.
- Cancellation bugs: probe `Drop` impls of guards/futures along the path (marked `eprintln!` in `drop`) to see what is being cancelled and when.

## Data Races and `Send`/`Sync` Misuse

- Symptom shape: nondeterministic corruption, counts that drift, "works with `--test-threads=1`". That last flip **is a discriminating experiment** — run it both ways and record both outcomes.
- Do not print-probe the hot path (observer-effect rules): use atomic counters flushed at exit, or go straight to ThreadSanitizer: `RUSTFLAGS="-Zsanitizer=thread" cargo +nightly test --target <triple>` (nightly; rebuild std with `-Zbuild-std` when required).
- `unsafe` in the suspect path → Miri first (`cargo +nightly miri test`): catches UB, aliasing violations, and uninitialized reads deterministically, no timing luck needed.
- Interior-mutability hypotheses (a `RefCell` double-borrow across a callback, an `Arc<Mutex>` with lock dropped too early): encode as `debug_assert!` on borrow state or lock-holder ID.

## Borrow/Lifetime-Driven Logic Errors

- The compiler accepted it, so the bug is semantic: a clone where a shared mutation was intended, a shadowed binding, a stale snapshot captured by a closure, an iterator invalidated by an inner mutation through a second path.
- Discriminating probe: identity, not just value — log the *address* (`{:p}`) or a generation counter of the structure both paths believe they share. Two addresses = accidental clone confirmed in one reading.
- Stale-snapshot hypotheses: probe capture time vs. use time with a version stamp on the source data.

## FFI, `unsafe`, and GPU-Bridge Faults (Metal / `wgpu`)

- Boundary discipline: probe both sides of the boundary with the same session/tag so the evidence file interleaves — Rust-side (marked JSONL) and foreign-side (the API's own validation layer).
- GPU lane: enable the backend's validation (Metal API validation / wgpu validation + `RUST_LOG=wgpu_core=warn`) before authoring custom probes — most encoder/lifetime hazards (using a resource after submit, dropped texture still bound, mismatched pass descriptors) are caught by validation with exact object labels. Label every resource; unlabeled handles make validation output useless.
- CPU↔GPU divergence hypotheses: readback probe — hash or checksum the buffer on the CPU side before upload and after readback at a marked sync point; one comparison discriminates "bad data in" from "bad kernel".
- ASan for FFI memory faults: `RUSTFLAGS="-Zsanitizer=address" cargo +nightly test --target <triple>` when the foreign side may write out of bounds.
- Hybrid Rust↔web apps: evidence spans the bridge — pair the Rust-side session probes with browser-side capture via `playwright-browser-qa`/`playwright-interactive`, tagging both streams with the same session ID so they merge on timestamps.

## Float and Nondeterminism Faults

- First discriminate *sources* of nondeterminism with cheap experiments, one variable at a time: fixed seed (RNG), `--test-threads=1` (scheduling), pinned `dt` (frame timing), same profile (opt-level float differences), same machine (target features / FMA).
- Debug vs. release float divergence is real: contraction (FMA), vectorization order, and `debug_assertions`-gated code paths all change results. Reproduce in the profile where the bug lives.
- Discriminating probe for drift in a sim loop: checksum the whole state per tick (flushed at exit as JSONL, one record per N ticks), run twice, diff the checksums — the first divergent tick localizes the fault temporally; then bisect spatially within that tick's systems.
- Accumulated-error vs. logic-fork hypotheses: drift that grows smoothly is accumulation; a step change is a branch taken differently — the checksum series discriminates.

## Choosing a Playbook

Classify by the symptom's *shape* (panic, hang, corruption, drift, boundary), not by where you suspect the code is wrong — the playbook then tells you which cheap experiment splits the space before any code-reading conviction hardens into a favorite hypothesis.
