"""Structural grader: bands, rewrite policy, and the three report files."""

from __future__ import annotations

import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from promptscore.grading import credit_score, grade_prompt, improved_prompt
from promptscore.grading_reports import write_report
from promptscore.rubric import load_rubric

ROOT = Path(__file__).resolve().parents[1]
RUBRIC = load_rubric(ROOT / "prompt-templates" / "rubric.toml")
WHEN = datetime(2026, 10, 5, 21, 6, 12, tzinfo=timezone(timedelta(hours=-7)))


def _read(name: str) -> str:
    return (ROOT / "sample-prompts" / name).read_text(encoding="utf-8")


def test_credit_score_endpoints() -> None:
    assert credit_score(0) == 300
    assert credit_score(1) == 850
    assert credit_score(0.5) == 575
    assert credit_score(1.4) == 850


def test_weights_sum_to_100() -> None:
    assert sum(item.weight for item in RUBRIC.dimensions) == 100


def test_score_matches_row_math() -> None:
    grade = grade_prompt(_read("partial-task.md"), RUBRIC)
    rows = [dim for dim in grade.dimensions if dim.applicable]
    weight = sum(dim.weight for dim in rows)
    weighted = sum(dim.weight * dim.fulfillment for dim in rows) / weight
    quality = min(1.0, weighted * grade.length_factor * grade.vague_factor)
    assert abs(weighted - grade.weighted_fulfillment) < 1e-9
    assert abs(quality - grade.quality) < 1e-9
    assert grade.score == credit_score(
        grade.quality, low=RUBRIC.score_min, high=RUBRIC.score_max
    )


def test_sample_bands_separate_thin_partial_and_disciplined() -> None:
    thin = grade_prompt(_read("thin-request.md"), RUBRIC)
    partial = grade_prompt(_read("partial-task.md"), RUBRIC)
    disciplined = grade_prompt(_read("disciplined-task.md"), RUBRIC)
    multi = grade_prompt(_read("multi-part-unchecked.md"), RUBRIC)
    assert thin.band_title == "Developing"
    assert partial.band_title == "Usable"
    assert disciplined.band_title == "Disciplined"
    assert multi.band_title == "Developing"
    assert thin.score < partial.score < disciplined.score
    assert multi.score < partial.score
    assert disciplined.score < 850


def test_single_outcome_skips_the_plan_row() -> None:
    grade = grade_prompt(_read("disciplined-task.md"), RUBRIC)
    plan = next(dim for dim in grade.dimensions if dim.id == "decomposition")
    assert plan.applicable is False


def test_numbered_requests_require_checks() -> None:
    grade = grade_prompt(_read("multi-part-unchecked.md"), RUBRIC)
    plan = next(dim for dim in grade.dimensions if dim.id == "decomposition")
    assert plan.applicable is True
    assert plan.fulfillment == 0


def test_empty_prompt_is_the_floor() -> None:
    assert grade_prompt("  \n", RUBRIC).score == 300


def test_vague_repetition_stays_near_the_floor() -> None:
    text = " ".join(
        ["best", "professional", "robust", "optimal", "nice", "better"] * 30
    )
    assert grade_prompt(text, RUBRIC).score < 450


def test_repetition_does_not_raise_the_score() -> None:
    base = "Fix the cart in tests/cart.py.\n" * 3
    assert grade_prompt(base, RUBRIC).score == grade_prompt(base + base, RUBRIC).score


def test_section_labels_lose_to_a_concrete_prompt() -> None:
    text = "\n".join(
        [
            "Goal: success.",
            "Done when: it is nice.",
            "Constraints:",
            "Be careful with the work.",
            "Output:",
            "A short note.",
            "Verify:",
            "Make sure.",
        ]
    )
    labels = grade_prompt(text, RUBRIC)
    disciplined = grade_prompt(_read("disciplined-task.md"), RUBRIC)
    assert labels.score < disciplined.score
    assert labels.score < 800


def test_thin_prompt_gains_a_finish_line_and_not_a_stop_line() -> None:
    text = _read("thin-request.md")
    grade = grade_prompt(text, RUBRIC)
    revised = improved_prompt(text, grade, RUBRIC)
    revised_grade = grade_prompt(revised, RUBRIC)
    assert "Done when:" in revised
    assert "stop and ask" not in revised.lower()
    assert revised_grade.score >= grade.score + 120
    assert revised_grade.score < 800


def test_partial_prompt_gains_a_check_without_a_second_boundary() -> None:
    text = _read("partial-task.md")
    revised = improved_prompt(text, grade_prompt(text, RUBRIC), RUBRIC)
    assert "Done when:" in revised
    assert "Verify:" in revised
    assert "Constraints:" not in revised
    assert "stop and ask" not in revised.lower()


def test_disciplined_prompt_is_left_intact() -> None:
    text = _read("disciplined-task.md").strip()
    revised = improved_prompt(text, grade_prompt(text, RUBRIC), RUBRIC).strip()
    assert revised == text


def test_destructive_prompt_gains_a_stop_line() -> None:
    text = "Delete the old user table in production.\n"
    revised = improved_prompt(text, grade_prompt(text, RUBRIC), RUBRIC)
    assert "stop and ask" in revised.lower()


def test_multi_part_prompt_gains_step_checks() -> None:
    text = _read("multi-part-unchecked.md")
    revised = improved_prompt(text, grade_prompt(text, RUBRIC), RUBRIC)
    assert "Check:" in revised


def test_non_ascii_prompt_grades() -> None:
    grade = grade_prompt("Fix the café menu in menu.md\n", RUBRIC)
    assert RUBRIC.score_min <= grade.score <= RUBRIC.score_max


def test_write_report_names_and_three_files(tmp_path: Path) -> None:
    source = ROOT / "sample-prompts" / "thin-request.md"
    text = source.read_text(encoding="utf-8")
    grade = grade_prompt(text, RUBRIC)
    folder = write_report(
        prompt_path=source,
        text=text,
        grade=grade,
        rubric=RUBRIC,
        reports_root=tmp_path,
        when=WHEN,
    )
    assert folder.name == "20261005-210612_thin-request"
    for name in ("score.md", "markup.md", "ideal.md"):
        assert (folder / name).is_file()
    score_md = (folder / "score.md").read_text(encoding="utf-8")
    assert score_md.startswith(f"# Prompt score: {grade.score}\n")
    assert "2026-10-05 21:06:12 -0700" in score_md
    assert "command or inspection" in score_md
    markup = (folder / "markup.md").read_text(encoding="utf-8")
    assert "Suggestion:" in markup
    ideal = (folder / "ideal.md").read_text(encoding="utf-8")
    fenced = _fenced(ideal)
    assert grade_prompt(fenced, RUBRIC).score >= grade.score + 120


def test_second_report_same_stamp_gets_a_suffix(tmp_path: Path) -> None:
    source = ROOT / "sample-prompts" / "partial-task.md"
    text = source.read_text(encoding="utf-8")
    grade = grade_prompt(text, RUBRIC)
    first = write_report(
        prompt_path=source,
        text=text,
        grade=grade,
        rubric=RUBRIC,
        reports_root=tmp_path,
        when=WHEN,
    )
    second = write_report(
        prompt_path=source,
        text=text,
        grade=grade,
        rubric=RUBRIC,
        reports_root=tmp_path,
        when=WHEN,
    )
    assert second.name == f"{first.name}-2"


def test_script_writes_a_report(tmp_path: Path) -> None:
    proc = subprocess.run(  # noqa: S603  # fixed script path, shell stays off
        [
            sys.executable,
            str(ROOT / "scripts" / "score_prompt.py"),
            str(ROOT / "sample-prompts" / "partial-task.md"),
            "--reports-dir",
            str(tmp_path),
        ],
        capture_output=True,
        text=True,
        check=False,
        cwd=ROOT,
    )
    assert proc.returncode == 0, proc.stderr
    assert proc.stderr == ""
    assert "score:" in proc.stdout
    assert "band: Usable" in proc.stdout
    folders = [
        path
        for path in tmp_path.iterdir()
        if path.is_dir() and "partial-task" in path.name
    ]
    assert len(folders) == 1
    assert (folders[0] / "ideal.md").is_file()


def test_script_missing_prompt_exits_4(tmp_path: Path) -> None:
    missing = tmp_path / "no-such.md"
    proc = subprocess.run(  # noqa: S603  # fixed script path, shell stays off
        [
            sys.executable,
            str(ROOT / "scripts" / "score_prompt.py"),
            str(missing),
            "--reports-dir",
            str(tmp_path),
        ],
        capture_output=True,
        text=True,
        check=False,
        cwd=ROOT,
    )
    assert proc.returncode == 4
    assert proc.stdout == ""
    assert "no-such.md" in proc.stderr


def _fenced(markdown: str) -> str:
    marker = "```text\n"
    start = markdown.index(marker) + len(marker)
    end = markdown.rindex("```")
    return markdown[start:end]
