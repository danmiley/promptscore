# Language Clusters: Rust / Python / Ruby

When working inside a language's repo, prefer that language's native tool over a generic one — it understands the project's manifest, respects its config, and produces diagnostics the build cares about. Each cluster lists the toolbelt, the install method, and a **post-edit validation loop** an agent can run after changing code.

`method`: `cargo` (`cargo install` or rustup component), `brew`, `uv` (`uv tool install`), `gem` (`gem install`), or `builtin` (ships with the toolchain).

---

## Rust
Dominant stack here (sphero-game, blue-marble). Most tools are cargo subcommands.

| Tool | Install | Method | What it's for |
|------|---------|--------|----------------|
| `cargo tree` | (with cargo) | builtin | Dependency tree; spot duplicate/conflicting versions. |
| `clippy` | `rustup component add clippy` | cargo | The Rust linter. First validation gate after edits. |
| `rustfmt` | `rustup component add rustfmt` | cargo | Formatter; `cargo fmt --check` in CI. |
| `cargo-nextest` | `cargo-nextest` | brew | Faster, clearer test runner than `cargo test`. |
| `cargo-deny` | `cargo-deny` | brew | License / security-advisory / banned-crate / duplicate checks. |
| `cargo-audit` | `cargo install cargo-audit` | cargo | RUSTSEC advisory scan of the lockfile. |
| `cargo-machete` | `cargo install cargo-machete` | cargo | Find unused dependencies. |
| `cargo-expand` | `cargo install cargo-expand` | cargo | Expand macros to see generated code. |
| `cargo-semver-checks` | `cargo install cargo-semver-checks --locked` | cargo | Detect public-API semver violations against a release baseline. |
| `bacon` | `bacon` | brew | Background `check`/`clippy`/`test` runner on file change. |
| `samply` | `samply` | brew | Sampling profiler (flamegraphs) for release binaries. |
| `hyperfine` | `hyperfine` | brew | Benchmark CLI runs (shared Tier 2). |
| `tokei` | `tokei` | brew | Composition stats (shared Tier 2). |

**Post-edit validation loop:** `cargo fmt --check` → `cargo clippy --all-targets -- -D warnings` → `cargo nextest run` (or `cargo test`) → `cargo deny check` (release gates with a checked-in deny policy). For perf-sensitive changes add `hyperfine`/`samply`.

### Rust audit evidence profile

Use this profile when `independent-audit` or `remediate-audit` routes a
concrete Rust evidence need here. The subject repo's own commands and policy
take precedence; run mutation-capable checks in the audit's scratch target.

1. **Pin scope with built-ins:** `git diff --stat <base>...<head>`,
   `git diff --name-status <base>...<head>`, and
   `git ls-files --others --exclude-standard`. Add `tokei` or `scc` only when
   composition/complexity materially affects coverage.
2. **Compile, lint, and test:** prefer the repo's documented commands. A
   portable fallback is `cargo test --workspace --all-targets`, then
   `cargo clippy --workspace --all-targets -- -D warnings`. A separate
   `-W clippy::pedantic` probe is useful but can be noisy; record it as an
   advisory lane unless the repo enforces it. Never enable all of
   `clippy::restriction`: cherry-pick only policy-relevant lints because the
   group contains intentionally conflicting restrictions.
3. **Dependencies:** run `cargo audit` when a lockfile exists and public
   advisory-network access is in scope. Run `cargo deny check` only when the
   repo carries a reviewed deny policy (or the audit explicitly owns creating
   one); without policy, absence is a coverage note, not an invented gate.
4. **Unsafe-code lane:** when the subject contains unsafe Rust that tests can
   reach, consider `cargo +nightly miri test`. On macOS install explicitly
   with `rustup +nightly component add miri`; this changes the developer
   toolchain and requires confirmation. Miri does not support most FFI or
   platform APIs and a passing execution does not prove soundness, so report
   unsupported paths and coverage limits honestly.

macOS setup for the stable, Homebrew-available evidence tools:
`brew install cargo-audit cargo-deny tokei scc`. Clippy comes from
`rustup component add clippy`; Miri is a separate nightly component. Confirm
availability before recommending installation, and let the audit skill's
authority classification decide whether networked or toolchain-mutating
setup is permitted.

### Rust release inventory

Use this after the ordinary build/test gates for a Rust release candidate;
none of these commands replaces repository-specific release policy.

1. **Workspace and dependency inventory (built in):** capture
   `cargo metadata --format-version 1`, `cargo tree --workspace`, and
   `cargo tree --duplicates`. Parse metadata with `jq` when a machine-readable
   package/target/feature inventory is useful. Duplicate versions are leads,
   not defects by themselves.
2. **Documentation surface (built in):** run
   `cargo doc --workspace --no-deps`. Treat warnings or failures according to
   repo policy; a successful build proves renderability, not documentation
   completeness.
3. **Public API compatibility (conditional):** for a published library or a
   release with a stated semver-compatibility gate, run
   `cargo semver-checks --baseline-rev <pinned-revision>` (or the repo's
   configured baseline). Prefer an explicit Git/local baseline over implicit
   crates.io lookup in an audit so the comparison is reproducible. Record the
   target and feature set; target-specific APIs may require multiple runs.
4. **SBOM (conditional):** for compliance, provenance, or supply-chain scope,
   run Syft against the release filesystem/artifact and emit the owner-required
   SPDX or CycloneDX format into scratch evidence. Validate that the output
   parses and identify the exact subject hash. Do not commit or publish an SBOM
   unless repo policy or the requester authorizes that artifact.

On macOS, Syft is `brew install syft`; Homebrew does not currently carry
`cargo-semver-checks`, so use its upstream Cargo install command above after
confirmation. Both tools may resolve or download external data/dependencies;
the audit's network and artifact-retention authority still applies.

---

## Python
Second stack here (word-histories). The Astral tools (`uv`, `ruff`) are the modern center of gravity.

| Tool | Install | Method | What it's for |
|------|---------|--------|----------------|
| `uv` | `uv` | brew | Fast package/project/venv manager and tool installer. The base others install through. |
| `ruff` | `ruff` | brew | Extremely fast linter **and** formatter; replaces flake8/isort/black for most projects. |
| `mypy` | `mypy` | uv | Traditional static type checker. |
| `pyright` | `pyright` | brew | Faster type checker / language server (Node-based). |
| `pytest` | `pytest` | uv | Test runner; the de-facto standard. |
| `bandit` | `bandit` | uv | Security-focused static analysis. |
| `pip-audit` | `pip-audit` | uv | Scan installed deps for known CVEs. |
| `pipdeptree` | `pipdeptree` | uv | Dependency tree inspection. |
| `pydeps` | `pydeps` | uv | Import/dependency graph (needs graphviz to render). |
| `tox` / `nox` | `tox` / `nox` | uv | Multi-environment test matrices. |

**Post-edit validation loop:** `ruff check` → `ruff format --check` → `mypy .` (or `pyright`) → `pytest -q`. Security pass: `bandit -r <pkg>` + `pip-audit`.

---

## Ruby
Stated workflow language (thin in the source surveys, so this cluster is hand-curated). Tools install as gems; in a Bundler project prefer `bundle exec <tool>`.

| Tool | Install | Method | What it's for |
|------|---------|--------|----------------|
| `rubocop` | `rubocop` | gem | The Ruby linter/formatter; community style guide. First validation gate. |
| `standardrb` | `standard` | gem | Opinionated, zero-config RuboCop wrapper ("bikeshed-proof"). Pick this **or** RuboCop, not both. |
| `ruby-lsp` | `ruby-lsp` | gem | Shopify's language server: navigation, diagnostics, formatting. |
| `solargraph` | `solargraph` | gem | Alternative language server (intellisense, type hints). |
| `brakeman` | `brakeman` | gem | Static security analysis for Rails (SAST). `brakeman -q -z`. |
| `bundler-audit` | `bundler-audit` | gem | Scan `Gemfile.lock` for vulnerable gems. `bundle audit check --update`. |
| `reek` | `reek` | gem | Code-smell detector (long methods, feature envy, etc.). |
| `rspec` | `rspec` | gem | The dominant test framework. |
| `sorbet` (`srb`) | `sorbet` | gem | Gradual static type checker (Stripe). |
| `fasterer` | `fasterer` | gem | Suggests faster Ruby idioms. |
| `debug` (`rdbg`) | `debug` | gem | Modern built-in-style debugger. |

**Post-edit validation loop:** `bundle exec rubocop` (or `standardrb`) → `bundle exec rspec` → `bundle exec brakeman -q -z` (Rails) → `bundle audit check --update`. Add `reek` for maintainability passes, `srb tc` if the project uses Sorbet.

---

## Cross-language notes
- **One version manager rules them all:** `mise` can pin Rust/Python/Ruby/Node toolchain versions per repo, replacing rbenv/pyenv/nvm/asdf. Useful when a repo mixes languages (e.g. blue-marble: Rust + Node).
- **Language servers are for editors/IDE bridges,** not direct agent invocation — an agent usually gets more from running the linter/type-checker as a one-shot command and reading its output.
- **Security scanners overlap:** `semgrep` (Tier 3) covers all three languages with one ruleset; the native scanners (`cargo-audit`, `pip-audit`, `bundler-audit`) are dependency-CVE specific and cheaper to run in a per-language loop.
