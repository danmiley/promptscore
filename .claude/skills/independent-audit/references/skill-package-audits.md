# Skill-Package Audits

Audit an agent skill (or a set of them) as a shipped package. This is a
**subject overlay**: it carries the standing check surfaces below and is
normally opened *alongside* a primary shape reference (branch gate,
acceptance, or corpus) per the routing rule in the skill body. When the
request is purely "audit this skill package" with no other gate, use it as
the primary shape with the acceptance-style verdict.

## Standard
The governing contracts, in precedence order: the repo's agent contract
(e.g. `AGENTS.md`), its skill-building contract (builder skill or authoring
guide), its progressive-disclosure design doctrine where one exists, and the
Agent Skills specification for frontmatter purity.

## Standing check surfaces
In the order they catch problems:

1. **Spec purity and frontmatter.** Run the repo's skill validator and
   repo-level validation.
2. **Progressive disclosure.** Compact contract body; one-topic references
   opened on demand; workflow steps conditional (classify-then-route), not a
   required-read list — a good routing map does not compensate for an
   earlier "read everything" instruction; references over ~100 lines carry a
   table of contents.
3. **Routing integrity.** Every routed path exists *in the installed tree*;
   sibling routing points at skill names and owned decisions, not into
   sibling internals; no routes into the source repo's `docs/` or other
   repos — installed targets do not have them.
4. **Host coupling.** Scan the whole tree (body, references, scripts,
   assets, notices) for IDE/host-specific content and absolute host paths;
   adapters own what they claim to own — do not accept assertions of adapter
   ownership the adapters do not implement.
5. **Installed-shape truth.** Install into a scratch target per supported
   lane and run every documented entrypoint from the installed location.
   File materialization alone proves nothing.
6. **Executable content by behavior, not folder.** Assets and copy-paste
   cells agents execute get syntax plus representative runtime checks, the
   same as scripts.
7. **Bookkeeping chain.** Version bump ↔ catalog/manifest row ↔ changelog ↔
   regenerated product surface ↔ engineering log ↔ (for new/ported skills)
   provenance record.
8. **Test-fixture coupling.** Version bumps and renames the audit recommends
   will break fixtures that hard-code them — name those fixtures in the
   recommendation.

## Composing with the primary shape
- New/updated skill on a release branch: primary `branch-release-audits.md`;
  these surfaces are the skill-specific check list on top of the branch
  bookkeeping and clean-environment checks.
- Single skill vs. its build contract: primary
  `development-acceptance-audits.md`; these surfaces feed the criterion
  evidence.
- Whole library against a doctrine: primary `corpus-alignment-audits.md`;
  these surfaces are the rubric input.

## Verdict
Per the shape chosen: gate disposition for a single package, cleanup plan for
a corpus. Always include the installed-shape evidence explicitly — it is the
check most often skipped and the one that finds the blockers.
