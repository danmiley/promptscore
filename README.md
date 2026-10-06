# Promptscore

Chrome extension project for developing and assessing prompts. The extension,
model providers, and permissions are still to be designed. An offline structural
grader is `scripts/score_prompt.py`.

## Development harness

Python 3.12 and uv power offline development tooling; Python is not the extension runtime.

```sh
uv sync --locked
uv run ruff check
uv run ruff format --check
uv run pyright
uv run pytest
uv run promptscore-dev --json doctor
uv run python scripts/score_prompt.py sample-prompts/thin-request.md
bash scripts/polymath/python-test-harness/check_quality.sh
bash scripts/polymath/python-test-harness/run_qa_matrix.sh
bash scripts/polymath/check-readiness.sh --target . --ide both
```

`scripts/score_prompt.py` grades one prompt file and writes `score.md`,
`markup.md`, and `ideal.md` under `reports/<timestamp>_<stem>/`. That grade
is structural. It does not call a model.

`check_quality.sh` and `run_qa_matrix.sh` write JSON and HTML reports to ignored
`dist/reports/`. Gates start advisory under `scripts/polymath/python-test-harness/project.env`; direct ruff, pyright,
and pytest commands fail on errors. Empty golden/bench lanes are reported as skipped.
Test isolation blocks Python socket connections and redirects HOME/XDG directories;
subprocesses need their own network isolation if they later do more than diagnostics.

## Skills and prompts

Skill inventory and installation provenance: `docs/polymath-install.toml`.
Codex discovers `.agents/skills/`; Claude Code discovers `.claude/skills/`.
Use `superprompt` to vet and execute a request. Use `frontier-prompt-uplift`
for an existing prompt with an identified model and diagnosed mismatch.
Prompt uplift produces proposals; apply them only after authorization.

See `prompts/README.md` for prompt experiment records. Browser QA skills are
installed, but extension code, browser dependencies, and browser tests are not yet scaffolded.

## Search and source evidence

Use `project-web-search` for local-first research, Brave Search MCP queries,
primary-source verification, citations, and search-effort notes. Read its
`references/brave-search-api.md` in the active skill lane for API key visibility,
serial calls, small result counts, and rate-limit backoff.

Use `retrieve-source-evidence` when sources need to be saved with provenance: it
routes static fetches, alternate paths, archives, data endpoints, browser renders,
and mirrors, and distinguishes real content from empty shells or access barriers.
Its offline classifier is available at
`scripts/polymath/retrieve-source-evidence/classify_content.py`.

Brave MCP access belongs to the running agent session. Skill installation does
not configure an MCP server. Verify a live Brave tool call in each new session;
separately probe `BRAVE_API_KEY` presence for scripts. Never put the key in
extension source or committed configuration. Record research in
`docs/background-research.md`.
