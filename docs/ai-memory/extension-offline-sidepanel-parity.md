# Extension Offline Sidepanel and Grader Parity

The Chrome extension uses MV3 Side Panel with isolated extension origin, running an offline pure JS port of the Python rubric engine with verified mathematical parity.

- Why it matters: Prevents accidental introduction of backend servers or network dependencies, preserves privacy of user prompts, and avoids complex manifest sandboxing since Chrome side panels already operate in an isolated origin (`chrome-extension://`).
- How to apply: When updating `prompt-templates/rubric.toml`, always run `python3 scripts/export_rubric_json.py` to regenerate `extension/engine/rubric.json` and `extension/engine/rubric_data.js`. Verify parity with `node tests/test_js_parity.js`. Note: rubric TOML inserts use key `dimension` (not `dimension_id`) and `generated = "plan"`.
- Evidence: `tests/test_js_parity.js` verified 100% exact match across all sample prompts for both numeric scores and generated golden prompts; `tests/test_extension_browser.js` verified real extension loading in Chromium.
- Last confirmed: 2026-10-05

