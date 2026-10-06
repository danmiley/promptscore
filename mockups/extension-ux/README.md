# PromptScore — Extension UX Exploration & Interactive Prototype

This prototype explores the user experience for the **PromptScore** browser extension (Chrome Manifest V3 & Claude Web Workspace). It translates the offline structural prompt grading logic from `src/promptscore` and `prompt-templates/rubric.toml` into an intuitive, real-time feedback surface directly inside AI chat interfaces.

---

## The 3 Core Artifacts

1. **Artifact 1: Bold Credit Score & Diagnostics (300–850 FICO-style scale)**
   - **Score Hero**: Radial gauge dial illustrating the 300 to 850 credit range.
   - **Tiers & Bands**: 
     - `Disciplined` (750–850, Emerald)
     - `Capable` (650–749, Blue)
     - `Usable` (500–649, Amber)
     - `Developing` (300–499, Red)
   - **Why This Score**: Clear diagnosis of missing vs. fulfilled criteria (observable finish line, reported checks, boundaries).
   - **How to Raise It**: Actionable point-bearing recommendations (e.g. `+90 pts: Add an observable finish line`).
   - **Structural Rubric Breakdown**: Expandable table of the 8 rubric dimensions with weights and fulfillments.

2. **Artifact 2: Detailed Prompt Markup & Annotation**
   - Segment-by-segment decomposition of the user's prompt text.
   - Color-coded badges:
     - `Preserve` (green left-border): Retains user's intent, named paths, and strict constraints.
     - `Refine` (amber left-border): Flags vague adjectives, missing checks, or unverified outputs.
   - Rationale and concrete suggestions for each block.

3. **Artifact 3: Canonical Golden Prompt**
   - The rewritten/ideal prompt based on superprompt characteristics.
   - Visually highlights what was preserved vs. what non-prescriptive finish line / check was appended.
   - Actions:
     - **Copy Golden**: Copies to clipboard.
     - **Insert into Chat Composer**: Replaces draft text directly in Claude's prompt input with one click.

---

## 3 Presentation Modes Explored

| Presentation Mode | Placement & Behavior | Best For |
| :--- | :--- | :--- |
| **1. Docked Side Panel** *(Chrome Side Panel API)* | Right-docked persistent panel with 3 tabs (`Credit Score`, `Markup`, `Golden Prompt`). | Deep prompt engineering, editing while reading feedback side-by-side without covering the chat stream or prompt composer. |
| **2. In-Situ Floating HUD** *(Contextual Popover)* | Floating glassmorphism card positioned directly above the prompt composer. | Fast in-flow checks, minimal distraction, 1-click golden prompt application (+180 pts). |
| **3. Split Workbench** *(Comparison Modal)* | Full-width glassmorphism dialog showing side-by-side comparison of draft vs. golden prompt with a central score gain indicator (`+249 GAIN`). | Comprehensive reviews before sending high-stakes or destructive prompt tasks to an AI model. |

---

## Running the Interactive Mockup Locally

Start a local HTTP server:
```bash
python3 -m http.server 8765 --directory mockups/extension-ux
```

Open in any browser:
```
http://localhost:8765/index.html
```
