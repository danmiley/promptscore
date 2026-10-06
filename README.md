# PromptScore ✦

> An offline, privacy-first AI prompt assessment engine and Chrome Side Panel extension that evaluates prompt maturity on a 300–850 credit score scale, annotates structural gaps, and generates canonical Golden Prompts directly beside Claude, ChatGPT, and local LLM chat interfaces.

---

## 🎯 Project Goals

Most AI prompts suffer from silent failure modes: vague adjectives ("make it robust and professional"), absent finish lines ("write a script to fix the bug"), missing output contracts, and unchecked multi-step instructions. These issues cause models to drift, invent unverified changes, or stop short of the actual goal.

**PromptScore** solves this directly in your chat workflow:
- **Instant Structural Evaluation**: Computes a deterministic 300–850 credit score for any draft prompt in `< 2ms` without calling any external LLM or backend server.
- **Actionable Critique**: Marks up prompt segments with specific recommendations to raise the score before triggering long-running model generations.
- **One-Click Golden Rewrite**: Appends verifiable finish lines, boundary constraints, and pass/fail checks while preserving the author's original intent, and injects the improved prompt directly into your chat composer.
- **Zero Privacy Risk**: 100% offline client-side evaluation. Your prompts, code snippets, and confidential context never leave your browser.

---

## ✨ Features & The Three Core Artifacts

PromptScore presents three synchronized artifacts in a docked Chrome Side Panel alongside your active chat:

### 1. 📊 Bold Credit Score (300–850 FICO-Style Scale)
- **Animated Credit Gauge**: Radial gauge dynamically illustrating score maturity.
- **Four Distinct Maturity Bands**:
  - `Developing` (300–499, Red): High ambiguity; prone to model misinterpretation.
  - `Usable` (500–649, Amber): Outcome is visible, but lacks verifiable finish lines or boundary constraints.
  - `Strong` (650–749, Blue): Clear outcome, boundaries, and expected output format.
  - `Disciplined` (750–850, Emerald): Battle-tested structure with concrete, executable pass/fail checks.
- **"Why This Score" Diagnostics**: Explicit checklist of satisfied vs. missing rubric dimensions and vague-word penalties.
- **Points-Bearing Improvement Tips**: Shows exactly which additions earn the highest score gains (e.g., `+90 pts: Add an observable finish line`).
- **Full Structural Rubric Accordion**: Transparent breakdown across all 8 characteristics, weights, and evidence triggers.

### 2. 📝 Interactive Prompt Markup & Annotation
- **Logical Segment Breakdown**: Dissects your prompt into sentences and distinct clauses.
- **Visual Status Badges**:
  - `Preserve` (Green): Identifies well-specified outcomes, explicit files, or clear boundaries.
  - `Refine` (Amber): Highlights vague wording, soft completion criteria, or unchecked steps.
- **Inline Actionable Suggestions**: Provides surgical edits without rewriting your core task.

### 3. 🏆 Canonical Golden Prompt
- **Superprompt-Disciplined Architecture**: Keeps your exact words while appending structured sections:
  - `Done when:` Observable completion criteria with concrete checks.
  - `Constraints:` Boundary conditions preventing unauthorized changes or hallucinations.
  - `Output:` Precise output format specifications.
  - `Verify:` Commands or inspection steps to validate the output.
  - `Plan:` Per-step pass/fail verification for multi-part tasks.
- **One-Click "⚡ Insert into Chat Composer"**: Directly replaces your draft prompt in Claude (`div.ProseMirror`) or ChatGPT (`#prompt-textarea`) using synthetic input events.
- **One-Click Copy**: Copies the Markdown/plaintext Golden Prompt to your clipboard.

---

## 🚀 Step-by-Step Installation Instructions

### Option A: Install the Chrome Extension (For Users & Reviewers)

> **No build steps, no Python, no Node.js, and no API keys required.** The extension is completely self-contained.

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/your-username/promptscore.git
   cd promptscore
   ```
   *(Or download and extract the ZIP archive from GitHub).*

2. **Open Google Chrome Extensions**:
   - In Chrome's URL bar, type:
     ```
     chrome://extensions
     ```
     and press Enter.

3. **Enable Developer Mode**:
   - In the top-right corner of the Extensions page, toggle the **Developer mode** switch **ON**.

4. **Load the Unpacked Extension**:
   - Click the **Load unpacked** button in the top-left corner.
   - In the file picker, select the **`extension`** folder inside this repository:
     ```
     /path/to/promptscore/extension
     ```
   - Click **Select** / **Open**.
   - You will see the **PromptScore — Prompt Credit Score** card appear in your extensions list.

5. **Pin the Extension (Recommended)**:
   - Click the puzzle piece icon (Extensions) in Chrome's top toolbar.
   - Find **PromptScore** and click the pin icon 📌 to keep it visible in your toolbar.

6. **Start Using PromptScore**:
   - Navigate to [Claude](https://claude.ai) or [ChatGPT](https://chatgpt.com).
   - Click the **PromptScore** icon in your Chrome toolbar (or press `Alt + S` / `Option + S`).
   - The PromptScore Side Panel will dock alongside your chat window.
   - Type or paste any prompt into Claude or ChatGPT: the side panel will detect your input and score it in real time!

---

### Option B: Developer Setup & CLI Grader (Python 3.12 + uv)

If you are developing the rubric, running tests, or using the offline command-line prompt grader:

1. **Prerequisites**:
   - [uv](https://docs.astral.sh/uv/) (fast Python package manager)
   - Python 3.12+
   - Node.js 18+ (for running the JavaScript engine parity test suite)

2. **Install Dependencies**:
   ```bash
   uv sync --locked
   ```

3. **Run Quality Gates & Parity Tests**:
   ```bash
   # Run Python unit tests
   uv run pytest

   # Run Python linter and format checks
   uv run ruff check
   uv run ruff format --check
   uv run pyright

   # Verify 100% mathematical parity between Python and JS extension engines
   node tests/test_js_parity.js
   ```

4. **Grade Prompts via the Command Line**:
   ```bash
   uv run python scripts/score_prompt.py sample-prompts/thin-request.md
   ```
   Outputs markdown reports (`score.md`, `markup.md`, `ideal.md`) under `reports/<timestamp>_<stem>/`.

5. **Run the Standalone Interactive UX Playground (No Extension Required)**:
   ```bash
   python3 -m http.server 8765 --directory mockups/extension-ux
   ```
   Open `http://localhost:8765/index.html` in your browser to test the side panel prototype with built-in presets.

---

## 🔒 Architecture & Privacy Guarantees

```
┌─────────────────────────────────────────────────────────────┐
│ Chrome Browser                                              │
│                                                             │
│  ┌─────────────────────────┐   ┌──────────────────────────┐ │
│  │ Web Page (claude.ai)    │   │ Side Panel (Docked)      │ │
│  │                         │   │                          │ │
│  │  ┌───────────────────┐  │   │  ┌────────────────────┐  │ │
│  │  │ Chat Composer     │  │   │  │ 1. Credit Score    │  │ │
│  │  │ (ProseMirror/DOM) │  │   │  │    Dial (300-850)  │  │ │
│  │  └─────────┬─────────┘  │   │  │                    │  │ │
│  │            │            │   │  │ 2. Prompt Markup   │  │ │
│  │  ┌─────────▼─────────┐  │   │  │                    │  │ │
│  │  │ Content Script    ├──┼───┼─►│ 3. Golden Prompt   │  │ │
│  │  │ (Live Input Sync) │  │   │  │    [⚡ Insert]     │  │ │
│  │  └───────────────────┘  │   │  └─────────┬──────────┘  │ │
│  └─────────────────────────┘   │            │             │ │
│                                │  ┌─────────▼──────────┐  │ │
│                                │  │ Offline JS Engine  │  │ │
│                                │  │ (grader.js) < 2ms  │  │ │
│                                │  └────────────────────┘  │ │
│                                └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- **Zero Network Ingestion**: The extension does not configure or require an external server, proxy, or cloud endpoint. All evaluation occurs in-memory.
- **Isolated Extension Origin**: The Side Panel runs under `chrome-extension://<id>/sidepanel.html` with dedicated DOM and CSS encapsulation.
- **Deterministic Pure JS Engine**: The client engine (`extension/engine/grader.js`) is compiled from the project's canonical rubric TOML and executes in `< 2ms`.
- **Minimal Permissions**: Requests only `"sidePanel"`, `"activeTab"`, and `"scripting"` with host permissions scoped to supported chat surfaces.

---

## 📂 Repository Layout

| Directory / File | Description |
|---|---|
| `extension/` | **Complete Chrome Manifest V3 extension** (Side Panel, content script, offline engine, icons). |
| `extension/engine/` | Pure JavaScript deterministic grader and compiled JSON rubric data. |
| `prompt-templates/` | Canonical scoring rubric definition (`rubric.toml`). Single source of truth. |
| `src/promptscore/` | Python reference implementation of grading rubric and CLI tools. |
| `mockups/extension-ux/` | Standalone browser prototype for UX exploration. |
| `sample-prompts/` | Benchmark prompt corpus (`thin-request.md`, `partial-task.md`, `disciplined-task.md`, etc.). |
| `scripts/` | Tooling: `export_rubric_json.py`, `generate_icons.js`, and `score_prompt.py`. |
| `tests/` | Test suites: pytest test lanes, `test_js_parity.js`, and Playwright browser tests. |
| `docs/` | Architecture document, engineering logs, and durable AI memory. |

---

## 🔄 Syncing Rubric Updates

When modifying scoring rules, weights, or insert templates in `prompt-templates/rubric.toml`, sync the extension with:

```bash
# 1. Compile TOML to extension JS/JSON
uv run python scripts/export_rubric_json.py

# 2. Run Python tests and verify exact parity
uv run pytest
node tests/test_js_parity.js
```
