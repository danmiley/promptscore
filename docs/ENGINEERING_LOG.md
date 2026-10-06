# Engineering Log

## 2026-10-05: Search skill additions

Preserved the existing tool track and add-ons; added `web-search` and
`retrieve-evidence` through the installer for both IDE lanes. The lockfile
records project-web-search v3 and retrieve-source-evidence v3. README now routes
research and retrieval tasks to their contracts, including Brave MCP/API notes.

Capability check in the installing session: Brave web search returned live
results for an official Chrome documentation query (one call, no rate limit).
A non-interactive zsh probe saw BRAVE_API_KEY present without printing its value.
This proves tool access in this session and key visibility for that shell; it
does not establish future session access or successful direct API authentication.
No credentials or machine-local MCP configuration were copied into this repo.

Validation: installer readiness OK; installed classifier self-test passed;
lockfile-owned files match their SHA-256 hashes; git diff --check clean.
Readiness retains warnings for untracked onboarding files.

## 2026-10-05: Fresh repository onboarding

Installed the Polymath tool track into both Codex and Claude discovery lanes.
Composition and source versions are recorded in `polymath-install.toml`.
Selected prompt skills: superprompt and frontier-prompt-uplift. Supporting skills
cover Python bootstrap/style/testing, browser QA, frontend bootstrap, independent
audits/remediation, agentic debugging, CLI tools, and durable repo memory.

Bootstrapped a uv-managed Python 3.12 developer package from installed templates,
with committed-ready lockfile, strict pyright, ruff, pytest, no-network fixtures,
isolated HOME/XDG, and CLI diagnostics. Python is developer tooling, not the
Chrome extension runtime. No credentials or live model calls are configured.

Validation: uv sync; ruff check; ruff format --check; pyright (zero errors);
pytest (five passed); JSON doctor; Python quality and matrix scripts (pass,
advisory); memory audit (zero failures); installer readiness (OK); diff whitespace
check. QA reports live under ignored `dist/reports/`. Golden and bench lanes are
empty; optional pip-audit is disabled. Files are not yet staged or committed, so
readiness reports checkout-local tracking warnings. No extension browser tests
have run because the extension has not been implemented.

Next decisions: product workflow, scoring acceptance criteria, Manifest V3
architecture, minimal permissions, provider/backend boundary, then a browser
harness that loads the real extension. Prompt comparison records begin under
`prompts/README.md`; offline checks do not prove prompt/model quality.

## 2026-10-05: Offline structural grader prototype

Added `scripts/score_prompt.py`. It reads one UTF-8 prompt file, scores it
from `prompt-templates/rubric.toml` on a 300-850 scale, and writes
`score.md`, `markup.md`, and `ideal.md` under
`reports/<YYYYMMDD-HHMMSS>_<stem>/`. Generated report directories are
gitignored. `reports/README.md` stays tracked.

The rubric is the operational form of `prompt-templates/characteristics.md`,
taken from the superprompt shape of a prompt: named outcome, observable
finish line, boundaries, output shape, named inputs, a reported check,
stop conditions only for hard-to-undo work, and per-step checks only when
the prompt numbers two or more deliverables. Keyword frequency does not
raise the score. A numbered list marker is not treated as concrete evidence.
The rewriter keeps the author's words and appends at most four missing
sections. A destructive request may add a stop line past that cap. A prompt
already past the rewrite threshold is copied through unchanged.

Assumption: this is a deterministic text grade, not a model judge. If that
is the wrong product, the script and `prompt-templates/` can be replaced
without touching the extension, which is still unbuilt. Logic lives in
`src/promptscore/` so pytest and pyright can see it; the script is the entry.

Verified this session: ruff check, ruff format, pyright (zero errors),
pytest (25 passed). Sample scores from that run: `thin-request.md` 331
Developing, `partial-task.md` 567 Usable, `disciplined-task.md` 816
Disciplined, `multi-part-unchecked.md` 337 Developing. `disciplined-task.md`
was not rewritten. Residual risk: a backtick or the word pytest near a
finish-line label still grants full credit for that row, and the ideal
text stays generic when the source prompt is generic.
