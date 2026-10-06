# The Retrieval Ladder

Rung selection and stop rules. Open this when deciding *whether to climb*, not
when executing a particular rung.

## Contents
- [Why a ladder](#why-a-ladder)
- [The stop rule](#the-stop-rule)
- [L0 — static fetch](#l0--static-fetch)
- [L1 — alternate paths on the same host](#l1--alternate-paths-on-the-same-host)
- [L2–L5 — where each rung's reference lives](#l2l5--where-each-rungs-reference-lives)
- [Identity failure poisons every rung](#identity-failure-poisons-every-rung)
- [Refresh and diff](#refresh-and-diff)

## Why a ladder

The recurring structural error in acquisition pipelines is defining the cheap
phase as *static-only* when the material that makes a subject first-class is
almost never static. The fix is not a bigger fetcher. It is an ordered ladder
with an explicit rule for when to climb and when to stop.

Record the rung that produced each artifact. It predicts refresh cost better
than any other single field: an L0 artifact re-fetches for free, an L4 artifact
needs a browser and a maintained selector.

## The stop rule

**Climb only on evidence.** A rung is entered because the rung below produced a
*detectable non-result* — a classified shell, a soft-404, a zero-link extraction,
an empty enumeration. Never because the agent felt unlucky, and never because
the ladder exists.

Equally: **stop climbing when a rung succeeds.** An L0 success does not need an
archive probe. The exception is a *change-detection* run, which reads the
archive's index deliberately (below).

Two inversions that the ladder exists to enforce, because an unaided agent gets
both backwards:

1. **L5 (mirrors) sits below L2 (archive).** Search engines surface mirrors
   instantly and archives essentially never, so the least trustworthy source is
   always the one that arrives first. A mirror of a dead page is a **trigger to
   run the archive probe**, not a resting place. Field evidence: a page recorded
   as gone — with the record resting on a third-party reproduction — had eight or
   more archived captures at status 200 containing the original publisher's own
   prose. The mirror was never necessary.
2. **The archive is often a discovery tool, not a content source.** See
   `archive-retrieval.md` §Discovery over content. A skill that only ever reads
   captures will take stale data when fresh data is one request away.

## L0 — static fetch

Four invariants, each closing a failure mode that produces successful-looking
output and no error. That property — not any individual bug — is what to design
against.

**Follow redirects and treat the *final* URL as canonical.** The host that
served the bytes owns relative-link resolution, same-origin filtering, and the
robots re-check. Discarding the post-redirect URL leaves a harvester resolving
links against a dead host and filtering the live host's links as off-domain. A
cross-domain redirect is *also a signal*: it usually means acquisition or
rebrand, and the good historical data often stayed behind on the old domain.

**Parse HTML permissively.** Accept double-quoted, single-quoted, and unquoted
attribute values; prefer a real parser where one is available. Minifying themes
emit `href=https://…` unquoted, which HTML permits and a naive
`href="([^"]*)"` regex misses entirely — yielding zero links, indistinguishable
from a site with no navigation. **A zero-link result on a page with a visible
navigation bar is a parser bug until proven otherwise.**

**Rank by URL shape, then verify by content.** A keyword-in-path plus
shortest-path ranker is blind by construction and will choose a client-rendered
shell at `/results` over the real archive at `/past-results`. Verify the pick's
content, fall through to the alternates on failure, and **always retain the
runners-up** — L1 depends on them.

**Never return silently on a missing anchor.** Every degradation emits a warning
that names the consequence. Every automatic lookup needs a manual override, and
the override is recorded in the manifest as an override.

## L1 — alternate paths on the same host

**Fetch `/sitemap.xml` before concluding anything**, plus any `Sitemap:` line in
`robots.txt`.

A near-zero nav-extraction result is a statement about the *extractor*, not the
source. Field evidence: a site exposing four links in static HTML and rendering
its mega-menu client-side matched zero of eleven target buckets; its sitemap
listed 36 URLs including the single richest source for the subject. Per-edition
and archive pages are routinely absent from navigation and present in the
sitemap — and those are usually the pages worth having.

A sitemap is also **the strongest available evidence of what a publisher does
not publish**, which is a far better basis for an `absent` finding than failing
to find a page.

Then: the ranker's runners-up, and conventional paths — `/past-*`, `/archive`,
`/history`, `/hall-of-fame`, year-suffixed paths.

### One host, many subjects

The sitemap is the right first move and it is also where L1 turns dangerous,
because **a sitemap enumerates the whole host, not your subject.** On a
portfolio host — a publisher with imprints, a university with departments, a
manufacturer with product lines, an organiser with a series of events — every
sibling's pages are in that list, and a path-shape ranker will happily score a
sibling's page as the best match for a subject that has no page of its own.

This is the common case, not an edge case. Most hosts worth harvesting serve
more than one subject.

**The test:** a sitemap or nav hit whose path shares no segment with the
subject is a *candidate sibling*, not a candidate source. Resolve it against
the subject's own path prefix before accepting it, and when no candidate
carries a subject segment, prefer `absent` over the closest-looking path.

Two failure shapes, both observed in the field:

- **Nav-sourced sibling pick.** Following site navigation from a subject's page
  lands on a path belonging to a different subject on the same host. The page
  is real, the fetch succeeds, and the material is filed under the wrong
  subject — a false fact, which is the class of error this skill exists to
  avoid producing.
- **The shared document.** One host serves a document to several subjects at
  once — a series-level rulebook, a group-wide policy, a shared specification.
  It is legitimately the publisher's own material, so no classifier will flag
  it, and its subject-specific passages may describe a *sibling*: a shared
  rulebook whose fair-play clause cited one country's traffic law because the
  same document also served an event held there. A shared document is
  `retrieved` for the series and, for the individual subject, evidence only for
  the passages that name it. Record which subject the path belongs to
  alongside the artifact, so a later reader can see the difference.

## L2–L5 — where each rung's reference lives

| Rung | Reference |
|---|---|
| L2 web archive | `archive-retrieval.md` |
| L3 data surfaces | `display-page-extraction.md` |
| L4 browser render | `display-page-extraction.md` §Render last, plus `politeness-and-refusal.md` for the barrier check first |
| L5 mirrors | `provenance-and-mirrors.md` |

L6 is out of scope by construction: record the gap and **name the ask** — who
would have to be contacted, for what document.

## Identity failure poisons every rung

Retrieval inherits whatever identity the discovery step guessed, and that guess
fails silently.

Field evidence: a harvester pre-filled name, aliases, and an encyclopaedia
identifier from the top title-search hit with no check that the hit *was* the
subject. A subject with no article matched a broad category page instead, and
that became the recorded name. No article also meant no structured entity,
hence no official-site property, hence no primary anchor — two silent failures
stacked, nothing errored.

**Invariant:** verify the match before any pre-filled field is used, with two
gates that fail in different directions. When no article exists, or when either
gate fails, **discard the entire pre-fill** — including the official-site
property — rather than salvaging fields from it. Record the consequence: such a
subject has no independent encyclopaedic cross-check for any identity fact.

**Gate 1 — the name.** An exact-phrase query, plus a substring check of the
searched name against the matched title. Cheap, and it rejects the merely
similar: "The Last Desert" is not a substring of "Last Days in the Desert", so
that match never survives this gate. Note it also fails in the *other*
direction — "Absa Cape Epic" is not a substring of "Cape Epic" — so a gate-1
failure means discard the pre-fill and search again, never accept a near miss.

**Gate 2 — the class.** A name check cannot catch a title-similar entity of the
wrong *kind*, and disambiguated titles are exactly where that happens: "The Last
Desert" *is* a substring of "The Last Desert (2016 film)", and a superstring
title like "The Everest Marathon Murders" passes too. So **check what the entity
is, not what it is called.** Every typed knowledge base carries an is-a edge —
Wikidata's is `P31`. Resolve the returned ids to labels rather than reading an
English description, so the gate works in any language, and reject classes that
cannot be the subject type: film, album, novel, human, television series, video
game. The allowlist of acceptable classes is domain-supplied, not this skill's
to fix.

Why both, and why this order: gate 1 is free and rejects most noise; gate 2
costs one extra lookup and is the only one that catches the dangerous case. A
wrong entity that clears both is the residual — **a same-class subject with a
similar name**, a different race called something close to the right thing.
Neither gate closes that, and no name- or class-based gate will. Escalate it to
a human rather than pretending it is covered.

The failure this guards is quiet. A wrong entity supplies a wrong official-site
property, and the resulting fetch failures look like an ordinary unreachable
site rather than proof the subject was never right.

## Refresh and diff

Re-harvesting is a first-class mode, not a repeat of the first run.

- **Cached re-runs must not rewrite the original retrieval timestamp.** A
  re-run that regenerates `retrieved_at` destroys the record of when the network
  actually saw the content.
- Compare content hashes against what was committed and report *no change* as an
  outcome in its own right.
- The archive index gives change detection cheaply: identical `digest` values
  across captures mean unchanged content, so a refresh run can skip retrieval
  entirely. See `archive-retrieval.md`.
- A dimension that was `absent` last run stays worth recording as `absent` —
  committing the finding is what stops the next run re-paying the search cost.
- **A freshness timestamp may only advance when a retrieval actually ran.** The
  companion to the rule above, and the more dangerous direction: bumping
  `last_updated` (or any host equivalent) during an edit that did not re-fetch
  launders staleness as currency. Field evidence: a subject's biography carried
  a `last_updated` nineteen days *after* the person died and did not mention it
  — the date said "checked recently" and nothing had been checked.

## Subjects with a cadence audit their own coverage

Most subjects worth harvesting recur on a schedule — annual editions, quarterly
filings, seasonal releases, numbered volumes. That cadence is free coverage
verification, and skipping it is how a harvest looks complete while missing the
most recent thing that happened.

**Derive the expected set before comparing.** From the cadence and today's date,
enumerate which instalments *should* exist, then subtract what was retrieved.
The difference is a per-instalment `absent` finding with a rung to try, not
silence. A run that never computes the expected set cannot distinguish "the
publisher stopped" from "our harvest stopped."

Three cheap detectors, all local — no extra fetch:

- **Self-numbering sequences audit themselves.** When a source labels its own
  instalments (47th edition, Volume 12, Series 4), a gap in the ordinals *is*
  the detected miss. A file running 47th → 49th has already told you the 48th
  is missing.
- **A jump in the value axis.** A schedule going 2025 → 2027 on an annual
  subject is a hole, regardless of what the labels say.
- **Recency inverts.** A *recent* `last_updated` alongside a missing expected
  instalment is stronger evidence of a harvest miss than an old one. An old
  timestamp says "nobody has looked lately"; a fresh one says "somebody looked
  and did not find it," which is the case worth investigating.

Field evidence: an annual motorsport rally's schedule held 2025 as completed and
2027 as announced, its edition numbering ran 47th → 49th, and the record's own
`last_updated` postdated the January 2026 running by six months. Three
independent local signals, none checked; a consumer reading the calendar would
conclude the next edition was 2027 and never learn 2026 had happened.

**This is retrieval's finding, not the host's.** A missing instalment reaches a
reader as a false impression of currency, but it starts as a file that was never
fetched — which is squarely this skill's half of the boundary.
