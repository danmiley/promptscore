# PromptScore — Chrome Side Panel Extension ✦

An offline, privacy-first Chrome Side Panel extension that evaluates your AI prompts on a 300–850 credit score scale, provides interactive structural markup, and generates canonical Golden Prompts directly beside Claude, ChatGPT, and other AI chat interfaces.

---

## 🎯 Goals

Most AI prompts fail silently due to vague adjectives, missing finish lines, and unstated verification checks. PromptScore brings instant, offline structural grading directly into your chat workflow:
- **Instant Feedback**: Scores any prompt in `< 2ms` with zero external calls or LLM costs.
- **Visual Diagnostics**: Identifies which phrases carry weight and which create ambiguity.
- **One-Click Golden Fix**: Rewrites the prompt to superprompt best practices and injects it straight into your chat composer.
- **100% Privacy**: Evaluates completely in-memory on your machine. Your prompts never leave your browser.

---

## ✨ The Three Core Artifacts

1. **📊 Bold Credit Score (300–850 FICO-Style Scale)**:
   - Animated radial gauge illustrating prompt maturity.
   - 4-Tier Bands: `Developing` (300–499), `Usable` (500–649), `Strong` (650–749), `Disciplined` (750–850).
   - "Why this score" checklist and points-bearing tips (`+90 pts: Add an observable finish line`).
   - Transparent 8-characteristic rubric accordion.

2. **📝 Interactive Prompt Markup**:
   - Sentence-by-sentence parsing with `Preserve` (green) and `Refine` (amber) tags.
   - Actionable inline suggestions to eliminate vague words and add pass/fail checks.

3. **🏆 Canonical Golden Prompt**:
   - Idealized rewrite adhering to superprompt discipline (`Done when:`, `Constraints:`, `Output:`, `Verify:`).
   - **One-Click "⚡ Insert into Chat Composer"**: Directly replaces your draft in Claude (`div.ProseMirror`) or ChatGPT (`#prompt-textarea`).
   - One-click clipboard copy.

---

## 🚀 Step-by-Step Installation Instructions

> **No build steps, no Python, no Node.js, and no API keys required.** The extension is completely self-contained.

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/your-username/promptscore.git
   ```
   *(Or download the ZIP archive from GitHub and extract it).*

2. **Open Chrome Extensions**:
   - Open Google Chrome.
   - In the address bar, type `chrome://extensions` and press **Enter**.

3. **Turn On Developer Mode**:
   - In the top-right corner of the page, toggle the **Developer mode** switch to **ON**.

4. **Load the Extension**:
   - Click the **Load unpacked** button in the top-left corner.
   - In the file dialog, navigate to and select this **`extension`** folder:
     ```
     /path/to/promptscore/extension
     ```
   - Click **Select** / **Open**.
   - The **PromptScore — Prompt Credit Score** extension card will now appear in your list.

5. **Pin the Extension**:
   - Click the puzzle piece icon (Extensions) in Chrome's top toolbar.
   - Find **PromptScore** and click the pin icon 📌 so it stays accessible in your toolbar.

6. **Open Your AI Chat & Start Scoring**:
   - Go to [Claude](https://claude.ai) or [ChatGPT](https://chatgpt.com).
   - Click the **PromptScore** icon in your Chrome toolbar (or press `Alt + S` on Windows/Linux, `Option + S` on Mac).
   - The PromptScore Side Panel will dock on the right side of your window.
   - As you type or select prompt text, your score and suggestions update live!

---

## 🛡 Privacy & Technical Architecture

- **Offline by Design**: All evaluation runs client-side via a deterministic pure-JavaScript rubric engine (`engine/grader.js`).
- **Zero Remote Dependencies**: Zero API requests, zero third-party telemetry, zero external CDNs.
- **Isolated Side Panel**: Runs under Chrome's isolated `chrome-extension://` origin, safe from webpage CSS conflicts and script sniffing.
- **Minimal Permissions**: Scoped only to `"sidePanel"`, `"activeTab"`, and `"scripting"` on supported chat surfaces (`claude.ai`, `chatgpt.com`, `localhost`).

---

## 🛠 For Developers: Recompiling the Rubric

If you modify the canonical rubric rules in `prompt-templates/rubric.toml`, recompile the extension's offline engine with:

```bash
# Recompile TOML to extension JS/JSON
python3 scripts/export_rubric_json.py

# Verify exact mathematical and golden prompt parity
node tests/test_js_parity.js
```
