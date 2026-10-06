# Politeness, Access Boundaries, and Refusal

Most of this skill is about climbing past *technical* obstacles, which makes it
dangerously easy to treat every failed fetch the same way. **It is not the same.**
This reference is the brake.

## Contents
- [Capability preflight](#capability-preflight)
- [Load-bearing vs opportunistic browser use](#load-bearing-vs-opportunistic-browser-use)
- [Classify the barrier before climbing](#classify-the-barrier-before-climbing)
- [Robots is a preference, and preferences are now purpose-scoped](#robots-is-a-preference-and-preferences-are-now-purpose-scoped)
- [Politeness defaults](#politeness-defaults)
- [Record the stop as a finding](#record-the-stop-as-a-finding)

## Capability preflight

**"Open it in a browser" is not one capability.** Agentic IDEs ship in-app
browsers, and skills written against them tend to assume one the way they assume
a filesystem. Browser access is a property of **the running session**, not of the
repo, the skill, or the IDE's feature list, and it varies on three independent
axes:

| Axis | Question | Why it bites |
|---|---|---|
| **Presence** | Is a browser tool callable in *this* session at all? | In-app browsers are optional and versioned, sometimes tied to a separate extension or a running desktop app. Configuration on disk is not proof of a callable tool. |
| **Origin gating** | Is it allowed on *this host*? | Policies are commonly per-origin, and the gated origin is disproportionately likely to be the interesting one — archives, aggregators, anything resembling bulk access. |
| **Authority** | Can it act, or only look? | Some surfaces are read-only, some need per-action approval, some need a human present. A procedure that silently assumes click authority will stall unattended. |

**Preflight in order:** (1) is a browser tool callable in this session; (2) does
it load a *harmless page on the target origin* — not a generic one, because
gating is per-origin; (3) can it read, or only navigate; (4) does it need
approval per action.

This is the same discipline `project-web-search` imposes for search and it
generalizes verbatim: preflight the actual tool inventory, treat each session
independently, and do not infer availability from a config file, a skill's
presence, or a previous transcript.

A field session found exactly the predicted failure: the in-app browser worked
on ordinary sites and was **blocked on the archive origin** — the one origin the
archival rung needs. Documented as "open the capture in the in-app browser,"
that rung would have read as a broken procedure rather than a gated origin.

**When an origin turns out to be gated, record it as an environment finding, not
as a property of the source.** The next agent may be in a session where it works.

## Load-bearing vs opportunistic browser use

Classify every browser use before making it:

- **Load-bearing** — a documented pipeline step, a retrieval a record depends on,
  anything that must reproduce in someone else's session. Must run on a
  **scriptable, repo-owned browser**, pinned as a dependency. Never on an
  agent-driven IDE browser.
- **Opportunistic** — spot-checking a live page, eyeballing a layout, confirming
  a redirect. An in-app browser is ideal: zero setup, and its gating is a
  nuisance rather than a blocker.

The heuristic: **if the procedure will be written down, script it. If it is a
look, use whatever is at hand.**

## Classify the barrier before climbing

| Barrier | Example | Handling |
|---|---|---|
| **Technical** | Client-rendered shell, iframe, legacy domain, unparseable markup | **Climb.** The site serves this content to every visitor; a browser is a fair way to see it. |
| **Policy** | `robots.txt` disallow, bot-detection refusal, login wall, terms prohibition, HTTP 402 | **Stop.** The *capability* to ignore a stated preference is not *permission* to. |
| **Throttle** | 429, transient 403, 503 | Neither. Back off, retry once, then record. |

The policy row is the one that gets rationalized. A bot-detection page a browser
would sail through is the clearest case: the site has told you, in words, that
automated access is unwelcome. Field example — an official timing archive
answering automated requests with *"it looks like you're a robot, archived maps
are not accessible to Robots."* A browser would have worked. That is exactly why
it must not be used. The affected sections were correctly held at a lower status
than the record overall, with mixed per-section status as the right outcome.

**HTTP 402 is a newer member of the policy row.** CDN-level pay-per-crawl now
prices automated access at the edge rather than blocking it. A 402 is not a
throttle and not a bug: it is a priced boundary. Record `refused`, name the
price surface, and escalate the commercial decision to a human — never route
around it.

## Robots is a preference, and preferences are now purpose-scoped

Two facts that have to be held together:

1. `robots.txt` **expresses a preference and does not technically prevent
   access.** Its authority is entirely normative. That is an argument for
   honouring it, not against.
2. Preferences are increasingly **scoped by purpose**, not blanket. Cloudflare's
   Content Signals extension adds a `use=` parameter with three values (verified
   at the Cloudflare blog, 2026-08-03):

   | Value | Meaning |
   |---|---|
   | `use=immediate` | Interact, but store and reuse nothing |
   | `use=reference` (default) | Index, excerpt, and link back |
   | `use=full` | Summarize and reproduce |

This vocabulary maps directly onto what this skill does. Evidence retrieval that
caches a page, cites it, and links back is `use=reference` behaviour. A site
declaring `use=immediate` is telling you **not to cache** — which is a direct
instruction about the artifact this skill exists to produce, and it should be
recorded in `usage_signal` and honoured.

Read the signal, record it, and let it drive any pointers-versus-copies policy
the host repository holds.

Also dated, and worth knowing because it changes the base rate of refusals:
Cloudflare announced that from **15 September 2026**, new domains will have AI
training and agent crawlers blocked by default on pages that display ads, while
search crawling remains allowed. Expect more policy barriers over time, not
fewer, and expect them to be purpose-scoped rather than absolute.

## Politeness defaults

- **Serial by default**, one courtesy delay between fetches, **per host** rather
  than globally.
- **Honour `robots.txt` on every host you actually touch** — including the
  post-redirect host, and including the archive host.
- **Back off on 429/503** rather than retrying. A rate limit proves the tool
  works.
- **Set an honest, identifying User-Agent.** Never impersonate a browser to
  evade classification.
- **Cache aggressively.** Offline re-runs are the default; re-fetching needs an
  explicit flag.
- **Capture on first contact.** In one field session a single repo observed a
  deleted publisher page, an archive migrated behind an iframe, a page
  overwritten annually, two subjects with no machine-discoverable official site,
  and one unmaintained site. Deferring capture to a later enrichment phase
  assumes a stability that does not exist.

## Record the stop as a finding

Name the URL, quote the refusal, and state that **no circumvention was
attempted**.

This is what explains a lower confidence level to a later reader who would
otherwise read it as laziness. A `refused` outcome with evidence is a complete,
professional result. A gap you quietly failed to close is not.
