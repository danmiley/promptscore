---
name: project-web-search
description: "Use for repo-grounded external research with Brave Search: local-first discovery, serial API use, source verification, citations, and search-effort notes."
license: MIT
compatibility: Designed for Brave Search via MCP or API; degrade to local-only research when unavailable
metadata:
  version: "3"
  track: addon
  model-posture: any
  ported-from: codex-skills-dev/project-web-search-2026
---

# Project Web Search
## Overview
Use this skill when the project needs current or external evidence that is not already in the repo, such as codec/browser support, tool behavior, ffmpeg flags, vendor documentation, product examples, or web delivery guidance.

## Scope
- Local-first search planning before external lookup.
- Brave Search MCP usage and free-tier/burst-throttle hygiene.
- Source quality, verification, citation, and research logging.
- Research notes that can survive future agent sessions.

## Out Of Scope
- Replacing local project docs, manifests, or media-review findings.
- Treating search snippets as authoritative without opening sources.
- Parallel search sweeps that burn quota or create noisy results.

## Workflow
1. Read repo context first: `AGENTS.md`, `README.md`, `docs/agent-start-here.md`, and the specific pipeline docs touched by the task.
2. Preflight the access lane this task will actually use before promising external research (see Runtime Capability Preflight). Skill presence, repo configuration, and a saved API key do not prove that the current agent — or a script it runs — can reach Brave.
3. Decide whether external search is needed and whether the user made Brave mandatory or merely preferred. Search is appropriate for current, unstable, vendor-specific, or non-local facts; local docs stay authoritative for project workflow.
4. If Brave is mandatory but unavailable, stop before research and report which lane failed, what the reader can no longer rely on, the tool surface inspected, and any non-secret configuration location that may need attention. Do not silently substitute another search provider.
5. If Brave is preferred but unavailable, say so and use an allowed fallback only when the user and repo contract permit it. If all web access is unavailable, degrade to local-only research and label the limitation.
6. Form a small query plan with 1-5 high-value queries. Prefer primary sources and exact terms from the repo.
7. Use Brave serially when available. Do not parallelize Brave calls; wait about 1.5 seconds between calls and request small result counts.
8. Open and verify the target pages before relying on results. Use snippets only for discovery.
9. Record meaningful research decisions in `docs/background-research.md`; record pipeline or policy changes in `docs/ENGINEERING_LOG.md`.

## Runtime Capability Preflight

Brave access is two independent lanes, not one boolean. Preflight the lane the task actually uses; either lane can work while the other is dead.

| Lane | Used by | Proven by |
| --- | --- | --- |
| Tool lane | the agent's own search calls in this session | the Brave callable is present in the active tool inventory *and* returns a live result |
| Key lane | scripts, pipelines, and any child process that reads the key from its environment | a non-interactive shell can see the key variable |

- Inspect the active tool inventory for the actual Brave callable; do not infer availability from a skill, an MCP config file, a prior transcript, or another IDE lane.
- Never let a working tool lane vouch for the key lane. An MCP server can hold its own copy of the key in its server configuration while every subprocess in the same session sees nothing.
- Never let a stored key vouch for the tool lane either. A key on disk says nothing about whether this session exposes a callable.
- If the task runs a script that reads the key, probe the key lane the way that script will: from a non-interactive shell, checking presence only. `references/brave-search-api.md` has the probe commands and the list of places a key can hide.
- Treat each agent session independently. Codex and Claude can expose different MCP/plugin tools in the same repository.
- Never print, echo, copy, or commit key values while diagnosing. Report presence and length; never content.
- Distinguish these outcomes in the work log: both lanes available; tool lane only; key lane only; neither lane (all web unavailable); permitted fallback used; Brave call attempted but rate-limited.
- A rate-limit response proves the tool is callable. Follow the backoff policy rather than reporting it as an import/configuration failure.

## Brave Search Rules
- Use one Brave call at a time.
- Prefer precise queries with operators such as `site:`, quoted phrases, inclusion/exclusion terms, and domain-specific terminology.
- Start with small counts, usually 3-5 results. Broaden only when discovery is genuinely weak.
- If rate-limited, stop immediately, wait 5-10 seconds, then retry one targeted query. If that fails, switch to standard web search or direct URLs and note the fallback.
- Track search effort when research materially affects a change: calls attempted, calls succeeded, rate-limit behavior, and pages verified.

## Source Quality Ladder
1. Official docs/specs/source repositories.
2. Maintainer release notes or issue discussions with clear dates.
3. Standards bodies and browser/vendor compatibility tables.
4. Reputable technical articles used only as interpretation, not as sole authority.
5. Forums, social posts, or snippets only as leads to verify elsewhere.

## Reporting
- State degradation as what the reader now lacks, not as what the lookup just failed to do. "External verification is off for this run; every claim below is repo-local" beats "key not set" — the second reads as "you have no key" when the usual cause is a key that exists but is unreachable from here.
- Name the failed lane when reporting unavailability, so the reader knows whether to look at their session's tools or their process environment.
- Cite sources with links when external facts influence the answer or repo change.
- Name the date-sensitive assumption if the fact may change.
- Keep quotes short and prefer paraphrase.
- Separate verified source facts from inferences made for this project.

## Core Rule
Search should sharpen repo decisions, not replace repo judgment. Use the web to verify the outside world, then bring the result back into the local pipeline contract.
