# CLI Tool Catalog, by Utility Tier

Tier reflects **how broadly an agent benefits**, not raw tool quality. `method` is how to install it: `brew` (Homebrew), `go` (`go install`), `uv` (`uv tool install`), `gem` (`gem install`), or `builtin` (ships with macOS). Where the binary name and the install name differ, both are shown.

Audience tags: **(agent)** = a model invokes it directly; **(human)** = helps a person reading the terminal; an agent gets little from it.

---

## Tier 1 — High utility
Invoked constantly, language-agnostic, broad payoff. Install these first.

| Tool | Install | Method | What it's for |
|------|---------|--------|----------------|
| `rg` (ripgrep) | `ripgrep` | brew | (agent) Fast recursive content search; respects `.gitignore`. The search workhorse most coding agents shell out to. |
| `fd` | `fd` | brew | (agent) Fast, gitignore-aware `find` replacement; simpler syntax. |
| `ast-grep` (`sg`) | `ast-grep` | brew | (agent) Structural search and rewrite by syntax tree (tree-sitter). Find/rewrite "every `await` inside a `try`" reliably. The biggest capability gap vs regex-only agents. |
| `jq` | `jq` | brew | (agent) JSON query/transform. Pipe API output, configs, and tool JSON through it. Essential. |
| `yq` | `yq` | brew | (agent) YAML/TOML/XML processor, `jq`-like syntax. Config-heavy repos. |
| `gh` | `gh` | brew | (agent) GitHub PRs, issues, checks, releases from the terminal; no scraping. Set `GH_PAGER=cat`. |
| `tree` | `tree` | brew | (agent) Directory structure overview — the cheap first step to orient in a repo. |
| `sd` | `sd` | brew | (agent) Intuitive `sed` replacement for find/replace. |
| `git` | (Xcode CLT / `git`) | builtin/brew | (agent) Baseline. `git grep`, `git log --stat`, `git blame` orient an agent to hot/owned files. |

## Tier 2 — Medium utility
Frequent across common workflows; install when the work calls for it.

| Tool | Install | Method | What it's for |
|------|---------|--------|----------------|
| `codex` | official standalone installer | manual | (agent/human) Agentic coding CLI for interactive repository work, non-interactive `codex exec` automation, and local review. Authenticate separately; use explicit sandbox and approval policy in unattended runs. |
| `comby` | `comby` | brew | (agent) Structural search-and-replace across many languages; agent-driven refactors. |
| `ctags` (universal-ctags) | `universal-ctags` | brew | (agent) Symbol/tag index; cheap, fast, widely understood. |
| `tokei` | `tokei` | brew | (agent) Fast LOC / language composition — "what is this codebase made of" in one call. |
| `scc` | `scc` | brew | (agent) LOC + complexity + COCOMO estimate; very fast. |
| `gron` | `gron` | brew | (agent) Flatten JSON to greppable `path = value` lines — turns `rg` into a JSON query tool. Underrated. |
| `jc` | `jc` | brew | (agent) Convert output of `ls`, `ps`, `df`, etc. into structured JSON for parsing. |
| `rga` (ripgrep-all) | `ripgrep-all` | brew | (agent) `rg` over PDFs, Office docs, archives, ebooks. Where ordinary grep breaks down. |
| `repomix` | `repomix` | brew | (agent) Pack a repo into one token-counted AI-friendly file. Best for one-shot "dump this repo to a model" *outside* an agent loop. |
| `code2prompt` | `code2prompt` | brew | (agent) Codebase → single LLM prompt with token counts. |
| `tree-sitter` | `tree-sitter` | brew | (agent) Parse source to ASTs directly; build syntax-aware tooling. |
| `hyperfine` | `hyperfine` | brew | (agent) Command-line benchmarking; perf-sensitive refactors. |
| `watchexec` | `watchexec` | brew | (agent) Run commands when files change. |
| `entr` | `entr` | brew | (agent) Classic minimal file-watcher; rerun-on-change loops. |
| `pandoc` | `pandoc` | brew | (agent) Convert Markdown/HTML/DOCX/LaTeX; prep docs for review. |
| `xh` | `xh` | brew | (agent) Fast HTTPie-like client for poking APIs. |
| `markdownlint` | `markdownlint-cli` | brew | (agent) Lint Markdown/CommonMark files with configurable, CI-friendly rules. |
| `shellcheck` | `shellcheck` | brew | (agent) Static analysis for shell scripts; validation loop after edits. |
| `shfmt` | `shfmt` | brew | (agent) Format shell scripts. |
| `just` | `just` | brew | (agent/human) Project command runner; better than ad-hoc shell. |
| `mise` | `mise` | brew | (agent/human) Manage language/tool versions per repo (asdf successor). |
| `direnv` | `direnv` | brew | (human) Auto-load per-project env; needs security discipline. |
| `difftastic` (`difft`) | `difftastic` | brew | (human) Structural (AST) diff that understands syntax. |
| `delta` | `git-delta` | brew | (human) Syntax-highlighting pager for `git diff`/`grep`/`blame`. |
| `fzf` | `fzf` | brew | (human) Fuzzy finder; interactive selection. Avoid in non-interactive agent pipelines. |
| `pre-commit` | `pre-commit` | brew | (agent/human) Run validators before commits; guardrail for generated edits. |

## Tier 3 — Niche-segment utility
High value, but only inside a specific domain. Install per-task, not by default.

### Image / visual regression
| Tool | Install | Method | What it's for |
|------|---------|--------|----------------|
| `magick compare` | `imagemagick` | brew | Pixel/math visual diff + heat map of changed regions. |
| `odiff` | `odiff` | brew | Very fast pixel diff with percentage metadata; UI/screenshot regressions. |
| `perceptualdiff` | `perceptualdiff` | brew | Perceptual diff — ignores visually irrelevant pixel changes. |
| `dssim` | `dssim` | brew | Structural-similarity diff for screenshots. |
| `exiftool` | `exiftool` | brew | Inspect image/doc metadata and provenance. |
| `ffmpeg`/`ffprobe` | `ffmpeg` | brew | Inspect, sample, transcode video/audio frames. |

### Document extraction / OCR
| Tool | Install | Method | What it's for |
|------|---------|--------|----------------|
| `pdftotext` | `poppler` | brew | Extract text from PDFs before feeding to a model. |
| `tesseract` | `tesseract` | brew | OCR engine for images/screenshots/scans. |
| `ocrmypdf` | `ocrmypdf` | brew | Add an OCR text layer to scanned PDFs. |
| `marker` | `marker-pdf` | uv | PDF → Markdown for agent-readable technical docs. |
| `docling` | `docling` | uv | Structured PDF/doc parsing/conversion. |

### Security / secret scanning
| Tool | Install | Method | What it's for |
|------|---------|--------|----------------|
| `gitleaks` | `gitleaks` | brew | Scan repos for leaked secrets. |
| `trufflehog` | `trufflehog` | brew | Deep secret scanning across Git history. |
| `trivy` | `trivy` | brew | Vulnerability/misconfig/secret scanner (containers, repos, IaC). |
| `semgrep` | `semgrep` | brew | Rule-based static analysis across many languages. |
| `osv-scanner` | `osv-scanner` | brew | Dependency vulnerability scanning. |
| `grype` | `grype` | brew | Filesystem/container vulnerability scanner. |
| `syft` | `syft` | brew | Generate SBOMs. |
| `cargo-semver-checks` | `cargo-semver-checks` | cargo | Check Rust library API changes for semver violations against a pinned baseline. |

### Tabular data
| Tool | Install | Method | What it's for |
|------|---------|--------|----------------|
| `mlr` (Miller) | `miller` | brew | `awk`/`sed`/`cut`/`jq` for CSV/TSV/JSON records. |
| `xsv` | `xsv` | brew | Fast CSV slicing, stats, joins, sampling. |
| `dasel` | `dasel` | brew | Query/mutate JSON/YAML/TOML/XML/CSV with one syntax. |
| `sqlite-utils` | `sqlite-utils` | brew | Build quick local SQLite indexes from JSON/CSV/docs. |
| `datasette` | `datasette` | uv | Explore SQLite in the browser. |

### Diagram / graph rendering
| Tool | Install | Method | What it's for |
|------|---------|--------|----------------|
| `dot` (graphviz) | `graphviz` | brew | Render dependency/call/module graphs. |
| `mmdc` (mermaid) | `mermaid-cli` | brew | Render Mermaid diagrams from text. |
| `plantuml` | `plantuml` | brew | Render UML/architecture diagrams from text. |

### Indexed search at scale
| Tool | Install | Method | What it's for |
|------|---------|--------|----------------|
| `csearch`/`cindex` | `github.com/google/codesearch/cmd/csearch` | go | Trigram-indexed regexp search; near-instant over huge repos. Run `cindex` first. |
| `gtags` (GNU GLOBAL) | `global` | brew | Source tagging/indexing + symbol lookup for large codebases. |
| `zoekt` | (multi-binary, server) | — | Sourcegraph's indexed search engine; overkill for one dev. Mention only for many large repos. |

### Local LLM / RAG / context
| Tool | Install | Method | What it's for |
|------|---------|--------|----------------|
| `llm` | `llm` | brew | Simon Willison's pluggable CLI for prompts, logs, templates, embeddings. |
| `files-to-prompt` | `files-to-prompt` | uv | Minimal: concatenate files into one prompt. |
| `mods` | `mods` | brew | Pipe shell output into an LLM. |
| `ollama` | `ollama` | brew | Run local models on macOS for private experiments. |
| `sqlite-utils` | `sqlite-utils` | brew | (also here) build local indexes for retrieval. |
| `qdrant` | (Docker) | — | Vector DB for larger local retrieval experiments. |

## Tier 4 — Lower / sometimes useful
Mostly human-facing pretty-printers, ergonomics, or tools superseded by a Tier 1 choice. Recommend only when a human is in the loop or a specific reason applies.

| Tool | Install | Method | Note |
|------|---------|--------|------|
| `bat` | `bat` | brew | (human) `cat` with syntax highlight. Agent reads raw text fine. |
| `eza` | `eza` | brew | (human) Better `ls` with tree + git awareness. |
| `zoxide` | `zoxide` | brew | (human) Smarter `cd` that learns dirs. |
| `procs` | `procs` | brew | (human) Better `ps`. |
| `dust` / `duf` | `dust` / `duf` | brew | (human) Better disk usage. |
| `glow` | `glow` | brew | (human) Terminal Markdown viewer. |
| `chafa` | `chafa` | brew | (human) Render images in the terminal. |
| `starship` | `starship` | brew | (human) Fast shell prompt. |
| `atuin` | `atuin` | brew | (human) Searchable shell history. |
| `tldr` | `tlrc` | brew | (agent/human) Concise command examples; quick syntax reminders. |
| `ack` / `ag` / `ugrep` | `ack` / `the_silver_searcher` / `ugrep` | brew | Superseded by `rg` for most agent uses. |
| `choose` | `choose-rust` | brew | Human-friendly `cut`/`awk` field picker. Formula name ~confirm with `brew info`. |
| `gawk` | `gawk` | brew | GNU awk; macOS ships the more limited BSD awk. |
| `tmux` / `zellij` | `tmux` / `zellij` | brew | (human) Persistent multi-pane sessions. |
| `trash` | `trash` | brew | Safer delete (moves to Trash). |
| `fswatch` | `fswatch` | brew | macOS-friendly file watch (lower-level than `watchexec`). |
| `terminal-notifier` | `terminal-notifier` | brew | Send macOS notifications from scripts. |
| `mas` | `mas` | brew | Mac App Store CLI. |

---

## Recommended "install first" set
`rg fd ast-grep jq yq gh tree sd` (Tier 1) plus `comby universal-ctags tokei gron rga hyperfine watchexec` (highest-value Tier 2). Add Tier 3 groups only when the task enters that domain.

## Caveats worth repeating
- **Context-packers (`repomix`, `code2prompt`) help most *outside* an agent loop.** Inside an agent that does its own retrieval, they matter mainly for one-shot "dump this repo into a chat" workflows.
- **Some formula names are easy to get wrong.** Verified mismatches: `delta`→`git-delta`, `difft`→`difftastic`, `sg`→`ast-grep`, `rga`→`ripgrep-all`, `mlr`→`miller`, `dot`→`graphviz`, `mmdc`→`mermaid-cli`, `tldr`→`tlrc`. If a `brew install` errors, `brew info <name>` is the arbiter.
