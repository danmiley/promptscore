# Provenance and Mirrors

What every cached artifact must carry, and how to handle a copy of someone
else's page.

## Contents
- [Separate when we fetched from when it was true](#separate-when-we-fetched-from-when-it-was-true)
- [The provenance record](#the-provenance-record)
- [Tiering is not this skill's call](#tiering-is-not-this-skills-call)
- [The mirror taxonomy](#the-mirror-taxonomy)
- [Detection signals](#detection-signals)
- [The rule the skill enforces](#the-rule-the-skill-enforces)

## Separate when we fetched from when it was true

The single most consequential provenance error: conflating the retrieval time
with the content's effective date. It is how a 2013 page silently becomes a
current fact.

- `retrieved_at` — when the request ran.
- `content_datetime` — **when the content was true.** For an archived capture
  this is the *capture* timestamp. For a live page it is the page's own stated
  date where one exists, and otherwise the retrieval time with that ambiguity
  recorded rather than hidden.

These are never the same field and the second is never silently defaulted from
the first.

## The provenance record

A base of `url`, `retrieved_at`, `sha256`, `bytes`, `status`, `final_url` is
necessary and insufficient. Add:

| Field | Why |
|---|---|
| `retrieval_rung` | L0–L6. Predicts refresh cost. |
| `requested_url` / `final_url` | Redirects are signal, not noise. |
| `content_datetime` | Above. The one that stops date laundering. |
| `archive_source` + `archive_id` | Which archive, which capture. Makes the citation reproducible. |
| `render_required` | Whether a browser was needed. |
| `extraction_method` | `raw`, `html-to-text`, `json`, `pdf-text`, `dom-render`, `reconstructed` |
| `encoding_used` | Which decode actually worked, when the declared charset was wrong |
| `unique_text_chars` + `content_class` | The classifier verdict, retained rather than recomputed |
| `enumeration` | Bounds, step, and misses for a query sweep |
| `usage_signal` | The publisher's stated content-use preference, where declared |
| `license_note` | Terms observed at capture time; drives any pointers-not-copies policy |
| `supersedes` | When an archive capture replaces a mirror, the trail should show it |

**Never write credentials or API keys** into a manifest, cache path, prompt, or
log. Keys come from the environment.

**Cached re-runs must not rewrite the original retrieval timestamp.** A re-run
that regenerates it destroys the record of when the network actually saw the
content — a trap observed independently in two separate pipelines.

## Tiering is not this skill's call

This skill **proposes** a source class and a reason. A verification phase
**rules**. That boundary is what stops retrieval from manufacturing confidence.

Where a host repository has its own tier vocabulary, discover and honour it —
never import one. Two rulings recur often enough to be worth naming as
*patterns a host may adopt*, not as this skill's defaults:

- An archived capture of an official page is genuinely the publisher's own
  words, which is why it beats a third-party reproduction outright — and it is
  a third party's record, historical by construction. Hosts commonly rank it
  below a live primary source and above a mirror, carrying the **capture date**
  as its effective date.
- A live endpoint merely *discovered* through an archive is **live material with
  an ordinary access date**. Only content actually served by the archive is
  archival. The discovery step belongs in the run log, not the citation.

## The mirror taxonomy

Mirrors do not all deserve the same treatment. Classify mechanically; escalate
the ruling.

| Class | Example | Default handling |
|---|---|---|
| **Infrastructure alias** | Origin server, CDN hostname, staging host | Never cite. Rewrite to canonical. |
| **Syndication** | Licensed republication with attribution | Cite the original; use only to locate it. |
| **Verbatim reproduction of a dead page** | A fan site holding a deleted history page | **Try the archive first.** Only if the archive has nothing: cite, rank down, flag in every artifact. |
| **Aggregator / fan wiki** | Results databases, community wikis | Excellent for *finding*, never the basis of a fact. |
| **Scrape-of-a-scrape** | Content farms, unattributed copies | Never cite. |
| **Regional or language edition** | The `.de` or `.jp` site of the same publisher | **Not a mirror — a variant.** May carry data the primary lacks; may lag it. Compare, and note the date of each. |

The third row is where the ladder's central inversion bites: a mirror of a dead
page is a **trigger to run the archive probe**, not a resting place.

## Detection signals

- Identical path structure to the official site — `mirror.tld/the-race/history`
  matching `official.tld/the-race/history` is almost never coincidence.
- Raw-infrastructure hostnames: `ec2-*`, `*.amazonaws.com`, `*.cloudfront.net`.
- Identical `digest` in the archive index across two hosts.
- An `og:url` or `<link rel="canonical">` pointing elsewhere.
- Boilerplate footer attribution, or text referencing the original site's
  navigation.

## The rule the skill enforces

A mirror may be **proposed** with a class and a reason. It may **never** be
promoted to a trusted tier without a verifier's ruling, and it may never be
promoted at all until the archive probe has been run and reported.
