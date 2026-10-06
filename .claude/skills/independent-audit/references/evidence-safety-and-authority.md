# Evidence, Safety, and Authority

Open this before the first audit in a session. It carries the full preflight,
the claim-type evidence matrix, and mutation-isolation patterns.

## Contents
- [Why this exists](#why-this-exists)
- [The full preflight](#the-full-preflight)
- [Check classification](#check-classification)
- [Mutation isolation patterns](#mutation-isolation-patterns)
- [Evidence: match the proof to the claim](#evidence-match-the-proof-to-the-claim)
- [Independence dimensions](#independence-dimensions)
- [Close-out](#close-out)

## Why this exists
An audit request authorizes inspection and reporting. It does not
automatically authorize code fixes, destructive probes, credential use,
production load, or external messages. The drift is real: otherwise-good
audits have applied fixes mid-audit, which contaminates the evidence (the
subject no longer matches the findings) and blurs whose work is being judged.
Even "read-only" test runs can regenerate files, rewrite lockfiles, or warm
caches — know which of your probes mutate before running them.

## The full preflight
1. **Snapshot the subject state.** Branch/commit hashes; staged, unstaged,
   and untracked paths; relevant environment and tool versions; which changes
   are user-owned. The close-out compares against this snapshot.
2. **Default to read-only.** Do not fix findings during an audit unless the
   user explicitly asked for remediation as part of this task. If a finding
   is trivially fixable, that goes in the report as a recommendation, not
   into the tree.
3. **Classify every planned check** (taxonomy below). Know which probes
   mutate before you run them.
4. **Isolate mutation.** Run mutating checks in a scratch clone, worktree, or
   install target — never in the user's working tree.
5. **Get explicit authorization** for anything destructive, privileged,
   credentialed, load-generating, or production-touching. Security probes
   additionally require the authorization rules in
   `security-performance-and-operations.md`.
6. **Preserve evidence without overwriting subject artifacts.** Record where
   raw logs and captures live; clean temporary artifacts deliberately, not
   incidentally.
7. **Redact** secrets, tokens, PII, private URLs, and sensitive exploit
   detail from the report; state any disclosure restrictions. When a finding's
   evidence *is* such a payload, the verification entrypoint you hand the
   reader must itself be a redacted probe — a command whose normal output is
   counts, paths, or booleans, not the payload — so re-verification (yours or
   the remediator's) never reprints the poison while "proving" cleanup.
8. **Plan the close-out**: at the end you will compare final state against
   the snapshot and disclose any audit-caused mutation in the report.

## Check classification
| Class | Examples | Default authority |
|---|---|---|
| Local read-only | reading files, `git log`, static analysis | Granted by the audit request |
| Local mutating | test suites that write artifacts, builds, codegen | Granted, but isolate (below) or disclose |
| Destructive | deleting data, resetting state, force-pushes | Explicit authorization required |
| Networked | fetching URLs, hitting APIs | Granted for public reads; authorization for anything authenticated or writing |
| Privileged / credentialed | anything needing secrets, tokens, elevated rights | Explicit authorization required |
| Production-impacting | load generation, live-system probes | Explicit authorization required |
| Human-required | visual judgment, feel, hardware-in-the-loop | Plan the lane; report as "not performed" if unavailable |

## Mutation isolation patterns
- **Scratch clone/worktree** for anything that builds, generates, or runs
  tests that write into the tree.
- **Scratch install target** for installed-shape probes: install the artifact
  the way a user would (fresh directory, clean `$HOME` where relevant) and
  run every documented entrypoint from the installed location. Developer-
  machine state masks the most embarrassing blockers; file materialization
  alone proves nothing.
- **Deterministic checks first.** Run the cheap mechanical gates (validators,
  linters, test suites, link checks) before spending judgment budget — they
  produce evidence and shrink the risk map.
- **Untracked files evade diff-based gates.** `git diff --check` (and most
  diff-scoped linters) never see untracked candidate files, so a "gate
  passed" claim can silently exclude them. Enumerate untracked candidates
  explicitly (`git ls-files --others --exclude-standard`) and check each
  directly (e.g. `git diff --no-index --check /dev/null <file>` — note its
  exit code reflects file difference, so judge by output) before crediting
  any diff-scoped gate.

## Evidence: match the proof to the claim
The portable rule: **every finding carries evidence appropriate to its claim
type, plus a cheap verification entrypoint for the reader.** Cheap means the
reader can start verifying immediately with what the report gives them; full
reproduction may legitimately take longer. Requiring a failing command for
every finding is the right bar for executable defects and the wrong bar for
design, roadmap, visual, security, and performance findings — a command there
adds ceremony, not confidence.

| Claim type | Minimum evidence |
|---|---|
| Executable defect | Reproduction command/input, expected vs. observed output, environment, artifact location |
| Static code/contract defect | Pinned file locations, relevant snippet or symbol, reasoning chain, mechanical query where one exists |
| Documentation inconsistency | Both conflicting locations, the source-of-truth precedence, proposed reconciliation |
| Design/architecture defect | The requirement, the current or proposed model, a counterexample or failure scenario, feasibility evidence |
| Visual/UX defect | Exact state and viewport/window, image or human protocol, an observable pass/fail criterion |
| Performance defect | Workload, environment, warmup/iterations, baseline, distribution/variance, raw result path |
| Security defect | Explicit authorization, preconditions, exploit path, impact/blast radius, redacted evidence |
| Process/bookkeeping defect | Expected chain of record, observed history/state, the contradiction or omission |

Pin line citations to the audited commit/state and add a short symbol or
snippet when remediation is likely to move the line.

**When you substitute your own tool for the subject's check, state its blind
spots.** An audit re-runs checks independently (Core Loop step 7), often with
a different tool than the subject uses — a stricter linter, your own schema
validator, a hand-rolled probe. Every substitute carries its own limits: an
unenforced `format` keyword, a rule the subject's config would have caught, a
parser that skips what it does not understand. Name the substitute, turn on
its optional strictness where it matters, and when the finding *is* that the
subject's own check does not run, report your substitute's counts as a **lower
bound**, not a total. A number from a tool whose limits you did not state is
not yet evidence.

## Independence dimensions
Independence is a property of method, not just identity:
- **identity** — different agent/person than the implementer;
- **informational** — no leaked expected findings;
- **evidentiary** — checks re-run from primary artifacts, nothing inherited;
- **environmental** — clean target/home/device where relevant;
- **temporal** — fresh context or full re-derivation.

A same-agent audit is weaker but legitimate when the identity limitation is
disclosed in the report and evidentiary + environmental independence are
restored: clean environment, all commands re-run, nothing carried on trust.

## Close-out
At the end of the audit, in the report's integrity section:
1. Compare the final subject state against the preflight snapshot; disclose
   any audit-caused mutation and its authority.
2. Name where raw evidence (logs, captures, scratch targets) lives, and what
   was cleaned up.
3. Confirm redaction: no secrets, tokens, PII, or private URLs in the report.
