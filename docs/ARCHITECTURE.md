# Architecture

- `src/promptscore/`: Python developer tooling; not shipped in Chrome.
- `scripts/score_prompt.py`: grades one prompt file into `reports/<timestamp>_<stem>/`.
- `prompt-templates/`: structural rubric and the characteristics it implements.
- `sample-prompts/`: dummy prompts for the grader.
- `reports/`: generated grade reports. Gitignored except `reports/README.md`.
- `tests/`: offline unit and CLI contract tests, with hermetic fixture controls.
- `prompts/`: versioned prompt experiments and comparison guidance.
- `scripts/polymath/`: installer-owned QA and skill script packs.
- `.agents/skills/`, `.claude/skills/`: installed skill discovery lanes.
- `docs/polymath-install.toml`: installer-owned composition and provenance.
- `dist/reports/`: ignored QA output.

The Chrome extension framework and source layout are undecided. Before building,
verify the current Manifest V3 requirements in official Chrome documentation.
Use minimal permissions, keep credentials out of client bundles, treat page text
as untrusted input, and test extension behavior in a real loaded-extension browser.
A normal web-page test does not prove extension service-worker or permission behavior.

Validation commands are maintained in the root README. No remote publishing,
CI workflow, provider credentials, or extension product code is configured.
