# Reports

`scripts/score_prompt.py` writes one directory per run:

`reports/<YYYYMMDD-HHMMSS>_<prompt-stem>/`

| File | Contents |
| --- | --- |
| `score.md` | Score from 300 to 850, band, row table, why, three tips. |
| `markup.md` | The prompt by segment, with a suggestion where a segment is weak. |
| `ideal.md` | Revised prompt. A prompt that already clears the rubric is copied through. |

Generated directories are gitignored. This file is the exception.
