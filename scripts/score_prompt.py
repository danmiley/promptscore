"""Grade a prompt file and write score.md, markup.md, and ideal.md."""

from __future__ import annotations

import argparse
import sys
from collections.abc import Sequence
from datetime import datetime
from pathlib import Path

from promptscore.grading import grade_prompt
from promptscore.grading_reports import write_report
from promptscore.rubric import Rubric, load_rubric

EXIT_OK = 0
EXIT_INVOCATION = 2
EXIT_NOT_FOUND = 4


def build_parser() -> argparse.ArgumentParser:
    """Build the grader's argument parser."""
    parser = argparse.ArgumentParser(
        prog="score_prompt.py",
        description="Grade a prompt file and write a three-file report.",
    )
    parser.add_argument(
        "prompt_files",
        nargs="+",
        type=Path,
        help="UTF-8 file containing one prompt",
    )
    parser.add_argument(
        "--reports-dir",
        type=Path,
        default=None,
        help="directory for report folders (default: <repo>/reports)",
    )
    parser.add_argument(
        "--rubric",
        type=Path,
        default=None,
        help="rubric TOML (default: <repo>/prompt-templates/rubric.toml)",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    """Grade each prompt file. Stdout is the score summary; stderr is errors."""
    args = build_parser().parse_args(list(argv) if argv is not None else None)
    root = _repo_root()
    rubric_path = args.rubric if args.rubric is not None else _default_rubric(root)
    reports_root = (
        args.reports_dir if args.reports_dir is not None else root / "reports"
    )
    loaded = _load(rubric_path)
    if isinstance(loaded, int):
        return loaded
    chunks: list[str] = []
    for prompt_path in args.prompt_files:
        code, text = _score_file(prompt_path, loaded, reports_root)
        if code != EXIT_OK:
            sys.stderr.write(text)
            return code
        chunks.append(text.rstrip("\n"))
    sys.stdout.write("\n\n".join(chunks) + "\n")
    return EXIT_OK


def _score_file(
    prompt_path: Path, rubric: Rubric, reports_root: Path
) -> tuple[int, str]:
    if not prompt_path.is_file():
        return EXIT_NOT_FOUND, f"score_prompt: prompt not found: {prompt_path}\n"
    try:
        text = prompt_path.read_text(encoding="utf-8-sig")
    except UnicodeDecodeError:
        return EXIT_INVOCATION, f"score_prompt: {prompt_path.name} is not UTF-8 text\n"
    except OSError as err:
        detail = err.strerror or "unreadable"
        return EXIT_INVOCATION, f"score_prompt: {prompt_path.name}: {detail}\n"
    grade = grade_prompt(text, rubric)
    try:
        folder = write_report(
            prompt_path=prompt_path,
            text=text,
            grade=grade,
            rubric=rubric,
            reports_root=reports_root,
            when=datetime.now().astimezone(),
        )
    except OSError as err:
        detail = err.strerror or "failed"
        return EXIT_INVOCATION, f"score_prompt: report: {detail}\n"
    block = (
        f"score: {grade.score}\nband: {grade.band_title}\nreport: {_display(folder)}\n"
    )
    return EXIT_OK, block


def _load(path: Path) -> Rubric | int:
    if not path.is_file():
        sys.stderr.write(f"score_prompt: rubric not found: {path}\n")
        return EXIT_INVOCATION
    try:
        return load_rubric(path)
    except (OSError, TypeError, ValueError) as err:
        sys.stderr.write(f"score_prompt: rubric: {err}\n")
        return EXIT_INVOCATION


def _display(path: Path) -> str:
    resolved = path.resolve()
    try:
        return str(resolved.relative_to(Path.cwd()))
    except ValueError:
        return str(resolved)


def _default_rubric(root: Path) -> Path:
    return root / "prompt-templates" / "rubric.toml"


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


if __name__ == "__main__":
    sys.exit(main())
