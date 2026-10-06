# Documentation and Drift Controls

Documentation is part of the interface, not cleanup work after the code lands. A CLI has several audiences at once: humans deciding whether to install, humans learning the command model, agents needing a concise "use this safely" surface, and reviewers wanting release context.

This reference states the **architecture principle** — what the docs surfaces are, why they exist, and the generate-from-command-model discipline. The **operational ownership** — the drift-check workflow and script, manual-quality/structure standards, the install-and-release-note content contract, and link/route validation — belongs to `rust-cli-product-surface` (CLI manual surfaces) and `product-site-pages` (static-site publishing). Use this page to decide the shape; use those skills to build and police it.

## Layered Information Architecture

```text
README.md                      # value, 60-second install/use, support links
docs/cli/getting-started.md    # install, auth/config, first successful task
docs/cli/tasks/                # goal-oriented human workflows
docs/cli/reference/            # generated command/flag reference
docs/cli/automation.md         # agent/script contract and examples
docs/cli/output-schemas.md     # formats, fields, errors, compatibility
docs/cli/configuration.md      # precedence, paths, profiles, origins
docs/cli/security.md           # credentials, redaction, verification
docs/cli/installation.md       # all lanes, upgrade/uninstall
docs/cli/release-notes.md      # user-visible compatibility changes
schemas/                       # JSON/config schemas consumed by tooling
```

The **automation guide** should state, on one compact page: output modes, schema versions, exit classes, prompting rules, pagination, timeouts, rate limits, concurrency, idempotency, and secret handling.

## Generate From the Command Model — Don't Hand-Maintain a Second Tree

A common trap is maintaining command documentation outside the source, which drifts. Keep the **command-definition layer authoritative** (e.g. `clap` for Rust) and derive from it:

- generate the command/flag reference, man pages, shell completions, and the machine-readable capability manifest from the one command model (e.g. via `clap-markdown` / `clap_mangen` and an `xtask`);
- do **not** adopt a separate command-definition system (e.g. Cobra for a Rust CLI) or hand-author a second command tree just for docs.

Do **not** generate task guides: examples need editorial judgment. Provide paired human and automation examples for important tasks, and make every example executable in a fixture or explicitly marked as illustrative.

## Drift Controls in CI

Regenerate reference pages, man pages, completions, and the capability manifest to a **temporary directory** and fail the build on a diff against the committed copies. This keeps generated truth reviewable without silently rewriting committed files. The same discipline applies to JSON/config schemas — check them in and diff them in CI.

## The Product Site

Treat the product site (`./product`, published via GitHub Pages) as part of the interface, not marketing fluff. It carries distinct surfaces for different audiences:

- landing-page positioning and an immediate, working install CTA;
- install guidance;
- a polished manual/reference (structure it — sidebar nav, command summary row, hierarchy separating short descriptions from full detail — rather than a raw `--help` dump);
- an agent-specific onboarding surface;
- release notes.

The site must agree with the code and the tests. Its data should still come from the actual command definitions even when its presentation is hand-curated. Highlight currently implemented commands first and keep roadmap items visually distinct — never promise unimplemented features as primary CTAs. Build/publish mechanics and route/link validation: route to `product-site-pages`; CLI-manual drift checks against command truth: `rust-cli-product-surface`.

## Anti-Pattern

Writing docs that describe a nicer product than the actual command surface. If docs drift from the shipped commands, humans and agents both pay the cost.
