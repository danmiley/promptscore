# Non-Content Detection

The reusable core of this skill. Every silent-failure defect behind it shares
one property: **successful-looking output and no error.** A 200 is not content.

## Contents
- [Subtract the homepage](#subtract-the-homepage)
- [Use a validated extractor where one is available](#use-a-validated-extractor-where-one-is-available)
- [The classifier](#the-classifier)
- [Each class implies a different next rung](#each-class-implies-a-different-next-rung)
- [Truncation reads as success](#truncation-reads-as-success)
- [Retain the verdict](#retain-the-verdict)

## Subtract the homepage

The cheap, portable, zero-dependency test:

> Site navigation, header, and footer repeat verbatim across pages. **Any line
> that also appears on the homepage is chrome.** What remains is the page's real
> content.

Under roughly 400 unique characters is a shell, not a thin page. Field evidence:
a results page yielded **19 unique characters out of a 70 KB document** and
would otherwise have been recorded as coverage.

The threshold is a host-configurable knob, not a constant. Calibrate it against
two or three known-good pages on the same site before trusting it, because
template weight varies enormously between a minimal static site and a CMS that
ships a 60 KB mega-menu on every page.

## Use a validated extractor where one is available

The subtraction heuristic solves *detection* — is there content here at all.
Mature libraries solve *extraction* — get the article out of the template. They
are complementary and the skill should use both.

Independent evaluation (a Sandia National Laboratories report, 2024, and an ACM
SIGIR empirical comparison) finds **Trafilatura** and **Readability** the
leading open-source options, with near-perfect precision at omitting
boilerplate; Readability scores highest median and most predictable, Trafilatura
best overall mean. Either is a better main-text extractor than anything worth
hand-rolling. Route availability and installation to `agent-cli-tools`.

**The key move:** an extractor returning almost nothing is a *classification
input*, not an error. Feed that result into the classifier below rather than
treating it as a failed parse. Two independent signals agreeing — subtraction
says 19 unique chars, extractor says no article — is a confident shell verdict.

Keep the dependency-free path working. A skill that only classifies when
Trafilatura is installed will silently skip classification on the host where it
is not, which is precisely the failure mode this whole reference exists to
prevent.

## What language cannot decide

**A page *about* a barrier and a page that *is* one use the same vocabulary, at
similar density.** This is a limit of the approach, not a tuning problem.
Measured 2026-08-03 on real-shaped inputs: an article about bot walls carried
barrier vocabulary at ~16% of its characters; an actual verbose bot-wall page
carried it at ~8%. Density, match count, and word count all fail to separate
them — the article scores *higher*.

So the classifier decides on language only where the page is too thin to be
about anything else. Above that ceiling it **refuses to guess**: it returns the
structural class and raises `review_required`, naming what it suspects.

Two consequences a caller must accept:

- **A verbose barrier page that returns HTTP 200 will come back as `content`
  with `review_required`.** Recording it as coverage without looking is a
  choice, not an accident. Most real bot walls also carry 403/429, which *is*
  decided structurally and is not affected.
- **A short article about barriers will still misclassify.** Narrowing the
  ceiling to fix that would lose real thin soft-404s, which is the more damaging
  error. The window is documented, not tuned away.

Structural signals — status codes, an explicit pagination total, a password
field, the unique-character threshold, an empty mount point beside thin text —
decide without this caveat. Prefer them **for what shape a page has.**

They are not exempt from the other question. A structural signal is more
reliable about a page's *shape* and no more reliable about *whose* shape it is:
a login form in the site template is chrome on every page of the site, exactly
as a nav bar is. **Subtract structural signals against the homepage the same way
text is subtracted** — and subtract them by count, not by boolean. A page
carrying more password inputs than the template has a form of its own; a page
carrying the same number has the template's.

Field evidence (2026-08-03): before this rule, one publisher's header login form
put every page under ~250 words of unique text on the host into
`paywall-or-login` — and therefore into `refused`, the one outcome this skill
treats as terminal and virtuous. Ordinary content pages were written off, and
the honest-refusal discipline is what guaranteed nobody revisited them.

Do not over-correct into deleting the signal. Discarding a page-level password
field would route a genuine member-only page to `shell` and send an agent to
endpoint-mine something it should have refused. The excess over the template is
the signal; the template's own copy is not.

## The classifier

Classify, do not merely threshold. `scripts/classify_content.py` implements
this; the table is the contract.

| Class | Signal |
|---|---|
| **shell** | Near-zero unique text; an empty `<div id="root">` / `<div id="app">`; a content-free `<noscript>` |
| **soft-404** | HTTP 200 with "not found" / "no results" language, or a body far shorter than its siblings |
| **consent-wall** | Unique text dominated by cookie, consent, or age-verification language |
| **bot-wall** | Challenge markers; 403/429 with an HTML body; "enable JavaScript to continue" |
| **paywall-or-login** | Form plus no content. **Stop. Do not authenticate.** |
| **payment-required** | HTTP 402. A newer surface: CDN-level pay-per-crawl. A *policy* barrier, not a throttle — see `politeness-and-refusal.md` |
| **paginated-stub** | Real but truncated — "showing 1–20 of 480" with no page parameter followed |
| **content** | Survives all of the above |

## Each class implies a different next rung

This is why classification beats a boolean:

| Class | Next |
|---|---|
| shell | L3 (find the endpoint), then L4 |
| soft-404 | L1 (alternate paths), then L2 (archive) |
| consent-wall | Retry once honouring the declared consent mechanism only if trivial; otherwise L2 |
| bot-wall | **Back off and record.** Do not escalate to a browser — see the barrier table |
| paywall-or-login | `refused`. Hand to a human. |
| payment-required | `refused`, with the price surface named |
| paginated-stub | L3 — enumerate the pagination surface |
| content | Stop climbing |

The bot-wall row is the one agents get wrong. A browser would sail through,
which is exactly why it must not be used.

## Truncation reads as success

"Showing 1–20 of 480" is a coverage cliff that looks like a win. **Any table
without an explicit total is unverified.** This belongs in the classifier, not
in the agent's memory — an agent that has to remember to check will forget on
run 40.

Where a total is present and the row count does not match it, that is a
`paginated-stub` regardless of how much content came back.

## A ranking you cannot reproduce means a column is missing

The same failure one axis over. Truncation loses *rows*; this loses a *column*,
and it is quieter because the table looks complete.

> **If the captured columns cannot reproduce the source's own ordering, the
> ordering key was not captured.**

Mechanical and cheap: sort the captured rows by the columns you have. If that
does not reproduce the order the source displayed, something you did not take is
doing the sorting. Ties are the loudest version — rows sharing an identical
value on every captured column while the source ranks them 1, 2, 3 prove the
existence of a column you do not have.

Field evidence: an expedition race's results captured `distance_km` and rank,
and several editions show a podium where every athlete has the same distance to
three significant figures under distinct ranks. The source ranked on elapsed
time under a weather-dependent scoring model; the harvest took the distance
column and left the ordering basis behind. Nothing errored, and the table reads
as full coverage.

Record it as a retrieval finding with the missing column named, and do not let
downstream work derive anything from the order — a "course record" computed from
a distance-only projection is a fact the source never asserted.

## Retain the verdict

Store `unique_text_chars` and `content_class` in the artifact's provenance
record rather than recomputing them later. Two reasons: a later reader needs to
know the page *was* classified, and a refresh run comparing classes across time
detects a site that has migrated to a shell — which is itself a finding worth
reporting.
