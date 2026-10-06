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

- `extension/`: Chrome Manifest V3 extension package with native Side Panel API.
  - `manifest.json`: Minimal permissions (`sidePanel`, `activeTab`, `scripting`), native `side_panel` declaration.
  - `background.js`: Service worker registering `openPanelOnActionClick`.
  - `content_script.js`: Sandboxed untrusted input extraction from composer/selection, safe replacement.
  - `sidepanel.html`, `sidepanel.css`, `sidepanel.js`: Isolated extension origin UI rendering the 3 artifacts (Score, Markup, Golden).
  - `extension/engine/`: Pure JavaScript deterministic grader (`grader.js`, `rubric_data.js`, `rubric.json`) with verified 100% mathematical parity to Python.
- `mockups/extension-ux/`: Interactive UX explorer and prototype environment.

The Chrome extension uses the native `chrome.sidePanel` API rather than in-page injection.
This guarantees origin sandboxing (Claude's or ChatGPT's CSS/scripts cannot leak into the panel),
treats page text strictly as untrusted string data, and runs 100% offline without remote models or backend servers.
Extension behavior is verified in real loaded-extension Chromium via Playwright (`tests/test_extension_browser.js`).
