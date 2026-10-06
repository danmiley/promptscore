---
name: retrieve-source-evidence
description: "Use when a subject's source material must be pulled into a local, provenance-bearing evidence cache: harvesting an official site, recovering a page that now 404s, finding the real archive behind an empty results page, mining historical documents or endpoints, or re-harvesting and diffing a corpus. Climbs an evidence-gated ladder — static, alternate paths, web archive, data endpoints, browser render, mirrors — and reports an honest per-dimension outcome (retrieved / shell / archived-only / reconstructed / absent / refused / deferred). Not for finding candidate URLs or answering research questions (project-web-search), not for authoring browser test suites (playwright-browser-qa), and not for interpreting, transcribing, or tiering material already retrieved."
license: MIT
metadata:
  version: "3"
  track: addon
  model-posture: high-reasoning
---

# Retrieve Source Evidence

## Purpose
Turn a subject and a set of target dimensions into a **provenance-bearing local
evidence cache**, with honest coverage claims and an explicit record of what
could not be retrieved and why. The deliverable is material plus an outcome per
dimension — never a conclusion.

The test for what belongs here: **if getting it wrong produces a false fact, it
is not this skill's job. If getting it wrong produces a missing file, it is.**

## Scope
- Discovering the host repository's cache layout, manifest schema, and outcome vocabulary before writing anything.
- Preflighting what this session can actually reach — tools, origins, authority — before promising a rung it cannot climb.
- Planning retrieval as an ordered ladder with an evidence-gated stop rule.
- Executing the static, archival, data-endpoint, and render tiers.
- Classifying non-content (shells, soft-404s, consent and bot walls) before anything counts as coverage.
- Recording provenance that separates *when we fetched* from *when it was true*.
- Politeness, access boundaries, and refusal as a reported finding.

## Out Of Scope
- **Assigning evidence tiers.** This skill *proposes* a class and a reason; a verification phase rules.
- Deciding coverage level or whether a dimension is complete.
- Computing derived figures, transcribing into a host schema, or writing prose.
- Copying third-party text into committed artifacts where the host's policy says pointers, not copies.
- Bypassing paywalls, logins, CAPTCHAs, rate limits, or a robots directive.
- Assuming any repository's paths, dimension names, tier numbering, or statuses.

## Workflow
1. **Discover the host contract.** Cache layout, manifest schema, outcome/tier vocabulary, and gates. Never assume them; if the repo has none, propose one and get it confirmed before caching at scale. A host that already has vocabulary usually has an *orthogonal* one rather than a competing one — see below before trying to reconcile.
2. **Preflight this session's reach**, in four checks — they are cheap and they stop you promising a rung you cannot climb:
   - Is a browser tool **callable in this session at all**? Configuration on disk is not proof.
   - Does it load a harmless page **on the target origin**? Gating is commonly per-origin, and the gated origin is disproportionately the interesting one.
   - Can it **read**, or only navigate?
   - Does it need **approval per action** — i.e. is a human required?

   Browser access is a property of the running session, not of the repo or the IDE's feature list. Record a gated origin as an *environment* finding, not as a property of the source. Open `references/politeness-and-refusal.md` only when a barrier actually appears, a browser render is contemplated, or robots/content-signal preferences must be interpreted.
3. **Verify subject identity before using any pre-filled field.** Entity resolution fails silently upstream of retrieval and poisons everything below it.
4. **Climb the ladder** (below), opening one reference per rung. Enter a rung only because the rung below produced a *detectable non-result*, never on a hunch.
5. **Classify every response before recording coverage.** A 200 is not content. Run `scripts/classify_content.py`.
6. **Record provenance per artifact** and emit one outcome per dimension.
7. **Report what was looked for and not found, with where to look next.**

## The Ladder
Retrieval is a ladder, not a fetch. Record which rung produced each artifact — it
is the single best predictor of refresh cost.

| Rung | Method | Cost | Yields |
|---|---|---|---|
| **L0** | Static fetch of the canonical URL | ~0 | Prose, rules, About pages |
| **L1** | Alternate paths on the same host — **`/sitemap.xml` first**, then `robots.txt` `Sitemap:` lines, ranker runners-up, `/past-*`, `/archive`. On a host serving many subjects, **a hit whose path shares no segment with the subject is a candidate sibling, not a candidate source** | ~0 | The real page behind a shell; pages absent from nav entirely |
| **L2** | **Web archive** — CDX discovery, temporal targeting, raw captures, document mining | low | Deleted pages, pre-redesign server-rendered versions, hidden endpoints, PDFs |
| **L3** | Underlying data surfaces — iframe `src`, XHR/JSON endpoints, query-parameter surfaces, legacy domains | low–medium | The actual structured data, often JSON |
| **L4** | Browser render | medium–high | Anything assembled only client-side |
| **L5** | Third-party mirrors and reproductions | low in tokens, expensive in *trust* | Text whose original is gone |
| **L6** | Offline / human — documents by request, correspondence | out of scope | Recorded as a gap, with the ask named |

Two rules make the ladder work:

1. **Climb only on evidence.** Each rung is entered because the rung below
   produced a detectable non-result, not because the agent felt unlucky.
2. **L5 sits below L2, not above it.** Search surfaces mirrors instantly and
   archives never, so the *least* trustworthy source is always the one that
   arrives first. **Try the archive before accepting a mirror.**

A third rule earns its own line because it inverts the obvious framing:
**the archive's highest use is often discovery, not content.** A site that
migrated from server-rendered HTML to a JavaScript front end usually kept the
backend. The archive is the cheap way to learn that endpoint's shape — and then
you query it *live*, for data newer than any capture.

## Reference Routing
Classify the task, then open **one** reference. Do not read these as a bundle.

- Rung selection, stop rules, and what a non-result looks like: `references/retrieval-ladder.md`
- L2 — CDX cookbook, temporal targeting, document mining, archive limits: `references/archive-retrieval.md`
- Classifying shells, soft-404s, walls, and truncation before counting coverage: `references/noncontent-detection.md`
- L3/L4 — iframes, embedded state, endpoints, query sweeps, encoding, rendering: `references/display-page-extraction.md`
- Provenance fields, mirror taxonomy, and the retrieved/drafted/verified boundary: `references/provenance-and-mirrors.md`
- **Only when a barrier appears, a render is contemplated, or robots/content-signal preferences must be interpreted** — barrier classification, refusal, politeness defaults, and the full capability preflight: `references/politeness-and-refusal.md`

## Scripts
- `scripts/classify_content.py` — the §non-content classifier. Pure stdlib, no
  network. Give it a fetched document, the host's homepage, and **the HTTP
  status**; it returns a content class, unique-character count, and the rung to
  try next. Run `--selftest` to confirm it works before trusting a verdict.
  **Always pass `--status`.** It is the most reliable signal available and the
  easiest to lose, because a throttled or blocked body is indistinguishable
  from an ordinary thin page once it is a file on disk. Omitting it means
  *unknown*, never 200, and any verdict that would send you further up the
  ladder comes back flagged `unknown-status` — a 402/403/429 would have stopped
  you instead.
  **When the output carries `review_required`, the classifier declined to
  decide** — it found barrier language on a page too long to judge by language
  alone. Look at that page before recording it as coverage.

## Output Contract
Per dimension, per subject, emit exactly one:

| Outcome | Meaning |
|---|---|
| `retrieved` | Real content cached, with provenance, at a named rung |
| `shell` | Page exists, carries no content; classified, not guessed |
| `archived-only` | Live source unavailable; served from an archive with its capture date |
| `reconstructed` | Assembled from a source that never published it in this form |
| `absent` | Genuinely does not exist — a **finding**, not a failure |
| `refused` | Access boundary. Named, quoted, not circumvented. |
| `deferred` | Needs a rung this run was not authorized or able to climb |

Then a run summary: rungs used, artifacts, warnings, endpoints discovered,
enumerations performed, and **what was looked for and not found, with where to
look next**.

**A host validator passing is not evidence of retrieval fidelity.** The two
answer different questions: the host's checker asks whether the files it has are
well-formed, and this run summary asks whether the files it should have exist at
all. Field evidence: a corpus whose structural validator reported zero errors
across every subject, while the primary results archives behind those subjects
had never been retrieved. Nothing in the green check was wrong; it simply could
not see the gap. Never let a host's clean validation stand in for an outcome —
the summary is the only surface where the difference is visible.

### These outcomes are an axis, not a replacement

The outcome above records **retrieval fate**: what happened when we went to get
the material. That is deliberately independent of the two axes a host repository
most often already has —

- **Coverage extent** (*complete / partial / representative*, or similar) — how
  much of a dimension exists.
- **Editorial confidence** (*draft / research / verified / vetted*, or similar)
  — how much the host trusts what it holds.

None of the three subsumes the others, and a dimension can legitimately be
`archived-only` **and** `partial` **and** `verified` at once. So when step 1
finds a host vocabulary, the answer is almost never to map onto it or replace
it: **record retrieval fate per artifact alongside the host's own fields, and
reconcile nothing.** Collapsing the axes destroys the distinction that makes
each useful — a `verified` fact sourced `archived-only` has a different refresh
cost and a different fragility from the same fact sourced `retrieved`, and a
merged field cannot express that.

Propose a new field only when the host has no way to record retrieval fate at
all. If a host insists on one combined status, say what is lost and let the host
decide — that is the host's call, not this skill's.

## Core Rules
- **Every degradation emits a warning naming the *consequence*, not the condition.** "Harvest has no primary-source anchor at all" beats "lookup returned nothing."
- `absent` and `shell` must be as cheap to record as `retrieved`. The entire family of silent-failure defects behind this skill exists because failure was easier to render as silence than as a finding.
- **Capture on first contact.** Sources perish measurably. Deferring capture to a later enrichment phase assumes a stability that does not exist.
- **Never write credentials or API keys** into a manifest, cache path, prompt, or log.
- **Cached re-runs must not rewrite the original retrieval timestamp**, and **no freshness timestamp advances without a retrieval that actually ran.** The second is the more dangerous direction: a `last_updated` bumped during an edit that re-fetched nothing launders staleness as currency.
- **Classify with the HTTP status in hand.** A throttled or blocked body is indistinguishable from a thin page once it is a file on disk, and guessing 200 turns a back-off signal into an instruction to climb.
- A retrieval that required circumventing a stated preference is not a retrieval. Record `refused` and hand off.

## Use With Other Skills
- `project-web-search` owns **discovery** — finding candidate URLs and confirming an entity exists. Its serial-call and snippets-are-leads rules are inherited wholesale. **Search finds; this skill opens.** A snippet that appears to contain the answer is exactly the case where the underlying page is often gone.
- `playwright` / `playwright-browser-qa` own **browser driving**. This skill decides *whether* a render is warranted and *what to extract*; it does not reimplement the driver.
- `agent-cli-tools` owns tool selection and availability — `curl`, `jq`, `rg`, PDF text extraction.
- `agentic-debugging` owns the posture when a harvest "succeeds" and produces nothing: hypothesis → targeted probe → evidence → fix.
- `repo-memory` owns where a durable, non-obvious retrieval trap is recorded once found.
- `independent-audit` owns judging a completed corpus. This skill produces material for that judgment; it does not render it.

## Validation
- Every cached artifact has a provenance record whose required fields are all populated; `content_datetime` is never silently set from the fetch time.
- Every dimension has exactly one outcome, and `absent`/`refused` findings name the URL and the reason.
- **Every pointer in the manifest resolves to a file that exists.** A cache entry citing an artifact that is not on disk is the exact failure this skill's scope test names — getting it wrong produces a missing file — and it is one `test -f` per pointer to catch.
- Any enumeration records its bounds, step, and misses — a gap in the sweep is a gap in coverage and must be visible as one. **For a subject with a cadence, the expected set is derived from that cadence and today's date, not from what came back.**
- Any reconstructed row set carries a derivation note.
- `scripts/classify_content.py --selftest` passes before its verdicts are trusted.
