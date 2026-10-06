"""Export prompt-templates/rubric.toml to JSON for client-side JavaScript execution."""

from __future__ import annotations

import json
import tomllib
from pathlib import Path


def export_rubric_json(toml_path: Path, json_path: Path, js_path: Path) -> None:
    """Export TOML rubric to JSON and a JS data wrapper."""
    raw = tomllib.loads(toml_path.read_text(encoding="utf-8"))
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_str = json.dumps(raw, indent=2)
    json_path.write_text(json_str, encoding="utf-8")
    header = "// Auto-generated from rubric.toml - DO NOT EDIT"
    js_content = f"""{header}
const RUBRIC_DATA = {json_str};

if (typeof module !== 'undefined' && module.exports) {{
  module.exports = {{ RUBRIC_DATA }};
}} else {{
  window.RUBRIC_DATA = RUBRIC_DATA;
}}
"""
    js_path.write_text(js_content, encoding="utf-8")
    print(f"Exported {toml_path} -> {json_path} and {js_path}")


if __name__ == "__main__":
    repo_root = Path(__file__).resolve().parent.parent
    export_rubric_json(
        repo_root / "prompt-templates" / "rubric.toml",
        repo_root / "extension" / "engine" / "rubric.json",
        repo_root / "extension" / "engine" / "rubric_data.js",
    )
