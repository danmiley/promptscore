# Archive Retrieval (L2)

The highest value-per-token rung on the ladder, and the one most often missing
entirely. It needs no browser, no API key, and no JavaScript — plain `curl`.

Claims about third-party API surfaces below were verified 2026-08-03 and carry
their observation date. **Re-verify before relying on a parameter**; these are
someone else's services and they change.

## Contents
- [Discovery — the CDX index](#discovery--the-cdx-index)
- [Parameters that matter](#parameters-that-matter)
- [Retrieval — always ask for the raw capture](#retrieval--always-ask-for-the-raw-capture)
- [Temporal targeting](#temporal-targeting)
- [Endpoint and document mining](#endpoint-and-document-mining)
- [Discovery over content](#discovery-over-content)
- [Limits — where archives do not help](#limits--where-archives-do-not-help)
- [Other archives](#other-archives)
- [What this rung is actually worth](#what-this-rung-is-actually-worth)

## Discovery — the CDX index

```bash
# Every archived capture of one URL that returned 200
curl -s "http://web.archive.org/cdx/search/cdx?url=<host>/<path>&output=json&filter=statuscode:200&limit=200"
```

Rows are `[urlkey, timestamp, original, mimetype, statuscode, digest, length]`.
With `output=json` the first row is a header naming the fields. Verified live
2026-08-03.

**Always send `-w "[http %{http_code} %{size_download}B]"` or equivalent while
developing a query.** A zero-byte 200 is the failure mode this rung produces,
and it is invisible if you only look at the parsed body.

Companion endpoint for the simple case — "is there *a* capture near this date?":

```bash
curl -s "https://archive.org/wayback/available?url=<url>&timestamp=2023"
```

## Parameters that matter

Verified against the Internet Archive's `wayback-cdx-server` README, 2026-08-03.

> ### Do not combine a `*` wildcard with an explicit `matchType`
>
> This is the single most dangerous gotcha on this rung, because it fails
> **silently and in the direction of "nothing here."**
>
> `matchType` and a `*` in `url=` are two ways to say the same thing. Supply
> both and the `*` is taken **literally**, as a character in the path. The
> server returns HTTP 200 with an empty or nonsense body — never an error.
>
> Reproduced 2026-08-03 against `web.archive.org`:
>
> ```bash
> # BROKEN — HTTP 200, zero bytes, for a host with tens of thousands of captures
> curl -s "http://web.archive.org/cdx/search/cdx?url=iana.org*&matchType=prefix&fl=original&limit=3"
>
> # BROKEN differently — returns paths that literally contain '*'
> curl -s "http://web.archive.org/cdx/search/cdx?url=iana.org/*&matchType=prefix&fl=original&limit=3"
> #   http://www.iana.org/*
> #   https://www.iana.org/**
>
> # CORRECT — wildcard alone, matchType inferred
> curl -s "http://web.archive.org/cdx/search/cdx?url=iana.org/*&fl=original&collapse=urlkey&limit=3"
>
> # CORRECT — matchType alone, no wildcard
> curl -s "http://web.archive.org/cdx/search/cdx?url=iana.org&matchType=domain&fl=original&limit=3"
> ```
>
> **Pick one form and never mix them.**
>
> #### Reading the empty response correctly
>
> Do not use a byte count as the diagnostic. Sizes vary with `limit=`, with what
> the host actually has archived, and with `output=` — the broken form returns
> **`[]` (3 bytes) with `output=json`** and **0 bytes without it**, which is why
> two observers can report different "empty" sizes for the same defect.
>
> Worse, **a zero-byte HTTP 200 has more than one cause.** Re-verifying this
> reference on 2026-08-03 the *correct* form also returned HTTP 200 with 0 bytes,
> immediately after a 503 and two timeouts from the same host — the endpoint was
> throttling. A query-shape bug and a throttled endpoint are indistinguishable
> from the response body alone.
>
> So the control is a **paired comparison run in the same session**, judged
> qualitatively:
>
> 1. run the suspect query and the known-good form back to back;
> 2. if the known-good form returns non-empty and the suspect returns empty, the
>    query shape is wrong;
> 3. if **both** are empty, or you saw a 429/503/timeout nearby, you have learned
>    nothing about the query — back off and retry later. Do not record `absent`.
>
> An empty CDX response is a statement about your query *or your rate limit*
> until you have proved otherwise — never about the host's holdings.

| Parameter | Use |
|---|---|
| `matchType=` | `exact` (default), `prefix`, `host`, `domain`. Use **either** this **or** a `*` in `url=` — never both. |
| `url=<host>/*` (wildcard alone) | **Every URL ever archived under a host** — the endpoint-discovery workhorse |
| `url=<host>&matchType=domain` | Same, and includes subdomains |
| `collapse=urlkey` | One row per distinct URL. **Collapsing acts on *adjacent* rows only** — it works here because CDX output is sorted by urlkey, but do not assume it deduplicates a differently-ordered result set. `collapse=field:N` compares the first N characters. |
| `filter=[!]field:regex` | Regex on any field; `!` inverts; multiple filters chain |
| `filter=statuscode:200` | Drop redirects and errors |
| `filter=mimetype:application/pdf` | Document mining |
| `from=` / `to=` | 1–14 digit `yyyyMMddhhmmss`, inclusive |
| `fl=original,timestamp,mimetype,length` | Keep responses small |
| `limit=` | First N; **negative returns the last N**. Server maximum 150,000. Always set one. |
| `showDupeCount=true` | Adds a `dupecount` column counting duplicates by digest **across the whole index** — better change detection than comparing digests by hand |
| `showResumeKey=true` + `resumeKey=` | The correct way to page a large prefix scan. `offset` also exists but reads through every skipped record, so it degrades badly. |
| `page=` / `pageSize=` / `showNumPages=true` | Block-based pagination over the secondary index; roughly 3,000 results per block |
| `digest` | Content hash. Identical across captures means unchanged content — **free change detection for refresh runs** |
| `gzip=false` | Responses are gzip-encoded by default |

**No rate limits are documented.** That is not the same as no rate limits: they
are real and unpublished, and they surface as 503s, timeouts, **and zero-byte
200s** — see the paired-control rule above, because a throttled response is not
distinguishable from a bad query by its body. Serial requests, courtesy delay,
cache every response,
and back off hard on 429/503 rather than retrying.

## Retrieval — always ask for the raw capture

```bash
curl -sL "http://web.archive.org/web/<timestamp>id_/<original-url>" -o capture.html
```

The `id_` suffix returns the **original bytes** — no toolbar, no banner, no
rewritten links. Without it you archive the replay chrome into your cache and
corrupt every link you later resolve. (`if_` gives the framed view; `id_` is the
one you want.)

## Temporal targeting

The naive move is "get the latest capture." The high-value move is usually the
opposite — pick the snapshot, not just the URL:

- **Just before a redesign.** Sites migrate *from* server-rendered HTML *to*
  JavaScript applications. The pre-migration capture is often statically
  parseable when today's page is not.
- **Just before a deletion.** Diff status codes over time; the last `200` before
  a run of `404`s is the target.
- **Just before an annual overwrite.** A page overwritten each year destroys its
  own history; one capture per year reconstructs the series.
- **One capture per edition** for anything on an annual cycle. The archive is a
  time series, and `digest` tells you cheaply which captures actually differ.

## Endpoint and document mining

A prefix query is not just a URL list — it is a **map of a site's server-side
surface, including paths that appear in no current navigation.**

**Legacy server-rendered endpoints.** Today's `/results` is a JavaScript app
calling an API; some years ago it was `results.php?year=2006&category=Men`,
fully server-rendered, and both the endpoint and its output are archived.

**Documents.** A PDF-filtered prefix scan surfaces rulebooks, yearbooks,
historical record sheets, and official classification documents — exactly the
files that get linked once and then forgotten. One field scan returned 2,157
archived PDFs for a single host, including a 9.7 MB historical compendium that
had been recorded as "not retrieved."

```bash
# Wildcard alone — adding matchType here would silently return nothing.
curl -s "http://web.archive.org/cdx/search/cdx?url=<host>/*&output=json&filter=mimetype:application/pdf&collapse=urlkey&fl=original,timestamp,length&limit=500"
```

Extract text with a layout-preserving PDF tool; route tool choice to
`agent-cli-tools`.

## Discovery over content

The framing "the archive is where you get dead content" undersells it and points
the skill at stale material when fresh material is available.

**A site that migrated from server-rendered HTML to a JavaScript front end
usually kept the backend.** The old endpoint is invisible: nothing links to it,
no navigation exposes it, search does not index it. The archive's prefix scan is
the only cheap way to learn its shape — and once you know the shape, **you query
it live**.

The sequence is: **archive to discover the surface → live host to harvest it →
archive again only for the years the live host has dropped.**

Field evidence: archived captures of a legacy `results.php?year=…&category=…`
endpoint revealed the parameter grammar. The same endpoint answered *today*,
returning the current edition — data newer than any capture — while an
archive-only approach would have taken seven-year-old data.

**Provenance corollary:** an endpoint merely *discovered* through the archive is
a **live source with an ordinary access date**, not archived material. Only
content actually served by the archive is archival. The discovery step belongs
in the run log, not in the citation.

## Limits — where archives do not help

State these plainly; a skill that implies archives are a universal solvent
produces false confidence.

- **Client-rendered pages archive as client-rendered pages.** If the content was
  assembled by a request the crawler never made, the capture is as empty as the
  live page. Archive the *endpoint*, not the page.
- **Exclusions and takedowns remove captures retroactively.** Absence of a
  capture is not evidence a page never existed.
- **Deep and parameterized URLs are captured unevenly.** Presence of
  `?year=2006` says nothing about `?year=2007`. Enumerate; never extrapolate.
- **Expect roughly a two-in-three hit rate on genuinely hard targets.** In one
  four-probe field session, two clear wins, one document recovery, and one
  honest miss where the captures existed but contained only introductory prose
  and no data. Report that case as `archived-only: insufficient` and keep
  climbing — do not record a capture as coverage because it exists.

## Other archives

**The Memento TimeTravel aggregator is gone.** It operated 2015–2025 and was
discontinued as a result of the parent site's forced migration; a static
informational site replaced it in 2026 (verified at `mementoweb.org/about/`,
2026-08-03). Do not build a rung on `timetravel.mementoweb.org`.

The **Memento protocol itself is unaffected** and is supported by all major web
archives including the Internet Archive. Individual archives still expose
TimeGates; what disappeared is the cross-archive aggregator. Practical
consequence: **query archives individually.** There is no longer a single
endpoint that asks them all.

| Archive | Access | Notes |
|---|---|---|
| Internet Archive Wayback | CDX API, as above | The default. Broadest coverage. |
| Common Crawl | **CDX-compatible index** (pyWB); collections listed at `index.commoncrawl.org/collinfo.json` | The same query grammar transfers. Per-crawl indexes rather than continuous history; best for bulk and for URLs Wayback missed. Verified 2026-08-03. |
| `archive.ph` / `archive.today` | No usable automation surface | Often holds pages Wayback lacks. Hostile to automated access — treat as a manual step, and see `politeness-and-refusal.md` before deciding to push. |
| National library web archives | Varies | Country-specific subjects; often the only holder of regional material. |

## What this rung is actually worth

The generalizable finding from the field evidence behind this skill: of four
subjects whose primary material five completed onboardings had concluded was
gone, browser-bound, or available only through a mirror, **three had a
statically retrievable primary source.** The failure was not effort. It was that
no rung of the ladder pointed at the archive.
