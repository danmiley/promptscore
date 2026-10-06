---
name: cli-package-design
description: Use when designing, contract-defining, or packaging a command-line tool that fronts a focused set of REST APIs for both humans and agents — one semantic interface with two renderers. Covers dual-mode interaction, command taxonomy that mirrors the API resource graph, JSON/JSONL output envelopes, exit-code classes, a machine-readable capability manifest, config/auth precedence, non-interactive/dry-run/mutation safety, packaging and distribution lanes, docs-from-command-model with a product site, and multi-surface versioning. Language-neutral design layer — route Rust implementation to rust-cli-app, Homebrew/release mechanics to rust-homebrew-distribution, product/manual build surfaces to rust-cli-product-surface and product-site-pages, and CLI tool selection to agent-cli-tools.
license: MIT
metadata:
  version: "2"
  track: addon
  model-posture: any
---

# CLI Package Design

## Purpose
Design and package a command-line tool that fronts a focused set of REST APIs so that **both humans and agents** can drive it from the same semantic interface. This is the language-neutral design and contract layer: it decides the command tree, output/error/exit contracts, interaction and mutation policy, config/auth precedence, packaging and distribution shape, documentation architecture, and multi-surface versioning **before and around** the implementation. Implementation in a specific language, Homebrew release mechanics, and product-site build mechanics are routed to sibling skills.

This is the **tier-1, language-neutral** layer of the CLI skill family. The implementation tier (`rust-cli-app` and its siblings) realizes these contracts in a specific language and points back here for the design rationale. This skill owns the **canonical cross-cutting artifacts** the whole family shares — the exit-code taxonomy (`assets/templates/exit-code-map-v1.csv`) and the machine-readable capability manifest schema — so they have a single source of truth instead of diverging per language.

## Core Principle: One Semantic Interface, Two Renderers
The domain operation must be identical whether a person or an agent invokes it. Only **rendering and interaction policy** vary. Never build an `agent` subcommand or a hidden alternate API that can drift from normal behavior.

Terminal detection may choose presentation defaults (color, progress, paging). It must **never** change command meaning, select a different resource, or make a destructive operation safe. Every detected default needs an explicit override.

| Concern | Human default (TTY) | Agent/script contract |
|---|---|---|
| Output | concise table or prose | `--output json` / `--output jsonl` |
| Detail | progressive via `--help`, `--verbose` | named fields, stable schemas |
| Progress | stderr, only on a TTY | off by default; optional structured events |
| Color | auto on TTY | `--color never`; honor `NO_COLOR` |
| Pager | auto for long output | disabled off-TTY; `--pager never` |
| Input | prompt only when safe | `--no-input`; deterministic failure instead |
| Mutation | confirm risky actions | `--yes` + explicit target; dry-run |
| Volume | readable page | explicit `--limit`, cursor, or `--all` |

**Practical rule:** make the default command path agent-safe (JSON to stdout, diagnostics to stderr, no hidden prompts), then layer human affordances on top.

## The CLI Is an API
Treat command names, flags, env vars, config keys, output fields, exit classes, and side effects as **public contracts**. A pleasing table is not a machine contract: text output may improve over time, but structured output needs a compatibility policy and contract tests. Prefer explicit state over ambient state — automation should be able to name account, project/repo, profile, working directory, output mode, timeout, and interaction policy rather than inherit them invisibly.

## Workflow
1. **Read the contract first.** This repo: `AGENTS.md`, `catalog/catalog.toml`. The target product: its existing REST resource model — the CLI should mirror that, not invent a second platform.
2. **Decide the command taxonomy.** Prefer resource/action (`tool <resource> list|get|create|update|delete`) when the product manages objects; use direct verbs (`run`, `doctor`, `completion`, `version`) for non-CRUD operations. Mirror the API's real, durable nouns and stable identifiers — see [references/rest-fronting-design.md](references/rest-fronting-design.md).
3. **Lock the contracts early, before expanding command count:** output envelope, exit-code classes, stdout/stderr discipline, and config/auth precedence. See [references/command-output-error-contracts.md](references/command-output-error-contracts.md) and [references/interaction-mutation-and-auth.md](references/interaction-mutation-and-auth.md).
4. **Choose a small, orthogonal set of global flags** that mean the same thing everywhere (`--output`, `--fields`, `--no-input`, `--yes`, `--dry-run`, `--color`, `--pager`, `--quiet`, `--verbose`, `--timeout`, `--profile`, `--config`). Only expose a global flag that every command can honor truthfully.
5. **Provide one raw API escape hatch** (`tool api ...`) for endpoints not yet modeled, and a **machine-readable capability manifest** (`tool help --output json`) so agents can inspect the command tree, flags, types, defaults, conflicts, output formats, side-effect class, and schema ids without scraping prose.
6. **Plan packaging and distribution:** deliverable contents, target matrix, provenance, and the install lanes the audience justifies. See [references/packaging-and-distribution.md](references/packaging-and-distribution.md).
7. **Plan documentation as part of the package:** layered IA, reference generated from the command model, hand-authored task guides, and a product site. See [references/documentation-and-drift-controls.md](references/documentation-and-drift-controls.md).
8. **Define multi-surface versioning and release gates** up front: package SemVer, integer `schema_version` for machine output, config format version, deprecation windows. See [references/versioning-and-release-gates.md](references/versioning-and-release-gates.md).
9. **Write contract tests that execute the real binary**, not just internal units — exit classes, stdout-is-valid-JSON, stderr separation, stable `data.*` paths, config/auth precedence, dry-run equivalence, read-only diagnostics, secret redaction.

## Reference Routing
| Topic | Reference |
|---|---|
| Dual-mode human/agent interface, discoverability | [human-and-agent-interface.md](references/human-and-agent-interface.md) |
| CLI-over-REST design lessons: resource graph, shared core, escape hatch, MCP-readiness | [rest-fronting-design.md](references/rest-fronting-design.md) |
| Output envelopes, exit classes, capability manifest, schema versioning | [command-output-error-contracts.md](references/command-output-error-contracts.md) |
| Config/auth precedence, no-input, dry-run, retries, secrets | [interaction-mutation-and-auth.md](references/interaction-mutation-and-auth.md) |
| Deliverables, target matrix, distribution lanes, provenance | [packaging-and-distribution.md](references/packaging-and-distribution.md) |
| Layered docs IA, generate-from-command-model, drift gates, product site | [documentation-and-drift-controls.md](references/documentation-and-drift-controls.md) |
| Multi-surface versioning, deprecation, release-evidence gates | [versioning-and-release-gates.md](references/versioning-and-release-gates.md) |

## Templates
- `assets/templates/cli-contract-v1.md` — design-stage worksheet: taxonomy, globals, output/error/exit decisions, interaction policy.
- `assets/templates/command-manifest.schema.json` — JSON Schema for the machine-readable capability manifest.
- `assets/templates/exit-code-map-v1.csv` — the exit-code taxonomy with symbolic error classes.
- `assets/templates/release-evidence-checklist-v1.md` — what each release must produce and prove.

## Use With Other Skills
This skill owns **language-neutral design, contracts, packaging strategy, and documentation architecture**. Route the executable work:
- **Rust implementation** (clap command model, crate layout, typed errors, quality gates) → `rust-cli-app`.
- **Homebrew taps, formula lifecycle, release artifacts, install/upgrade verification** → `rust-homebrew-distribution`.
- **CLI manual/install/release-note build surfaces and drift checks against command truth** → `rust-cli-product-surface`.
- **Static product site, GitHub Pages publishing, route/link checks** → `product-site-pages`.
- **Choosing the right CLI tool for a task (jq, ripgrep, diffing, etc.)** → `agent-cli-tools`.

## Validation
- `skills-ref validate skills/cli-package-design`
- `./installer/lib/validate-repo.sh`
- `git diff --check`
