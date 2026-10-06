---
name: independent-audit
description: "Use when work needs independent verification at a decision point and a decision-grade report: a branch or release candidate before tag/merge, completed development work against a build prompt or acceptance criteria, a milestone against its design doc, a design/plan/roadmap before build starts, a corpus of artifacts against one standard, an agent skill package, or security/performance/process surfaces. Trigger on 'audit', 'independent review', 'release gate check', 'act as auditor', 'verify this work meets the spec', or when handed a notes-to-auditor brief or a producer evidence ledger. Read-only by default: inspect and report, never fix. Not for reviewing your own in-progress diff (use ordinary review/verify workflows) and not for executing fixes from an existing audit report (remediation is a separate task with separate authority)."
license: MIT
metadata:
  version: "10"
  track: addon
  model-posture: high-reasoning
effort: high
---

# Independent Audit
## Starting an Audit
A usable request names three things: the **subject** (branch, milestone implementation, design doc, release candidate), the **standard** it is judged against (design spec, acceptance criteria, repo contract, rubric), and the **decision** the verdict gates (merge, tag, sign-off, proceed-to-build). If any of the three is missing from the request, ask before starting the preflight. Example asks per audit type, and what the requester gets back: `references/invoking-an-audit.md`. The deliverable always lands at `docs/audits/YYYY-MM-DD-<subject>-audit.md` (Report Handoff below).

## Purpose
Independently verify an artifact or body of work at a decision point, against a named standard, and produce a decision-grade report. The report is a field report for a downstream agent or human who was not there: it succeeds if that reader can verify any claim cheaply, act on the recommendations without re-deriving context, and trust the stated boundaries of what was and was not checked. The reader's first act will be to distrust you — make distrust cheap.

An audit is skeptical toward *claims*, never toward people: nothing asserted is treated as verified until the auditor has verified it. An audit without a named standard is an opinion. An audit that ends without a verdict is a review that overstayed.

## Scope
- Producing audits of: branches/release candidates, development work vs. a build contract, milestones vs. design docs, pre-build designs/plans/roadmaps, corpora vs. one standard, skill packages, and security/performance/docs/process surfaces.
- The preflight, core loop, finding model, and report contract below.

Audit workflow artifacts — reports, remediation records, and calibration
records — are not default audit subjects. Audit one only when it directly
gates a decision, such as an owner-escalated disputed disposition; otherwise
the calibration record is the loop's quality control. This floor does not
exempt the audit machinery: a substantive change to `independent-audit` or
`remediate-audit` remains a heavily revised skill package and receives the
independent package audit required by the subject repo's release gate.

## Out of Scope
- **Remediation.** An audit request authorizes inspection and reporting only. Do not fix findings mid-audit — it contaminates evidence and blurs whose work is judged. If the user wants fixes, deliver the report first; consuming it is `remediate-audit`'s job, with its own authority (which findings to fix, which residuals are accepted and by whom).
- Ordinary pre-merge review of your own in-progress working diff.
- Test-harness design and QA ownership; audits consume test results as evidence.

## Independence Is a Precondition
Strongest: a different agent/model from the implementer, in a clean environment. Independence has five dimensions — identity (different agent), informational (no leaked expected findings), evidentiary (checks re-run from primary artifacts), environmental (clean target/home/device), temporal (fresh context). A same-agent audit is weaker but legitimate **only** when the identity limitation is disclosed in the report and evidentiary + environmental independence are restored: clean environment, every check re-run, nothing carried over on trust.

## Preflight (before any audit work)
1. Snapshot subject state and declare its Git durability in the report's `subject-basis` field: branch/commit hashes; staged, unstaged, and untracked paths; relevant tool versions; which changes are user-owned.
2. Default to read-only. Confirm with the requester whether anything beyond inspection is authorized.
3. Classify every planned check — local read-only, local mutating, destructive, networked, privileged, production-impacting, or human-required. Isolate mutating checks in a scratch clone/worktree/install target. Get explicit authorization for anything destructive, privileged, credentialed, load-generating, or production-touching.
4. Preserve evidence without overwriting subject artifacts; redact secrets, tokens, PII, and private URLs from the report; at close, compare final state against the snapshot and disclose any audit-caused mutation.

Open `references/evidence-safety-and-authority.md` for the full preflight, the claim-type evidence matrix, and mutation-isolation patterns before your first audit in a session.

## Core Loop
1. **Preflight** (above).
2. **Pin subject state and scope.** Resolve what is under audit to hashes/versions; name the comparison base (detect the intended base, do not assume the default branch); for dirty worktrees audit both the committed delta and the named working-tree delta — never silently omit one. State how pre-existing defects exposed-but-not-introduced are treated, and what is out of scope.
3. **Resolve the standards hierarchy.** Cite the governing documents (design doc, acceptance criteria, repo contract, spec, rubric) with revisions where practical and precedence among normative, advisory, and historical sources. If the work exposed gaps in the standard itself, auditing the standard is in scope — say so.
4. **Build an independent risk map first** — from the request, the standard, and the change/artifact inventory, *before* reading the auditee's framing. This is the anchoring defense.
5. **Ingest any auditee brief as a claims register.** Convert its claims, validations, residuals, and rationale into leads to verify. Overlaps with your risk map are priority leads; omissions may reveal blind spots. Claims in the brief are leads, not evidence. Absence of a brief is a process finding only where something required one. A residual the brief discloses is still the defect: disclosure changes who is surprised, not the impact or the gate — rate it on what it does, and credit the disclosure as process quality, not as a control.

   A producer **evidence ledger** (`docs/audits/<subject>-evidence-ledger.md` with `artifact: audit-evidence-ledger`, maintained under `maintain-audit-evidence`) is a richer claims register and is read at this same step, never earlier — it is structured and looks authoritative, which makes it the strongest anchoring surface you will meet. Its per-claim `status`, `currency`, `trust`, and `authority` labels are the producer's assertions: a row marked `verified / current / trusted` is still one lead. Its `stale` and `invalidated` rows are disclosure — read them, and treat a claim still marked `current` whose basis paths visibly moved as a process finding. Re-run its currency check yourself rather than inheriting its recorded result, and read that checker's reason codes: an ignored artifact reported absent in your clean clone is a regeneration task, not decay. A basis path set too narrow to catch a real input is a finding about the ledger, not evidence of currency. Per-claim falsifiers are the producer's own attack surface — the cheapest high-yield leads in the file.
6. **Plan coverage before spending the budget.** Mode (full/focused/follow-up/spot-check); for corpus audits the population, sample, and selection method; mandatory gates vs. optional probes; human-only and capability-blocked lanes; budget; stop conditions. In follow-up mode, independently reproduce closure of every prior blocker and each sampled non-blocker named in scope from primary artifacts at the pinned subject state; inspect every surface the remediation changed; independently run the minimum verdict-critical gate-reopen checks; expand to the full matrix only if a check fails, remediation evidence conflicts, or the changed surface invalidates broader assumptions. Never inherit the remediation record's assertions. A full re-run of unrelated checks must state why. The short report keeps recognition frontmatter, per-ID dispositions, affected-surface evidence, any new findings, and the verdict/integrity close.
7. **Verify claims independently.** Never inherit the auditee's validation results — re-run the stated checks. Probe beyond the happy path: the highest-value findings come from the installed/deployed shape (fresh targets, clean `$HOME`, quoted-command edge cases), not the developer-machine source tree.
8. **Classify findings** with stable IDs and the finding model below.
9. **Escalate systemically — but economically.** For each finding ask what missing rule, test, or gate allowed it; recommend a new permanent rule only when the escalation-economics test passes, and name the owner surface and the acceptance check that shows the rule is in force for any rule you recommend.
10. **Credit what works and record validation evidence.** Verified strengths with the same specificity as defects; then four lists — ran-and-passed, ran-and-failed (with output), not performed (with why), not applicable. The not-performed list is a trust feature.
11. **Issue the verdict.** A numbered, dependency-ordered fix list a downstream agent can follow top-to-bottom; an explicit gate disposition; the exact re-verification required to reopen the gate. Write the report to the canonical handoff path (Report Handoff below).
12. **Close integrity.** Final-state comparison against the snapshot, evidence locations, temporary-artifact cleanup, redaction confirmation.

## Finding Model
Each finding carries: **ID** (stable, e.g. `AUD-001`, unchanged across follow-ups) · **Kind** (defect / gap / risk / inconsistency / opportunity / positive control) · **Impact severity** (bands defined by the audit-type reference) · **Confidence** (confirmed / high / medium / low / unverified — reasoned-but-untested findings are reported at honest confidence, never smuggled in as confirmed) · **Relationship** (introduced / retained / exposed / n/a) · **Gate disposition** (block / conditional / advisory / accepted / provisional / not-assessed; `provisional` is used only under the applicable audit-type durability rule) · **Owner/acceptor** for accepted residuals.

**Recommendation contract:** state the outcome constraint that closes the
finding, then the smallest concrete change known to satisfy it. Label broader
work `systemic (optional)`. Note fix cost only when it materially diverges
from what severity implies. A density/style P2 or P3 must name lost behavior
or measurable cost; otherwise present it as advisory and defensible.

When a finding's evidence is a sensitive payload already written to a durable
surface — secrets, credentials, PII, private locations committed to reachable
history — **split the outcome constraint by surface**, because the surfaces
close under different authorities and one constraint hides that split:
- *Write path, worktree, and index* — remediable now: stop the write path,
  purge/ignore the artifact, add the filter and its fixture.
- *Reachable history* — a destructive `owner-gated: history-rewrite` action
  (rewrite/squash/`filter-repo`/force-push) a remediator without that
  authority cannot close; a deletion-only commit satisfies the first surface
  and leaves this one open.
Give each surface its own gate-reopen check, and make every such check a
**redacted probe** whose normal output is counts, paths, or booleans — never
the payload — so re-verification cannot reprint the poison. Do not bury the
history constraint inside a bullet that also lists ordinary code fixes.

Compact default priority ladder for software release gates (do not force it onto design, security, or performance audits — those references define their own bands):

| Level | Meaning | Gate effect |
|---|---|---|
| P0 | Core claim false, or artifact unusable/unsafe as shipped | Stop promotion and unsafe activity; continue evidence preservation before closing |
| P1 | Release/merge blocker: stated contract fails, documented path/command broken, required test fails | Gate closed until fixed and re-verified |
| P2 | Real defect that does not block; schedule or accept with documentation | Gate may open with residual recorded |
| P3 | Polish/taste; defensible either way | Advisory only |

**Evidence rule:** every finding carries evidence appropriate to its claim type plus a cheap verification entrypoint for the reader (matrix in `references/evidence-safety-and-authority.md`). A finding without a verification path is a hypothesis and must be labeled as one. Where quality and readiness diverge, score both (dual scoring), not a blended number.

## Audit-Type Routing
Classify the subject in two steps: pick the **primary shape** from the decision being made, then add at most one **subject overlay** when the artifact type carries standing checks of its own. One shape plus one applicable overlay is the ceiling — do not bundle-read the reference set.

Primary shapes (the decision):
- Branch, release candidate, or tag gate: `references/branch-release-audits.md`
- Completed work vs. a build prompt / acceptance criteria: `references/development-acceptance-audits.md`
- Design doc, plan, or roadmap before build: `references/design-plan-roadmap-audits.md`
- Milestone implementation vs. its design doc: `references/milestone-conformance-audits.md`
- Many artifacts vs. one standard (rubric scoring): `references/corpus-alignment-audits.md`

Subject overlays (the artifact; each can also serve as the primary shape when the decision itself is that kind of gate):
- Agent skill package: `references/skill-package-audits.md`
- Security, performance, docs-consistency, unattended-automation, or process/bookkeeping surface: `references/security-performance-and-operations.md`

Example: a release-candidate branch that adds one agent skill takes `branch-release-audits.md` (primary) plus `skill-package-audits.md` (overlay) — branch bookkeeping/merge-base checks *and* the skill-package standing surfaces both apply.

Before writing the report, open `references/report-quality-and-calibration.md` (quality bar, anti-patterns, calibration record the consumer will produce).

## Report Handoff (canonical location)
The report is a Markdown file the initiating/implementing agent must be able to find and act on with no other context:

- **Path:** `docs/audits/YYYY-MM-DD-<subject-slug>-audit.md` in the subject repo, creating `docs/audits/` if absent (repos without `docs/`: use `audits/` at the root).
- **Recognition contract:** start from `assets/audit-report-template.md` and keep its `artifact: independent-audit-report` frontmatter — the path pattern plus that marker is how consumers identify the report.
- **Self-contained:** embed the findings register in the report; cite files repo-relative and pinned to the audited hashes — never absolute host paths.
- **Mutation boundary:** this file is the audit's single authorized write into the subject — a new untracked file only, never a modification of existing files, disclosed in the integrity close-out. Do not commit it; the repo owner decides what enters history.
- **Consumer:** `remediate-audit` picks the report up from this location; its remediation record lands beside it.

## Assets
- `assets/audit-report-template.md` — the report skeleton; fill every non-conditional section.
- `assets/findings-register-template.md` — the findings table and per-finding field contract.
- `assets/auditee-claims-register-template.md` — for converting a brief into verifiable leads.
- `assets/notes-to-auditor-template.md` — offer to the implementer when a brief is missing on work that warranted one; do not write it for them mid-audit. It stays the right artifact for one-off handoffs; for multi-session work, `maintain-audit-evidence` projects a brief into this same template from its ledger.

## Use With Other Skills
- Use `agent-cli-tools` when an audit needs a CLI for an evidence task (search, structured-data parsing, repository reconnaissance, diffing, document extraction, security scanning, benchmarking, or language-specific validation), or when tool availability is uncertain. It owns task-to-tool selection, the manifest of install identities and tiers, availability checks, and prompted installation; this skill still owns evidence sufficiency, check authority, isolation, finding judgment, and the verdict.
- Do not load its full catalog routinely. Route a concrete evidence need to it, confirm the selected command is present, and record unavailable tools under **Not performed** when installation is not authorized. Never let a convenience installer broaden the audit's mutation, network, credential, or production authority.
- `remediate-audit` consumes this skill's canonical report; follow-up audits return here.
- `maintain-audit-evidence` is the producer-side counterpart: it owns the live evidence ledger and the brief projected from it. It never audits, never issues a verdict, and never opens a gate — so its output is input to Core Loop step 5 and nothing more. Do not maintain, correct, or extend a ledger mid-audit; a defect in one is a finding like any other.

## Validation (output gate)
Before emitting the report, confirm:
- Every finding has a stable ID, claim-appropriate evidence, and a cheap verification entrypoint; severity is argued, not asserted.
- Verified and believed are kept apart (confidence explicit; unrun checks are labeled residual risks).
- Recommendations are executable as written, name the files to change together and the re-verification to run, and trace their own side effects (fixtures, generated surfaces, hard-coded versions the fix will break).
- Strengths are credited with the same specificity as defects; the four validation-evidence lists are present.
- The fix order is dependency-ordered; the gate disposition is explicit; the integrity close-out confirms the audit left the subject untouched except the report file itself (or discloses exactly what else changed and under what authority).
- The report sits at the canonical handoff path with the recognition frontmatter, the embedded findings register, repo-relative hash-pinned citations, and every finding — not just blockers — carrying its evidence entrypoint.
