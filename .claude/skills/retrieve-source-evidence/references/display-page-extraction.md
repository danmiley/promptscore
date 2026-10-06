# Display-Page Extraction (L3, L4)

When L0–L2 fail, the content exists but is assembled at view time. Attack it in
this order — the cheapest rungs are also the most reproducible.

## Contents
- [Look for the boundary, not the pixels](#look-for-the-boundary-not-the-pixels)
- [Prefer the endpoint to the page](#prefer-the-endpoint-to-the-page)
- [Enumerate query surfaces](#enumerate-query-surfaces)
- [Decode defensively — the declared charset lies](#decode-defensively--the-declared-charset-lies)
- [Render last, and extract with intent](#render-last-and-extract-with-intent)
- [The four shapes of an archive](#the-four-shapes-of-an-archive)

## Look for the boundary, not the pixels

Before rendering anything, read the shell's HTML for what it is *going to* load:

- **`<iframe src=…>`** — one `iframe` enumeration has been the difference
  between "records stop at 2018, third-party source" and "every edition with
  official figures." Check this first; it is one grep.
- **Server-embedded state** — `<script type="application/json">`,
  `__NEXT_DATA__`, `window.__INITIAL_STATE__`. Statically parseable, no browser
  needed.
- **Declared alternates** — `<link rel="alternate" type="application/…json">`,
  `/wp-json/`, `/api/`, `/feed`, `/sitemap.xml`.
- **The JS bundle** — the API base path is usually a plain string literal in
  there. `curl` the bundle and grep it before opening a browser.

## Prefer the endpoint to the page

If the page fetches its data, **that response is the artifact you want**: usually
JSON, already structured, far cheaper to transcribe than a rendered table, and
stable across redesigns of the page around it.

A browser session opened to *discover* an endpoint should end with a `curl`
recipe recorded in the manifest, **not** with scraped DOM. The recipe is the
durable output; the session was scaffolding. Capture the request URL, its
parameters, and one full response.

## Enumerate query surfaces

Server-rendered archives are frequently one template driven by parameters:
`?year=`, `?category=`, `?stage=`, `?page=`. Once one combination works,
enumerate the space — serially, politely, and with the enumeration **recorded**:
bounds, step, and misses.

A gap in the enumeration is a gap in coverage and must be visible as one. An
enumeration that silently stops at the first 404 will under-report a source that
simply has no 2013 edition.

Do not extrapolate across a parameter you have not tried. This applies doubly to
archived parameterized URLs, which are captured unevenly.

## Decode defensively — the declared charset lies

A live endpoint can send `Content-Type: text/html; charset=UTF-8` and then emit
cp1252 bytes — `0xf6` for `ö`, so a name decodes to `Th<?>mus`.

**The trap is the fix that hides it.** `decode("utf-8", "replace")` converts a
detectable failure into replacement characters that look like a rendering
problem, and the damage is then attributed to the wrong layer entirely — one
field pipeline recorded "plaintext extracts mangle diacritics" and hand-restored
four names, when the cause was a declared-charset lie plus a lossy decode.

**Invariant:** try the declared charset, fall back through cp1252 and latin-1 on
a decode error rather than replacing, and **record which encoding actually
worked**. Never use replacement-character error handling on a document you
intend to transcribe names from — it destroys the evidence that anything went
wrong.

## Render last, and extract with intent

**Before opening a browser, classify the barrier** (`politeness-and-refusal.md`).
A page that renders client-side for every visitor is a technical barrier and
rendering it is fair. A page that declines automated access *specifically* is a
policy barrier, and a browser is precisely the wrong tool.

Rules that keep the render rung honest:

- **Wait on a content selector, never a fixed timeout and never network idle.**
  Replayed archive pages hang on dead third-party requests; one field probe
  timed out at 60 s on `networkidle` while a sibling capture rendered fine.
- **Prefer intercepting the network response over reading the DOM.** You are
  usually one interception away from the JSON that L3 wanted.
- **Persist the rendered HTML into the same cache with the same provenance
  record.** A browser artifact must not be second-class evidence.
- **Note that it required a browser** so refresh cost is known.
- **Never authenticate, solve a challenge, or defeat a paywall.** Record
  `refused`.
- Expect the first render to carry *chrome with zero rows*. Data often arrives
  only once parameters are chosen — which restates the rung above: find the
  query surface, then enumerate it.

Worth knowing: **archives sometimes replay JavaScript applications.** Where a
crawler captured enough of an app's own requests, rendering the capture can
produce the full interface. This is a genuine L4-on-L2 combination and it
recovers applications that no longer exist live.

Browser driving itself belongs to `playwright` / `playwright-browser-qa`. This
skill decides *whether* and *what to extract*.

## The four shapes of an archive

This skill does **not** transcribe into a host schema — that is the host's step.
What the shape determines is how much work you are handing over, and what you
must say about it. Capture the material and report the shape.

| Shape | What you hand over | Downstream cost |
|---|---|---|
| **Real table** | The table, captured as served | Low — a direct mapping exists |
| **Narrative prose** | The prose, captured as served | Facts are embedded in sentences. A year the writer skipped is a genuine coverage limit — **report the limit; never infer the missing value** |
| **Pivoted the wrong way** | The source as served, **plus** the pivot the host needs | Requires reconstruction — see below |
| **Behind an app** | Nothing without L4 | Browser, or `deferred` |

**Reconstruction is the one case where this skill produces a row set the source
never published**, and it is therefore the one case that must announce itself.
Where you group, join, or pivot, emit `reconstructed` with a derivation note —
automatically, whenever the output row count differs from the source's — and
carry that note into the data, any prose, and the source pointer, because a
reader arrives from any of the three.

Reconstructing is not the same as interpreting. Regrouping published rows on a
shared key is a mechanical transform over retrieved material. Deciding what a
row *means*, which figure is authoritative, or what tier it earns is the
verifier's job, not this skill's.
