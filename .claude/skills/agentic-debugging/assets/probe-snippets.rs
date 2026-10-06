// Probe snippet templates for agentic-debugging sessions (Rust).
// Replace <SID>, <PROBE>, <HYP>, <FILE:LINE>, <EVENT> before inserting.
// Every probe is wrapped in POLYDBG markers so `probe_cleanup.sh` can remove
// it mechanically; every record carries its hypothesis tag.
// This file is a template asset, not compiled code.

// --- 1. eprintln! JSONL probe (default; route stderr via evidence_run.sh) ---
// POLYDBG-BEGIN <SID> <PROBE>
eprintln!(
    r#"{{"ts":{},"session":"<SID>","hyp":"<HYP>","probe":"<PROBE>","loc":"<FILE:LINE>","event":"<EVENT>","data":{{"value":{:?}}}}}"#,
    now_ms(), value
);
// POLYDBG-END <SID> <PROBE>

// --- 2. Direct-append file probe (required for armed-and-waiting) ---
// POLYDBG-BEGIN <SID> <PROBE>
#[cfg(any(debug_assertions, feature = "debug-probe"))]
{
    use std::io::Write;
    if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open("dist/debug/<SID>/evidence.jsonl") {
        let _ = writeln!(f, r#"{{"ts":{},"session":"<SID>","hyp":"<HYP>","probe":"<PROBE>","loc":"<FILE:LINE>","event":"<EVENT>"}}"#, now_ms());
    }
}
// POLYDBG-END <SID> <PROBE>

// --- 3. tracing event probe (targets already using tracing; add a JSON file layer) ---
// POLYDBG-BEGIN <SID> <PROBE>
tracing::info!(session = "<SID>", hyp = "<HYP>", probe = "<PROBE>", loc = "<FILE:LINE>", event = "<EVENT>");
// POLYDBG-END <SID> <PROBE>

// --- 4. Executable hypothesis: debug_assert! (a firing assert is confirmed evidence) ---
// POLYDBG-BEGIN <SID> <PROBE>
debug_assert!(invariant_holds, "POLYDBG <SID> <PROBE> <HYP>: <falsifiable statement>");
// POLYDBG-END <SID> <PROBE>

// --- 5. Low-perturbation atomic counter, flushed at exit (timing-sensitive faults) ---
// POLYDBG-BEGIN <SID> <PROBE>
static PROBE_COUNT: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
// hot path: PROBE_COUNT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
// at exit:
// eprintln!(r#"{{"ts":{},"session":"<SID>","hyp":"<HYP>","probe":"<PROBE>","loc":"<FILE:LINE>","event":"count-flush","data":{{"n":{}}}}}"#,
//     now_ms(), PROBE_COUNT.load(std::sync::atomic::Ordering::Relaxed));
// POLYDBG-END <SID> <PROBE>

// --- helper (place once per session if the target lacks a clock helper) ---
// POLYDBG-BEGIN <SID> p0
fn now_ms() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}
// POLYDBG-END <SID> p0
