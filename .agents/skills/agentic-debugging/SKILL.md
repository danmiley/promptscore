---
name: agentic-debugging
description: "Use when a program misbehaves and the cause is not yet proven: bugs, regressions ('it used to work'), panics, crashes, hangs, deadlocks, flaky tests, 'works sometimes', heisenbugs, wrong output, or any request for 'debug mode'. Enforces a stop-gated verify-before-fix loop: hypotheses, targeted instrumentation, runtime evidence, then a minimal fix and mechanical probe cleanup. Rust-biased playbooks; language-neutral loop. Not for perf tuning (use rust-perf-assessment/rust-gpu-perf), test-harness design (rust-test-harness), or browser E2E authoring (playwright-browser-qa)."
license: MIT
metadata:
  version: "1"
  track: addon
  model-posture: high-reasoning
---

# Agentic Debugging
## Purpose
Debug by evidence, not pattern-matching. The default LLM failure mode is editing code the moment a symptom looks familiar. This skill forbids that: no fix until a written hypothesis has been confirmed by runtime evidence collected from a reproduction of the fault.

## Scope
- The stop-gated debugging loop below, for faults in target programs (any language; Rust worked through in depth).
- Hypothesis ledger management, reproduction-lane selection, probe instrumentation, evidence collection/analysis, fix verification, mechanical cleanup, and promotion of durable findings.

## Out of Scope
- Perf capture/compare/gate methodology (`rust-perf-assessment`, `rust-gpu-perf`); hand perf-shaped faults off after localization.
- QA matrix/gate/fixture/report contract ownership (`rust-test-harness`); this skill *feeds* it (promoted regression tests, sibling JSONL evidence).
- Browser-E2E authoring policy (`playwright-browser-qa`); compose with it for browser-side evidence in hybrid apps.
- General test authoring; observability of LLM/agent apps themselves.

## Use With Other Skills
- `rust-test-harness` for regression lanes after a fix and as the promotion target for durable tests.
- `rust-perf-assessment` / `rust-gpu-perf` when the localized cause is performance-shaped.
- `playwright-browser-qa` / `playwright-interactive` for evidence on the web side of a Rust↔web bridge.
- `refactoring-governance` for any refactor appetite the fix stage surfaces; the fix itself stays minimal.
- `agent-cli-tools` for selecting/verifying debug tooling (nextest, jq, sanitizer runners).

Conflict precedence:
1. `rust-test-harness` for QA matrix/gate/fixture/report contracts.
2. `rust-perf-assessment` for perf capture/compare/promote/gate methodology.
3. `rust-gpu-perf` for runtime loop/perf-smoke mechanics.
4. `playwright-browser-qa` for browser-E2E strategy and authoring policy.
5. `agentic-debugging` for the debugging loop, probes, evidence, and cleanup discipline.
6. `refactoring-governance` for refactor scoring and stopguards.

## The Loop (stop-gated)
Each stage is a stop-gate: do not advance without its exit evidence. At any moment you must be able to state the current gate, the live hypothesis set, and the observation that moves you forward. All durable state lives in the hypothesis ledger file, not chat.

1. **Frame.** Exact symptom, expected vs. observed, blast radius, classification (deterministic vs. flaky; new vs. regression). Initialize the ledger from `assets/hypothesis-ledger-template.md` (or `scripts/ledger_init.sh`). Regression fast-path: if it used to work, attempt `git bisect run` with a scripted repro *before* instrumenting.
2. **Reproduce.** Pick a lane and record it: **agent-driven** (preferred; minimal, deterministic command), **human-driven** (agent instruments, user reproduces, agent analyzes), or **armed-and-waiting** (intermittent faults; probes parked safely while the user works). See `references/reproduction-lanes.md`.
3. **Hypothesize.** 3–6 distinguishable, falsifiable causes, ranked by likelihood × cost-to-test; each names the concrete runtime observation that confirms or refutes it. Prefer probes that split the hypothesis set.
4. **Instrument.** Minimal probes, each wrapped in unique `POLYDBG` session markers and tagged with its hypothesis ID, emitting one structured JSONL record per event to a dedicated evidence file. Untagged probes are banned. See `references/instrumentation-menu.md`.
5. **Collect.** Run (or hand off) the repro. Read evidence only through filters — grep on hypothesis tags, `tail`, `jq` — never the raw file wholesale. Update each hypothesis: confirmed / refuted / needs-better-probe.
6. **Localize.** Narrow to the implicated line/branch/state transition; bisect spatially or temporally when ambiguous. Loop 3–6 until exactly one hypothesis survives with positive evidence.
7. **Fix.** Only now. Minimal change, explicitly tied to the confirmed hypothesis in the ledger. No opportunistic refactoring.
8. **Verify.** Re-run the same lane that reproduced the fault; the party who reproduced confirms (human-driven lane: the user, before you declare victory). Run the surrounding regression lane where a harness exists.
9. **Clean up.** Only after verification. Run `scripts/probe_cleanup.sh`, then the zero-residue check; show its passing output.
10. **Promote.** Graduate durable invariants to `debug_assert!`, a harness regression test, or an opt-in telemetry counter — then remove the ad-hoc probe. Record root cause and lesson in the target's engineering log / repo memory if present.

## Evidence-Hygiene Hard Rules
- Probes write to a **dedicated evidence file** in a git-ignored path (default `dist/debug/<session>/evidence.jsonl`; use the target's existing ignored scratch/report root). Never to the agent's own stdout/stderr.
- One structured JSONL record per probe event, carrying the session ID and hypothesis tag.
- Read evidence **only through filters** (grep/jq/tail on markers and tags). Never cat the whole file into context.
- Every probe line names the hypothesis it discriminates; scattershot logging is banned.
- Summary artifacts go under `dist/reports/debug/`; the live evidence file stays out of version control.

## Reference Routing
- Ledger format, gate rules, ranking/falsification, resuming after context loss: `references/hypothesis-ledger-and-stopgates.md`
- Reproduction lanes, determinism recipes, human handoff script, `git bisect` fast-path: `references/reproduction-lanes.md`
- Probe catalog, marker/tag conventions, observer-effect rules, cleanup contract: `references/instrumentation-menu.md`
- Rust fault-class playbooks with discriminating evidence: `references/rust-fault-class-playbooks.md`
- JSONL schema, artifact placement, filtered reads, promotion paths: `references/evidence-artifacts-and-promotion.md`
- Host capability wiring (background processes, hooks, subagents, native debug modes): `references/host-integration-notes.md`

## Script Entrypoints
- `scripts/ledger_init.sh` — stamp a new session ledger + evidence paths.
- `scripts/evidence_run.sh` — run a repro command, capture probe JSONL, emit the summary artifact.
- `scripts/probe_cleanup.sh` — remove marker-delimited probes; `--check` is the zero-residue scan that fails on any survivor (usable as a CI/pre-commit guard).

## Validation
- After cleanup: `scripts/probe_cleanup.sh --check` passes (zero residue) and the target's test/regression lane is green.
- The ledger shows every hypothesis resolved (confirmed/refuted) and the fix tied to the confirmed one.
