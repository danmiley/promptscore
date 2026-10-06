# Prompt templates

Structural scoring for `scripts/score_prompt.py`. No model calls.

| File | Role |
| --- | --- |
| `characteristics.md` | What a high-quality prompt is, and what the rewriter refuses to add. |
| `rubric.toml` | Weights, signals, bands, and the section text the rewriter may insert. |

The script loads `rubric.toml`. Edit that file to change scores. Update
`characteristics.md` in the same change when the intent changes.
