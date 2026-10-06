"""Render the three markdown files for one graded prompt."""

from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path

from promptscore.grading import (
    DimensionScore,
    Grade,
    annotate_segments,
    improved_prompt,
)
from promptscore.rubric import Rubric

NEXT_COPY = 2
MAX_STEM_CHARS = 40
_TIP_COUNT = 3
_WHY_LIMIT = 4


def write_report(
    *,
    prompt_path: Path,
    text: str,
    grade: Grade,
    rubric: Rubric,
    reports_root: Path,
    when: datetime,
) -> Path:
    """Write score.md, markup.md, and ideal.md under a new directory.

    Returns:
        The directory created.

    Raises:
        OSError: if a directory or file cannot be written.
    """
    reports_root.mkdir(parents=True, exist_ok=True)
    folder = _unique_dir(reports_root, _dir_name(prompt_path, when))
    folder.mkdir()
    source_name = prompt_path.name
    _write(folder / "score.md", render_score_md(source_name, when, grade, rubric))
    _write(folder / "markup.md", render_markup_md(source_name, text, grade, rubric))
    _write(folder / "ideal.md", render_ideal_md(source_name, text, grade, rubric))
    return folder


def render_score_md(
    source_name: str, when: datetime, grade: Grade, rubric: Rubric
) -> str:
    """Build the score report, including the band explanation and three tips."""
    span = rubric.score_max - rubric.score_min
    lines = [
        f"# Prompt score: {grade.score}",
        "",
        (
            f"Band: {grade.band_title} ({grade.band_min}-{grade.band_max}). "
            f"{grade.band_summary}"
        ),
        "",
        rubric.scale_note,
        "",
        "## Score math",
        "",
        f"Weighted fulfillment: {grade.weighted_fulfillment:.3f}",
        f"Word count: {grade.word_count}",
        f"Short-prompt factor: {grade.length_factor:.2f}",
        f"Vague-word factor: {grade.vague_factor:.2f} ({_vague_detail(grade)})",
        f"Quality: {grade.quality:.3f}",
        (
            f"Official score: {grade.score} = {rubric.score_min} + "
            f"round half up of {span} x quality."
        ),
        "Rounding happens once, on the total. The table is evidence, not a second sum.",
        "",
        "## Characteristics",
        "",
        *_table(grade),
        "",
        "## Why this score",
        "",
        *_why(grade, rubric),
        "",
        "## How to raise it",
        "",
        *_tips(grade, rubric),
        "",
        "## What this grade measures",
        "",
        rubric.limit_note,
        "",
        f"Source file: {source_name}",
        f"Graded at: {when.strftime('%Y-%m-%d %H:%M:%S %z')}",
        "Other files in this report: markup.md, ideal.md.",
        "",
    ]
    return "\n".join(lines)


def render_markup_md(source_name: str, text: str, grade: Grade, rubric: Rubric) -> str:
    """Build the segment markup with one suggestion per block."""
    lines = [
        f"# Markup — {source_name}",
        "",
        (
            f"Paired score: {grade.score} ({grade.band_title}). "
            "Suggestions are the smallest structural edits."
        ),
        "",
        "## Prompt-level suggestions",
        "",
    ]
    gaps = _ranked_gaps(grade, rubric)
    if gaps:
        lines.extend(f"- {dim.tip}" for dim in gaps)
    else:
        lines.append("No section was missing past the rewrite threshold.")
    lines.append("")
    notes = annotate_segments(text, grade, rubric)
    if not notes:
        lines.append("The file has no text.")
        lines.append("")
        return "\n".join(lines)
    for note in notes:
        lines.extend(
            [
                f"## Segment {note.index}",
                "",
                _blockquote(note.text),
                "",
                _suggestion_line(note.suggestion),
                "",
            ]
        )
    return "\n".join(lines)


def render_ideal_md(source_name: str, text: str, grade: Grade, rubric: Rubric) -> str:
    """Build the revised prompt inside a fence the author can copy."""
    body = improved_prompt(text, grade, rubric).rstrip("\n")
    if body.strip() == text.strip():
        lead = "Nothing was added. The fenced text is the prompt to use."
    else:
        lead = (
            "The fenced text is the prompt to use. "
            "Edit any finish line you cannot carry out."
        )
    return "\n".join(
        [
            f"# Improved prompt — {source_name}",
            "",
            lead,
            "",
            _fence(body),
        ]
    )


def _table(grade: Grade) -> list[str]:
    header = [
        "| Characteristic | Weight | Fulfillment | In score | Evidence |",
        "| --- | --- | --- | --- | --- |",
    ]
    rows = [_table_row(grade, index) for index in range(len(grade.dimensions))]
    return header + rows


def _table_row(grade: Grade, index: int) -> str:
    dim = grade.dimensions[index]
    fulfillment = "n/a" if not dim.applicable else f"{dim.fulfillment:.2f}"
    included = "yes" if dim.applicable else "no"
    evidence = dim.note
    return f"| {dim.title} | {dim.weight} | {fulfillment} | {included} | {evidence} |"


def _why(grade: Grade, rubric: Rubric) -> list[str]:
    gaps = _ranked_gaps(grade, rubric)
    if not gaps:
        threshold = f"{rubric.insert_below:.2f}"
        return [rubric.no_gap_note.replace("{threshold}", threshold)]
    lines: list[str] = []
    for dim in gaps[:_WHY_LIMIT]:
        lines.append(f"- **{dim.title}** at {dim.fulfillment:.2f}. {dim.explanation}")
    return lines


def _tips(grade: Grade, rubric: Rubric) -> list[str]:
    chosen = [dim.tip for dim in _ranked_gaps(grade, rubric)[:_TIP_COUNT]]
    for tip in rubric.standing_tips:
        if len(chosen) >= _TIP_COUNT:
            break
        if tip not in chosen:
            chosen.append(tip)
    return [f"- {tip}" for tip in chosen[:_TIP_COUNT]]


def _ranked_gaps(grade: Grade, rubric: Rubric) -> list[DimensionScore]:
    gaps = [
        dim
        for dim in grade.dimensions
        if dim.applicable and dim.fulfillment < rubric.insert_below
    ]
    gaps.sort(key=lambda dim: dim.weight * (1.0 - dim.fulfillment), reverse=True)
    return gaps


def _vague_detail(grade: Grade) -> str:
    if not grade.vague_terms:
        return "no listed vague words"
    names = ", ".join(grade.vague_terms)
    if grade.vague_factor == 1:
        return f"{names}; a finish line is present, so the vague-word factor stays at 1"
    return f"applied for {names} because there is no finish line"


def _suggestion_line(suggestion: str) -> str:
    if suggestion.startswith("Keep."):
        return suggestion
    return f"Suggestion: {suggestion}"


def _blockquote(text: str) -> str:
    lines = text.splitlines() or [""]
    quoted = [f"> {line}" if line else ">" for line in lines]
    return "\n".join(quoted)


def _fence(body: str) -> str:
    tick = "```"
    while tick in body:
        tick += "`"
    return f"{tick}text\n{body}\n{tick}\n"


def _dir_name(prompt_path: Path, when: datetime) -> str:
    stamp = when.strftime("%Y%m%d-%H%M%S")
    return f"{stamp}_{_safe_stem(prompt_path)}"


def _safe_stem(path: Path) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", path.stem.lower()).strip("-")
    trimmed = cleaned[:MAX_STEM_CHARS].strip("-")
    return trimmed or "prompt"


def _unique_dir(root: Path, name: str) -> Path:
    candidate = root / name
    copy = NEXT_COPY
    while candidate.exists():
        candidate = root / f"{name}-{copy}"
        copy += 1
    return candidate


def _write(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")
