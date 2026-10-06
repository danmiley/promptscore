"""Load the structural scoring rubric from prompt-templates/rubric.toml."""

from __future__ import annotations

import re
import tomllib
from dataclasses import dataclass
from enum import Enum
from itertools import pairwise
from pathlib import Path
from typing import cast

RUBRIC_SCHEMA = "promptscore-rubric-v1"
WEIGHT_TOTAL = 100


class DimensionMode(Enum):
    """How a characteristic turns text into a fulfillment value."""

    SIGNALS = "signals"
    DONE_WHEN = "done_when"
    PLAN = "plan"


class InsertWhen(Enum):
    """When the rewriter may append a section for this characteristic."""

    GAP = "gap"
    ABSENT = "absent"
    DESTRUCTIVE = "destructive"


class ApplyWhen(Enum):
    """Whether a characteristic is in the score for this prompt."""

    ALWAYS = "always"
    DESTRUCTIVE = "destructive"


@dataclass(frozen=True, slots=True)
class Signal:
    """One labeled regular expression."""

    label: str
    pattern: re.Pattern[str]


@dataclass(frozen=True, slots=True)
class Band:
    """Inclusive score range and the sentence that explains it."""

    id: str
    title: str
    min_score: int
    max_score: int
    summary: str


@dataclass(frozen=True, slots=True)
class DimensionSpec:
    """One characteristic and the signals that detect it."""

    id: str
    title: str
    weight: int
    critical: bool
    order: int
    mode: DimensionMode
    applies: ApplyWhen
    explanation: str
    tip: str
    missing: str
    signals: tuple[Signal, ...]
    one_hit: float
    one_hit_with_anchor: float
    full_hits: int
    partial_fulfillment: float
    check: re.Pattern[str] | None


@dataclass(frozen=True, slots=True)
class Insert:
    """Section text the rewriter may append."""

    dimension_id: str
    when: InsertWhen
    is_plan: bool
    body: str


@dataclass(frozen=True, slots=True)
class Rubric:
    """Validated scoring rubric. Weights of all dimensions sum to 100."""

    score_min: int
    score_max: int
    concrete: re.Pattern[str]
    check_anchor: re.Pattern[str]
    multi_part: re.Pattern[str]
    multi_part_min: int
    destructive: re.Pattern[str]
    anchor_before: int
    anchor_after: int
    min_words: int
    short_factor: float
    vague_factor: float
    vague_terms: tuple[str, ...]
    insert_below: float
    max_inserts: int
    extras_ignore_cap: bool
    scale_note: str
    limit_note: str
    no_gap_note: str
    standing_tips: tuple[str, ...]
    bands: tuple[Band, ...]
    dimensions: tuple[DimensionSpec, ...]
    inserts: tuple[Insert, ...]


def load_rubric(path: Path) -> Rubric:
    """Load and validate the scoring rubric.

    Raises:
    OSError: if the file cannot be read.
    TypeError: if a field has the wrong TOML type.
    ValueError: if a field is present but invalid.
    """
    raw = cast("dict[str, object]", tomllib.loads(path.read_text(encoding="utf-8")))
    schema = _req_str(raw, "schema", where="rubric")
    if schema != RUBRIC_SCHEMA:
        msg = f"rubric schema {schema!r} is not {RUBRIC_SCHEMA}"
        raise ValueError(msg)
    score_min = _req_int(raw, "score_min", where="rubric")
    score_max = _req_int(raw, "score_max", where="rubric")
    if score_min >= score_max:
        msg = "rubric score_min must be below score_max"
        raise ValueError(msg)
    adjustments = _req_table(raw, "adjustments", where="rubric")
    dimensions = _parse_dimensions(raw)
    inserts = _parse_inserts(raw, dimensions)
    bands = _parse_bands(raw, score_min, score_max)
    _require_modes(dimensions)
    return Rubric(
        score_min=score_min,
        score_max=score_max,
        concrete=_compile(
            _req_str(raw, "concrete_regex", where="rubric"), where="concrete_regex"
        ),
        check_anchor=_compile(
            _req_str(raw, "check_anchor_regex", where="rubric"),
            where="check_anchor_regex",
        ),
        multi_part=_compile(
            _req_str(raw, "multi_part_regex", where="rubric"),
            where="multi_part_regex",
        ),
        multi_part_min=_positive_int(raw, "multi_part_min", where="rubric"),
        destructive=_compile(
            _req_str(raw, "destructive_regex", where="rubric"),
            where="destructive_regex",
        ),
        anchor_before=_non_negative_int(
            adjustments, "anchor_before", where="adjustments"
        ),
        anchor_after=_non_negative_int(
            adjustments, "anchor_after", where="adjustments"
        ),
        min_words=_positive_int(adjustments, "min_words", where="adjustments"),
        short_factor=_unit(adjustments, "short_factor", where="adjustments"),
        vague_factor=_unit(adjustments, "vague_factor", where="adjustments"),
        vague_terms=_str_tuple(
            adjustments, "vague_terms", where="adjustments", minimum=1
        ),
        insert_below=_unit(adjustments, "insert_below", where="adjustments"),
        max_inserts=_positive_int(adjustments, "max_inserts", where="adjustments"),
        extras_ignore_cap=_req_bool(
            adjustments, "extras_ignore_cap", where="adjustments"
        ),
        scale_note=_req_str(raw, "scale_note", where="rubric"),
        limit_note=_req_str(raw, "limit_note", where="rubric"),
        no_gap_note=_req_str(raw, "no_gap_note", where="rubric"),
        standing_tips=_str_tuple(raw, "standing_tips", where="rubric", minimum=3),
        bands=bands,
        dimensions=dimensions,
        inserts=inserts,
    )


def _parse_dimensions(raw: dict[str, object]) -> tuple[DimensionSpec, ...]:
    tables = _req_tables(raw, "dimension", where="rubric")
    dimensions = tuple(
        _parse_dimension(table, index) for index, table in enumerate(tables)
    )
    ids = [item.id for item in dimensions]
    if len(ids) != len(set(ids)):
        msg = "rubric dimension ids must be unique"
        raise ValueError(msg)
    if sum(item.weight for item in dimensions) != WEIGHT_TOTAL:
        msg = f"rubric dimension weights must sum to {WEIGHT_TOTAL}"
        raise ValueError(msg)
    return dimensions


def _parse_dimension(table: dict[str, object], order: int) -> DimensionSpec:
    where = f"dimension[{order}]"
    mode = _mode(table, where)
    base = _base_fields(table, where, order, mode)
    if mode is DimensionMode.SIGNALS:
        return _signals_dimension(base, table, where)
    if mode is DimensionMode.DONE_WHEN:
        return _done_when_dimension(base, table, where)
    return _plan_dimension(base, table, where)


def _base_fields(
    table: dict[str, object], where: str, order: int, mode: DimensionMode
) -> _DimBase:
    weight = _positive_int(table, "weight", where=where)
    return _DimBase(
        id=_req_str(table, "id", where=where),
        title=_req_str(table, "title", where=where),
        weight=weight,
        critical=_req_bool(table, "critical", where=where),
        order=order,
        mode=mode,
        applies=_apply_when(table, where),
        explanation=_req_str(table, "explanation", where=where),
        tip=_req_str(table, "tip", where=where),
        missing=_req_str(table, "missing", where=where),
    )


def _signals_dimension(
    base: _DimBase, table: dict[str, object], where: str
) -> DimensionSpec:
    one_hit = _unit(table, "one_hit", where=where)
    anchored = _unit(table, "one_hit_with_anchor", where=where)
    if anchored < one_hit:
        msg = f"rubric {where}.one_hit_with_anchor must be >= one_hit"
        raise ValueError(msg)
    return _finish(
        base,
        signals=_parse_signals(table.get("signals"), where=where),
        one_hit=one_hit,
        one_hit_with_anchor=anchored,
        full_hits=_positive_int(table, "full_hits", where=where),
        partial_fulfillment=0.0,
        check=None,
    )


def _done_when_dimension(
    base: _DimBase, table: dict[str, object], where: str
) -> DimensionSpec:
    partial = _unit(table, "partial_fulfillment", where=where)
    if partial >= 1:
        msg = f"rubric {where}.partial_fulfillment must be below 1"
        raise ValueError(msg)
    return _finish(
        base,
        signals=_parse_signals(table.get("signals"), where=where),
        one_hit=0.0,
        one_hit_with_anchor=0.0,
        full_hits=2,
        partial_fulfillment=partial,
        check=None,
    )


def _plan_dimension(
    base: _DimBase, table: dict[str, object], where: str
) -> DimensionSpec:
    return _finish(
        base,
        signals=(),
        one_hit=0.0,
        one_hit_with_anchor=0.0,
        full_hits=2,
        partial_fulfillment=0.0,
        check=_compile(
            _req_str(table, "check_regex", where=where), where=f"{where}.check_regex"
        ),
    )


def _finish(
    base: _DimBase,
    *,
    signals: tuple[Signal, ...],
    one_hit: float,
    one_hit_with_anchor: float,
    full_hits: int,
    partial_fulfillment: float,
    check: re.Pattern[str] | None,
) -> DimensionSpec:
    return DimensionSpec(
        id=base.id,
        title=base.title,
        weight=base.weight,
        critical=base.critical,
        order=base.order,
        mode=base.mode,
        applies=base.applies,
        explanation=base.explanation,
        tip=base.tip,
        missing=base.missing,
        signals=signals,
        one_hit=one_hit,
        one_hit_with_anchor=one_hit_with_anchor,
        full_hits=full_hits,
        partial_fulfillment=partial_fulfillment,
        check=check,
    )


def _parse_inserts(
    raw: dict[str, object], dimensions: tuple[DimensionSpec, ...]
) -> tuple[Insert, ...]:
    tables = _req_tables(raw, "insert", where="rubric")
    inserts = tuple(_parse_insert(table, index) for index, table in enumerate(tables))
    known = {item.id for item in dimensions}
    seen = {item.dimension_id for item in inserts}
    if seen != known:
        msg = "rubric inserts must match dimension ids one for one"
        raise ValueError(msg)
    return inserts


def _parse_insert(table: dict[str, object], index: int) -> Insert:
    where = f"insert[{index}]"
    when = _insert_when(table, where)
    generated = _opt_str(table, "generated", where=where)
    if generated not in ("", "plan"):
        msg = f"rubric {where}.generated must be empty or 'plan'"
        raise ValueError(msg)
    is_plan = generated == "plan"
    body = "" if is_plan else _req_str(table, "body", where=where).strip()
    return Insert(
        dimension_id=_req_str(table, "dimension", where=where),
        when=when,
        is_plan=is_plan,
        body=body,
    )


def _parse_bands(raw: dict[str, object], low: int, high: int) -> tuple[Band, ...]:
    tables = _req_tables(raw, "band", where="rubric")
    bands = tuple(_parse_band(table, index) for index, table in enumerate(tables))
    if bands[0].min_score != low or bands[-1].max_score != high:
        msg = "rubric bands must cover score_min through score_max"
        raise ValueError(msg)
    for earlier, later in pairwise(bands):
        if later.min_score != earlier.max_score + 1:
            msg = "rubric bands must be contiguous"
            raise ValueError(msg)
        if earlier.min_score > earlier.max_score:
            msg = f"rubric band {earlier.id} has a reversed range"
            raise ValueError(msg)
    return bands


def _parse_band(table: dict[str, object], index: int) -> Band:
    where = f"band[{index}]"
    return Band(
        id=_req_str(table, "id", where=where),
        title=_req_str(table, "title", where=where),
        min_score=_req_int(table, "min_score", where=where),
        max_score=_req_int(table, "max_score", where=where),
        summary=_req_str(table, "summary", where=where),
    )


def _require_modes(dimensions: tuple[DimensionSpec, ...]) -> None:
    done = sum(1 for item in dimensions if item.mode is DimensionMode.DONE_WHEN)
    plan = sum(1 for item in dimensions if item.mode is DimensionMode.PLAN)
    if done != 1 or plan != 1:
        msg = "rubric needs exactly one done_when dimension and one plan dimension"
        raise ValueError(msg)


def _parse_signals(value: object, *, where: str) -> tuple[Signal, ...]:
    if not isinstance(value, list) or not value:
        msg = f"rubric {where}.signals must be a non-empty array"
        raise ValueError(msg)
    signals: list[Signal] = []
    items = cast("list[object]", value)
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            msg = f"rubric {where}.signals[{index}] must be a table"
            raise TypeError(msg)
        table = cast("dict[str, object]", item)
        label = _req_str(table, "label", where=f"{where}.signals[{index}]")
        regex = _req_str(table, "regex", where=f"{where}.signals[{index}]")
        signals.append(Signal(label=label, pattern=_compile(regex, where=label)))
    return tuple(signals)


def _mode(table: dict[str, object], where: str) -> DimensionMode:
    text = _req_str(table, "mode", where=where)
    try:
        return DimensionMode(text)
    except ValueError as err:
        msg = f"rubric {where}.mode is unknown"
        raise ValueError(msg) from err


def _apply_when(table: dict[str, object], where: str) -> ApplyWhen:
    if "applies" not in table:
        return ApplyWhen.ALWAYS
    text = _req_str(table, "applies", where=where)
    try:
        return ApplyWhen(text)
    except ValueError as err:
        msg = f"rubric {where}.applies is unknown"
        raise ValueError(msg) from err


def _insert_when(table: dict[str, object], where: str) -> InsertWhen:
    text = _req_str(table, "when", where=where)
    try:
        return InsertWhen(text)
    except ValueError as err:
        msg = f"rubric {where}.when is unknown"
        raise ValueError(msg) from err


def _compile(pattern: str, *, where: str) -> re.Pattern[str]:
    try:
        return re.compile(pattern)
    except re.error as err:
        msg = f"rubric {where} is not a valid regex"
        raise ValueError(msg) from err


def _req_table(raw: dict[str, object], key: str, *, where: str) -> dict[str, object]:
    value = raw.get(key)
    if not isinstance(value, dict):
        msg = f"rubric {where}.{key} must be a table"
        raise TypeError(msg)
    return cast("dict[str, object]", value)


def _req_tables(
    raw: dict[str, object], key: str, *, where: str
) -> list[dict[str, object]]:
    value = raw.get(key)
    if not isinstance(value, list) or not value:
        msg = f"rubric {where}.{key} must be a non-empty array"
        raise ValueError(msg)
    tables: list[dict[str, object]] = []
    items = cast("list[object]", value)
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            msg = f"rubric {where}.{key}[{index}] must be a table"
            raise TypeError(msg)
        tables.append(cast("dict[str, object]", item))
    return tables


def _req_str(table: dict[str, object], key: str, *, where: str) -> str:
    value = table.get(key)
    if not isinstance(value, str) or not value.strip():
        msg = f"rubric {where}.{key} must be a non-empty string"
        raise ValueError(msg)
    return value.strip()


def _opt_str(table: dict[str, object], key: str, *, where: str) -> str:
    if key not in table:
        return ""
    value = table[key]
    if not isinstance(value, str):
        msg = f"rubric {where}.{key} must be a string"
        raise TypeError(msg)
    return value


def _req_bool(table: dict[str, object], key: str, *, where: str) -> bool:
    value = table.get(key)
    if not isinstance(value, bool):
        msg = f"rubric {where}.{key} must be a boolean"
        raise TypeError(msg)
    return value


def _req_int(table: dict[str, object], key: str, *, where: str) -> int:
    value = table.get(key)
    if isinstance(value, bool) or not isinstance(value, int):
        msg = f"rubric {where}.{key} must be an integer"
        raise TypeError(msg)
    return value


def _positive_int(table: dict[str, object], key: str, *, where: str) -> int:
    value = _req_int(table, key, where=where)
    if value <= 0:
        msg = f"rubric {where}.{key} must be positive"
        raise ValueError(msg)
    return value


def _non_negative_int(table: dict[str, object], key: str, *, where: str) -> int:
    value = _req_int(table, key, where=where)
    if value < 0:
        msg = f"rubric {where}.{key} must be >= 0"
        raise ValueError(msg)
    return value


def _unit(table: dict[str, object], key: str, *, where: str) -> float:
    value = table.get(key)
    if isinstance(value, bool) or not isinstance(value, int | float):
        msg = f"rubric {where}.{key} must be a number from 0 to 1"
        raise TypeError(msg)
    number = float(value)
    if not 0 <= number <= 1:
        msg = f"rubric {where}.{key} must be a number from 0 to 1"
        raise ValueError(msg)
    return number


def _str_tuple(
    table: dict[str, object], key: str, *, where: str, minimum: int
) -> tuple[str, ...]:
    value = table.get(key)
    if not isinstance(value, list):
        msg = f"rubric {where}.{key} must be an array of strings"
        raise TypeError(msg)
    found: list[str] = []
    entries = cast("list[object]", value)
    for index, item in enumerate(entries):
        if not isinstance(item, str) or not item.strip():
            msg = f"rubric {where}.{key}[{index}] must be a non-empty string"
            raise ValueError(msg)
        found.append(item.strip())
    if len(found) < minimum:
        msg = f"rubric {where}.{key} needs at least {minimum} entries"
        raise ValueError(msg)
    return tuple(found)


@dataclass(frozen=True, slots=True)
class _DimBase:
    """Fields shared by every dimension mode, before mode-specific scores."""

    id: str
    title: str
    weight: int
    critical: bool
    order: int
    mode: DimensionMode
    applies: ApplyWhen
    explanation: str
    tip: str
    missing: str
