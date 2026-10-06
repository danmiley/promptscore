# Engineering Log

## 2026-10-05: Real-time tab sync & Claude ProseMirror bridge

Hardened the active tab communication bridge for real-world AI chat pages
(Claude.ai, ChatGPT):
- Resolved initial-load sync issue where tabs opened before extension loading
  did not execute content scripts. Added `host_permissions` in `manifest.json`,
  auto-injection across open tabs on install/reload in `background.js`, and
  dynamic `chrome.scripting.executeScript` fallback on first query/replace in
  `sidepanel.js`.
- Expanded composer detection to support Claude's ProseMirror DOM structure
  (`div[contenteditable="true"].ProseMirror`) and ChatGPT's `#prompt-textarea`.
- Implemented robust rich-text replacement: uses `document.execCommand('insertText')`
  with multi-line paragraph element fallback and synthetic `InputEvent` dispatch,
  notifying ProseMirror / React state machines.
- Added proactive live typing synchronization: content script listens to debounced
  `input` and `selectionchange` events, streaming `PROMPT_CHANGED` events to the
  side panel for real-time score updates as the user types.
- Fixed Golden Prompt insert generator in `extension/engine/grader.js`: rubric
  parsing was looking up `ins.dimension_id` instead of `ins.dimension`, causing
  all insert keys to be undefined and suppressing golden prompt enhancements.
  Corrected field mapping, updated `tests/test_js_parity.js` to assert exact
  string match with Python `improved_prompt()`, and confirmed 100% parity across
  all sample prompts (`thin-request.md`, `partial-task.md`, `disciplined-task.md`,
  `multi-part-unchecked.md`).
- Authored and verified `tests/test_extension_live_sync.js` in Chromium confirming
  end-to-end composer reading, golden prompt generation, and live DOM replacement.


## 2026-10-05: Chrome Manifest V3 side panel extension & JS grader port

Closed UX exploration on the Docked Side Panel and implemented the complete
first vertical slice of the Chrome Manifest V3 extension under `extension/`.

Key components delivered:
1. Deterministic Grader Port (`extension/engine/grader.js` & `rubric_data.js`):
   - Converted `prompt-templates/rubric.toml` into client-side JS.
   - Ported 8 rubric dimensions, length factor, vague word penalty, segment
     annotations, and superprompt rewriter with 100% mathematical parity.
   - Parity test (`tests/test_js_parity.js`) confirms identical scores, bands,
     weights, and words across all sample prompts (`thin-request.md`, `partial-task.md`,
     `disciplined-task.md`, `multi-part-unchecked.md`).
2. Manifest V3 Extension Package (`extension/`):
   - `manifest.json`: Uses `sidePanel` and `activeTab` permissions (minimal footprint).
   - `background.js`: Service worker registers `openPanelOnActionClick`.
   - `content_script.js`: Safely reads active prompt/selection and dispatches
     framework-compatible input events on replacement.
   - `sidepanel.html` & `sidepanel.css`: Isolated extension origin rendering the
     3 artifacts (Credit Score, Prompt Markup, Canonical Golden Prompt).
   - `sidepanel.js`: Handles live grading and active tab messaging.
3. Verification in Loaded-Extension Chromium:
   - Authored `tests/test_extension_browser.js` using Playwright with `--load-extension`.
   - Verified service worker initialization, extension ID generation, side panel
     rendering, and interactive score recalculation.


## 2026-10-05: PromptScore extension UX mockup & presentation models

Built an interactive browser prototype under `mockups/extension-ux/` to
explore and evaluate user experience architectures for the PromptScore Chrome
and Claude extension.

The prototype implements the three target artifacts grounded in the existing
structural rubric (`prompt-templates/rubric.toml` and `src/promptscore`):
1. Bold Credit Score: 300–850 FICO-style scale with radial gauge, 4-tier
   bands (Developing, Usable, Capable, Disciplined), "Why this score" rationale,
   "How to raise it" points-bearing tips, and expandable 8-dimension rubric.
2. Prompt Markup & Annotation: Segmented breakdown of the draft prompt
   with colored tags (Preserve/Refine), rationale, and structural edits.
3. Canonical Golden Prompt: Idealized prompt retaining user's intent with
   observable finish lines and verification checks, with one-click clipboard
   copy and direct insertion into Claude's prompt composer.

Explored three UX presentation paradigms:
- Mode 1: Docked Side Panel (Chrome Side Panel API / Slide-out drawer).
- Mode 2: In-Situ Floating HUD (Contextual flyout above composer).
- Mode 3: Split Workbench (Side-by-side comparison modal with score gain indicator).

Validation: Hermetic static delivery on local HTTP server, verified interactive
state transitions and screenshot captures with Playwright across three prompt
presets (`partial-task.md` 567 Usable, `thin-request.md` 331 Developing, and
`disciplined-task.md` 816 Disciplined).


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
