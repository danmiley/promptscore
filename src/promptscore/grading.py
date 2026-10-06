"""Structural prompt grade driven by prompt-templates/rubric.toml."""

from __future__ import annotations

import re
from dataclasses import dataclass

from promptscore.rubric import (
    ApplyWhen,
    Band,
    DimensionMode,
    DimensionSpec,
    Insert,
    InsertWhen,
    Rubric,
)

MAX_FOCUS_CHARS = 160
SCORE_FLOOR = 300
SCORE_CEILING = 850
_HALF = 0.5
_WORD = re.compile(r"[A-Za-z0-9']+")
_LIST_MARK = re.compile(r"^(?:\d+[.)]\s+|[-*]\s+)")
_SPACE = re.compile(r"\s+")


@dataclass(frozen=True, slots=True)
class DimensionScore:
    """One characteristic after grading a prompt."""

    id: str
    title: str
    weight: int
    critical: bool
    order: int
    mode: DimensionMode
    applicable: bool
    fulfillment: float
    evidence: tuple[str, ...]
    note: str
    explanation: str
    tip: str


@dataclass(frozen=True, slots=True)
class Grade:
    """Score and the row evidence behind it."""

    score: int
    quality: float
    weighted_fulfillment: float
    length_factor: float
    vague_factor: float
    word_count: int
    vague_terms: tuple[str, ...]
    dimensions: tuple[DimensionScore, ...]
    band_title: str
    band_summary: str
    band_min: int
    band_max: int
    focus: str


@dataclass(frozen=True, slots=True)
class SegmentNote:
    """One blank-line-separated block of the prompt and its suggestion."""

    index: int
    text: str
    suggestion: str


def credit_score(
    quality: float, *, low: int = SCORE_FLOOR, high: int = SCORE_CEILING
) -> int:
    """Map a 0-1 quality to the inclusive credit-style range, rounding half up."""
    clamped = _clamp01(quality)
    return low + int((high - low) * clamped + _HALF)


def grade_prompt(text: str, rubric: Rubric) -> Grade:
    """Grade prompt text. The same text always yields the same grade."""
    dimensions = tuple(
        _score_dimension(text, spec, rubric) for spec in rubric.dimensions
    )
    weighted = _weighted(dimensions)
    word_count = len(_WORD.findall(text))
    length_factor = _length_factor(word_count, rubric)
    done = _fulfillment_for(dimensions, DimensionMode.DONE_WHEN)
    vague_factor, vague_terms = _vague_factor(text, done, rubric)
    quality = _clamp01(weighted * length_factor * vague_factor)
    score = credit_score(quality, low=rubric.score_min, high=rubric.score_max)
    band = _band_for(score, rubric)
    return Grade(
        score=score,
        quality=quality,
        weighted_fulfillment=weighted,
        length_factor=length_factor,
        vague_factor=vague_factor,
        word_count=word_count,
        vague_terms=vague_terms,
        dimensions=dimensions,
        band_title=band.title,
        band_summary=band.summary,
        band_min=band.min_score,
        band_max=band.max_score,
        focus=focus_line(text),
    )


def improved_prompt(text: str, grade: Grade, rubric: Rubric) -> str:
    """Return the revised prompt, keeping the original and adding gaps only."""
    blocks: list[str] = []
    original = text.strip()
    if original:
        blocks.append(original)
    for insert in selected_inserts(text, grade, rubric):
        blocks.append(_render_insert(insert, text, grade.focus, rubric))
    if not blocks:
        return "\n"
    return "\n\n".join(blocks).rstrip() + "\n"


def annotate_segments(
    text: str, grade: Grade, rubric: Rubric
) -> tuple[SegmentNote, ...]:
    """Split the prompt on blank lines and attach one suggestion each."""
    parts = [
        part.strip() for part in re.split(r"\n\s*\n", text.strip()) if part.strip()
    ]
    notes: list[SegmentNote] = []
    for index, part in enumerate(parts, start=1):
        notes.append(SegmentNote(index, part, suggestion_for(part, grade, rubric)))
    return tuple(notes)


def suggestion_for(segment: str, grade: Grade, rubric: Rubric) -> str:
    """One edit for this segment, or a keep note when it already carries weight."""
    vague = _terms_in(segment, rubric.vague_terms)
    if vague:
        names = ", ".join(vague)
        return (
            f"Replace {names} with the result you want "
            "and how you will know it happened."
        )
    if _unchecked_steps(segment, grade, rubric):
        return (
            "Add a pass/fail check to each numbered step, "
            "or cut the step if it is outside the outcome."
        )
    if _soft_finish(segment, grade, rubric):
        return (
            "Make this finish line something a person can run: "
            "a command, an exit status, or an inspection."
        )
    covered = _covered_titles(segment, rubric)
    if covered:
        return f"Keep. Covers: {', '.join(covered)}."
    if segment.startswith("#"):
        return "Keep. Heading only."
    return (
        "This is context. Keep it, and make sure the finish line "
        "says what this fact changes."
    )


def selected_inserts(text: str, grade: Grade, rubric: Rubric) -> tuple[Insert, ...]:
    """Sections to append, in rubric order, capped aside from plan and stop lines."""
    by_id = {item.dimension_id: item for item in rubric.inserts}
    needed = [
        dim
        for dim in grade.dimensions
        if dim.id in by_id and _needs_insert(text, dim, by_id[dim.id], rubric)
    ]
    extra_ids = {item.dimension_id for item in rubric.inserts if _is_extra(item)}
    if rubric.extras_ignore_cap:
        ordinary = [dim for dim in needed if dim.id not in extra_ids]
        extras = [dim for dim in needed if dim.id in extra_ids]
        chosen = sorted(ordinary, key=_insert_rank, reverse=True)[: rubric.max_inserts]
        chosen.extend(extras)
    else:
        chosen = sorted(needed, key=_insert_rank, reverse=True)[: rubric.max_inserts]
    chosen.sort(key=lambda dim: dim.order)
    return tuple(by_id[dim.id] for dim in chosen)


def focus_line(text: str) -> str:
    """First real task line, skipping a trailing-colon lead-in."""
    lines = _content_lines(text)
    for line in lines:
        if not line.endswith(":"):
            return line[:MAX_FOCUS_CHARS]
    if lines:
        return lines[0][:MAX_FOCUS_CHARS]
    return "the requested work"


def _content_lines(text: str) -> list[str]:
    lines: list[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        line = _LIST_MARK.sub("", line)
        line = _SPACE.sub(" ", line).strip()
        if line:
            lines.append(line)
    return lines


def _score_dimension(text: str, spec: DimensionSpec, rubric: Rubric) -> DimensionScore:
    # Stop conditions are scored only when the request can be hard to undo.
    # An ordinary edit keeps those points out of the average.
    if (
        spec.applies is ApplyWhen.DESTRUCTIVE
        and rubric.destructive.search(text) is None
    ):
        note = (
            "Not required: nothing here deletes, deploys, migrates, or touches secrets."
        )
        return _row(spec, applicable=False, fulfillment=0.0, evidence=(), note=note)
    if spec.mode is DimensionMode.PLAN:
        return _score_plan(text, spec, rubric)
    if spec.mode is DimensionMode.DONE_WHEN:
        fulfillment, evidence = _score_done_when(text, spec, rubric)
    else:
        fulfillment, evidence = _score_signals(text, spec, rubric)
    return _row(
        spec,
        applicable=True,
        fulfillment=fulfillment,
        evidence=evidence,
        note=_note(spec, fulfillment, evidence),
    )


def _score_signals(
    text: str, spec: DimensionSpec, rubric: Rubric
) -> tuple[float, tuple[str, ...]]:
    evidence = _matching_labels(text, spec)
    fulfillment = _from_hits(
        len(evidence),
        _any_anchored(text, spec, rubric.concrete, rubric),
        spec,
    )
    return fulfillment, evidence


def _score_done_when(
    text: str, spec: DimensionSpec, rubric: Rubric
) -> tuple[float, tuple[str, ...]]:
    evidence = _matching_labels(text, spec)
    if not evidence:
        return 0.0, ()
    # A filename near the label is context. Full credit needs a command or an exit.
    if _any_anchored(text, spec, rubric.check_anchor, rubric):
        return 1.0, evidence
    return spec.partial_fulfillment, evidence


def _score_plan(text: str, spec: DimensionSpec, rubric: Rubric) -> DimensionScore:
    count = len(rubric.multi_part.findall(text))
    if count < rubric.multi_part_min:
        note = (
            "Not required: this prompt has a single outcome, "
            "so a step plan is not scored."
        )
        return _row(spec, applicable=False, fulfillment=0.0, evidence=(), note=note)
    if spec.check is not None and spec.check.search(text):
        return _row(
            spec,
            applicable=True,
            fulfillment=1.0,
            evidence=("numbered requests", "check"),
            note="Met: numbered requests, check.",
        )
    return _row(
        spec,
        applicable=True,
        fulfillment=0.0,
        evidence=("numbered requests",),
        note=spec.missing,
    )


def _row(
    spec: DimensionSpec,
    *,
    applicable: bool,
    fulfillment: float,
    evidence: tuple[str, ...],
    note: str,
) -> DimensionScore:
    return DimensionScore(
        id=spec.id,
        title=spec.title,
        weight=spec.weight,
        critical=spec.critical,
        order=spec.order,
        mode=spec.mode,
        applicable=applicable,
        fulfillment=fulfillment,
        evidence=evidence,
        note=note,
        explanation=spec.explanation,
        tip=spec.tip,
    )


def _note(spec: DimensionSpec, fulfillment: float, evidence: tuple[str, ...]) -> str:
    if fulfillment == 0 or not evidence:
        return spec.missing
    joined = ", ".join(evidence)
    if fulfillment >= 1:
        return f"Met: {joined}."
    return f"Partial: {joined}."


def _from_hits(hit_count: int, anchored: bool, spec: DimensionSpec) -> float:
    if hit_count <= 0:
        return 0.0
    if hit_count >= spec.full_hits:
        return 1.0
    if anchored:
        return spec.one_hit_with_anchor
    return spec.one_hit


def _matching_labels(text: str, spec: DimensionSpec) -> tuple[str, ...]:
    return tuple(signal.label for signal in spec.signals if signal.pattern.search(text))


def _any_anchored(
    text: str, spec: DimensionSpec, anchor: re.Pattern[str], rubric: Rubric
) -> bool:
    for signal in spec.signals:
        match = signal.pattern.search(text)
        if match is None:
            continue
        start = max(0, match.start() - rubric.anchor_before)
        end = min(len(text), match.end() + rubric.anchor_after)
        if anchor.search(text[start:end]):
            return True
    return False


def _weighted(dimensions: tuple[DimensionScore, ...]) -> float:
    rows = [dim for dim in dimensions if dim.applicable]
    weight = sum(dim.weight for dim in rows)
    if weight == 0:
        return 0.0
    return sum(dim.weight * dim.fulfillment for dim in rows) / weight


def _length_factor(word_count: int, rubric: Rubric) -> float:
    if word_count < rubric.min_words:
        return rubric.short_factor
    return 1.0


def _vague_factor(
    text: str, done_fulfillment: float, rubric: Rubric
) -> tuple[float, tuple[str, ...]]:
    found = _terms_in(text, rubric.vague_terms)
    # The penalty is for having no finish line, not for an adjective beside one.
    if found and done_fulfillment == 0:
        return rubric.vague_factor, found
    return 1.0, found


def _terms_in(text: str, terms: tuple[str, ...]) -> tuple[str, ...]:
    return tuple(
        term for term in terms if re.search(rf"(?i)\b{re.escape(term)}\b", text)
    )


def _fulfillment_for(
    dimensions: tuple[DimensionScore, ...], mode: DimensionMode
) -> float:
    for dim in dimensions:
        if dim.mode is mode:
            return dim.fulfillment
    return 0.0


def _band_for(score: int, rubric: Rubric) -> Band:
    for band in rubric.bands:
        if band.min_score <= score <= band.max_score:
            return band
    return rubric.bands[0]


def _unchecked_steps(segment: str, grade: Grade, rubric: Rubric) -> bool:
    plan = _row_for(grade, DimensionMode.PLAN)
    if plan is None or not plan.applicable or plan.fulfillment >= rubric.insert_below:
        return False
    if rubric.multi_part.search(segment) is None:
        return False
    spec = _spec_for(rubric, plan.id)
    return spec.check is None or spec.check.search(segment) is None


def _soft_finish(segment: str, grade: Grade, rubric: Rubric) -> bool:
    done = _row_for(grade, DimensionMode.DONE_WHEN)
    if done is None or done.fulfillment >= 1:
        return False
    spec = _spec_for(rubric, done.id)
    return any(signal.pattern.search(segment) for signal in spec.signals)


def _covered_titles(segment: str, rubric: Rubric) -> tuple[str, ...]:
    titles: list[str] = []
    for spec in rubric.dimensions:
        if spec.mode is DimensionMode.PLAN:
            continue
        if any(signal.pattern.search(segment) for signal in spec.signals):
            titles.append(spec.title)
    return tuple(titles)


def _needs_insert(
    text: str, dim: DimensionScore, insert: Insert, rubric: Rubric
) -> bool:
    if not dim.applicable:
        return False
    if insert.when is InsertWhen.ABSENT:
        return dim.fulfillment == 0
    if insert.when is InsertWhen.DESTRUCTIVE:
        destructive = rubric.destructive.search(text) is not None
        return dim.fulfillment < rubric.insert_below and destructive
    return dim.fulfillment < rubric.insert_below


def _is_extra(insert: Insert) -> bool:
    return insert.is_plan or insert.when is InsertWhen.DESTRUCTIVE


def _insert_rank(dim: DimensionScore) -> tuple[bool, float, int]:
    return (dim.critical, dim.weight * (1.0 - dim.fulfillment), -dim.order)


def _render_insert(insert: Insert, text: str, focus: str, rubric: Rubric) -> str:
    if insert.is_plan:
        return _plan_body(text, rubric)
    safe = focus.replace("{", "(").replace("}", ")").replace('"', "'")
    return insert.body.replace("{focus}", safe)


def _plan_body(text: str, rubric: Rubric) -> str:
    items = [
        line.strip() for line in text.splitlines() if rubric.multi_part.search(line)
    ]
    rows = ["Plan:"]
    if not items:
        rows.append(
            "1. Restate the outcome. Check: state what is true when it is done."
        )
        return "\n".join(rows)
    for item in items:
        rows.append(f"{item} Check: state what is true when this item is done.")
    return "\n".join(rows)


def _row_for(grade: Grade, mode: DimensionMode) -> DimensionScore | None:
    for dim in grade.dimensions:
        if dim.mode is mode:
            return dim
    return None


def _spec_for(rubric: Rubric, dimension_id: str) -> DimensionSpec:
    for spec in rubric.dimensions:
        if spec.id == dimension_id:
            return spec
    msg = f"missing dimension {dimension_id}"
    raise ValueError(msg)


def _clamp01(value: float) -> float:
    if value < 0:
        return 0.0
    if value > 1:
        return 1.0
    return value
