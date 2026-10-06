# CLI Tools, by Task

Task-first decision guide. Find the row that matches what you actually need to do; the first tool listed is the default, alternates follow with the condition that makes them the better pick.

## Search & code intelligence
| I need to… | Default | Alternate (when) |
|------------|---------|------------------|
| Search file contents | `rg` | `git grep` (inside a Git repo, no extra deps); `rga` (search PDFs/Office/archives) |
| Find a structural code pattern (not text) | `ast-grep` | `comby` (cross-language structural rewrite); `semgrep` (rule-based, security/lint) |
| Rewrite code by structure across a repo | `comby` | `ast-grep` (tree-sitter pattern); `sd` (simple textual replace) |
| Find files by name/type | `fd` | `git ls-files` (only tracked files) |
| Build a symbol index | `universal-ctags` | `gtags` (GNU GLOBAL, large repos); `csearch`/`cindex` (indexed regex over huge monorepo) |
| Near-instant regex over a huge repo | `csearch` (+`cindex`) | `gtags`; `zoekt` (server, many repos) |
| Understand repo composition / size | `tokei` | `scc` (adds complexity/COCOMO); `git-sizer` (pathology before feeding to a model) |
| Get a directory overview | `tree` | `fd` (filtered listings); `git ls-files` |

## Structured data & text
| I need to… | Default | Alternate (when) |
|------------|---------|------------------|
| Query/transform JSON | `jq` | `gron` (flatten to greppable lines, then `rg`); `dasel` (multi-format, one syntax) |
| Query/transform YAML/TOML/XML | `yq` | `dasel` (mixed formats) |
| Turn CLI output into JSON | `jc` | — |
| Find/replace in a stream | `sd` | `sed` (when already scripted); `comby` (structural) |
| Work with CSV/TSV records | `mlr` (Miller) | `xsv` (fast slice/stat/join); `sqlite-utils` (load + SQL) |
| Pick a column/field | `choose` | `cut`/`awk` (already in muscle memory) |

## Diffing & review (mostly human-facing)
| I need to… | Default | Alternate (when) |
|------------|---------|------------------|
| Review a code diff (human) | `difftastic` | `delta` (syntax-highlight pager for git) |
| Compare two images | `odiff` | `magick compare` (heat map); `perceptualdiff` (ignore invisible deltas); `dssim` (SSIM) |
| Guard commits | `pre-commit` | language-native hooks |

## Documents & media
| I need to… | Default | Alternate (when) |
|------------|---------|------------------|
| Lint Markdown/CommonMark | `markdownlint` | — |
| Convert document formats | `pandoc` | `textutil` (macOS builtin, RTF/DOC/HTML/TXT) |
| Extract text from a PDF | `pdftotext` (poppler) | `marker`/`docling` (→ structured Markdown); `ocrmypdf`+`tesseract` (scanned) |
| OCR an image/scan | `tesseract` | `ocrmypdf` (PDF in/out) |
| Inspect media metadata | `exiftool` | `ffprobe` (video/audio) |
| Render a diagram from text | `mmdc` (mermaid) | `dot` (graphviz, dependency graphs); `plantuml` (UML) |

## Run-loops, build, benchmark
| I need to… | Default | Alternate (when) |
|------------|---------|------------------|
| Run an agentic coding task from a terminal or script | `codex` (`codex exec` for non-interactive runs) | An IDE-native agent (when editor context and interactive review are primary) |
| Re-run on file change | `watchexec` | `entr` (minimal); `fswatch` (macOS-native, lower-level) |
| Benchmark a command | `hyperfine` | — |
| Run project tasks | `just` | `make` (already present) |
| Manage tool/lang versions | `mise` | `asdf` |

## HTTP & web
| I need to… | Default | Alternate (when) |
|------------|---------|------------------|
| Poke a JSON API | `xh` | `curl` (baseline, always present); `httpie` (Python) |
| Fetch / mirror | `curl` | `wget` (recursive); `aria2` (parallel) |
| Extract page text | (project-web-search skill / Chrome MCP) | `lynx`/`w3m` (terminal render) |

## Safety & supply chain
| I need to… | Default | Alternate (when) |
|------------|---------|------------------|
| Scan for secrets | `gitleaks` | `trufflehog` (deep history); `detect-secrets` (baseline) |
| Scan deps for CVEs | `osv-scanner` | `trivy` (also IaC/containers); `grype` (+`syft` for SBOM) |
| Generate an SPDX/CycloneDX SBOM | `syft` | `cdxgen` (ecosystem-specific alternative) |
| Broad static analysis | `semgrep` | language-native linters (see language-clusters.md) |

## Release compatibility
| I need to… | Default | Alternate (when) |
|------------|---------|------------------|
| Check a Rust library release for public-API semver breaks | `cargo semver-checks --baseline-rev <pinned-revision>` | Repo-configured registry/local rustdoc baseline |

## Packing a repo for a model
| I need to… | Default | Alternate (when) |
|------------|---------|------------------|
| Dump a repo into one prompt | `repomix` | `code2prompt` (token counts); `files-to-prompt` (minimal subset) |
| Run a prompt from the shell | `llm` | `mods` (pipe stdout in) |

> Note: inside an agent that does its own retrieval, repo-packers are for one-shot "hand this codebase to a chat" use, not the agent's own loop.
