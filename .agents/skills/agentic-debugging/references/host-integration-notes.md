# Host Integration Notes

The skill body is host-neutral and phrased by capability. This reference holds the per-host specifics; open it only when wiring a session to a concrete host. Facts below verified 2026-07-06; re-verify before relying on a detail that has had time to drift.

## Capability Rules (restated, host-neutral)

- If the host can run background processes, the agent may own long-running repros (servers, sim loops) and read evidence while they run.
- If the host cannot keep a process alive across turns, arm probes, hand the run to the user (human-driven lane), and analyze from the evidence file.
- If the host sandboxes network/device access, prefer file-based evidence handoff — the evidence file works in every sandbox that allows workspace writes.
- If the host supports parallel subagents/worktrees, independent hypotheses with expensive builds may be tested in parallel — one ledger remains authoritative; subagents report evidence pointers back to it.

## Claude Code

- Background Bash lets the agent keep a repro process (server, watcher) running across turns while reading filtered evidence — lane 1 works fully agent-driven even for long-running targets.
- Hooks: a Stop or pre-commit hook can run `scripts/probe_cleanup.sh --check` so no session ends or commit lands with live probes. **Optional wiring, never required** — offer it; do not install hooks unasked. (Decision: hook wiring stays documentation-only here; `adapters/claude.yaml` carries only metadata.)
- Subagents can test independent hypotheses in parallel git worktrees when builds are expensive; merge findings into the single ledger.

## Codex

- Discovers skills recursively; no lift step needed on install.
- Sandboxed execution may block network and device access — keep repros hermetic and rely on file-based evidence. Keep any session-local helper scripts POSIX-sh compatible.
- Long-lived background processes may not survive across turns; prefer bounded repro commands, or the human-driven lane for interactive targets.

## Antigravity

- Artifact-first review model: the hypothesis ledger and the summary artifact are natural review artifacts — keep them current, since the human reviews artifacts rather than the transcript.
- The browser subagent can drive the human-repro lane for web UIs (agent-triggered clicks against a running app), turning some lane-2 sessions into lane 1.

## Cursor

- Cursor has a **native Debug Mode** (agent loop with runtime-log instrumentation, human-in-the-loop reproduce/verify, automatic cleanup; also a CLI `/debug` command). When working inside Cursor on an interactive app, prefer the native mode for the core loop — cooperate, don't fight.
- This skill still adds value there: Rust fault-class playbooks, the durable on-disk ledger (native mode's state is chat-scoped), machine-readable JSONL evidence + summary artifacts under `dist/reports/`, the armed-and-waiting lane, `git bisect` fast-path, the promotion path, and a cross-IDE-consistent evidence trail. Use the native mode for instrument/reproduce mechanics and keep the ledger/artifacts from this skill.

## Zero-Residue Guard Wiring (any host)

`scripts/probe_cleanup.sh --check` is standalone and exits non-zero on any surviving `POLYDBG` marker. Suggested optional wirings, in the target's own idiom: a pre-commit hook, a CI step beside lint, or the host's stop/end-of-session hook where one exists. Never wire it as a blocking gate in a repo where armed-and-waiting probes are deliberately parked — use `--check --allow-armed <session-id>` for that window.
