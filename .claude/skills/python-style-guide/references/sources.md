# Sources and Community Anchors

Sources behind the rule families. They are not interchangeable
specifications; a repository's own rules may be stricter. Ported from
`rust-style-guide` v1 on 2026-09-20 (the lane structure, the tricky-code
gate, and the rule-ID scheme are that skill's), then the v2–v6 changeset on
2026-09-23 (audit lane, scorecard, TOOL-2a first adoption, call-frequency
hot/cold; see `docs/porting-log.md`); the Python rules were written
against the sources below and the toolchain facts in `lint-posture.md`.

## Official
- PEP 8, Style Guide for Python Code: https://peps.python.org/pep-0008/
- PEP 20, The Zen of Python: https://peps.python.org/pep-0020/
- PEP 257, Docstring Conventions: https://peps.python.org/pep-0257/
- PEP 484 / 526 / 544 / 557 / 634 / 695 (type hints, variable annotations,
  protocols, dataclasses, structural pattern matching, type parameter
  syntax): https://peps.python.org/
- PEP 3134, exception chaining: https://peps.python.org/pep-3134/
- Python documentation: `dataclasses`, `enum`, `typing`, `asyncio`,
  `subprocess` security considerations, `pickle` warning:
  https://docs.python.org/3.12/library/
- Google Python Style Guide (docstring sections, comments):
  https://google.github.io/styleguide/pyguide.html

## Tooling
- Ruff rules and settings: https://docs.astral.sh/ruff/rules/ ,
  https://docs.astral.sh/ruff/settings/
- Ruff formatter: https://docs.astral.sh/ruff/formatter/
- pyright configuration and strict mode:
  https://microsoft.github.io/pyright/#/configuration
- uv projects and lockfiles: https://docs.astral.sh/uv/concepts/projects/
- Hypothesis: https://hypothesis.readthedocs.io/
- pytest: https://docs.pytest.org/

## Community
- "Push Ifs Up And Fors Down" (matklad):
  https://matklad.github.io/2023/11/15/push-ifs-up-and-fors-down.html
- "Parse, don't validate" (Alexis King):
  https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/
- Hynek Schlawack on subclassing, dataclasses, and `attrs`:
  https://hynek.me/articles/
- Brett Slatkin, *Effective Python* (3rd ed.), items on comprehensions,
  exceptions, metaclasses, concurrency.

## Sibling skill
- `rust-style-guide` in this catalog (v1 structure, then the v2–v6
  changeset): lanes, gate, record template, review-lane perf guard, audit
  lane, and first-adoption method, adapted rather than copied.
