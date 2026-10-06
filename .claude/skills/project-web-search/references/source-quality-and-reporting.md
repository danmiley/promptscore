# Source Quality And Reporting

## Prefer Primary Sources

For media/web-pipeline projects, the best sources are usually:

- ffmpeg and ffprobe documentation,
- browser/vendor media documentation,
- standards or compatibility references,
- codec/project documentation,
- source repositories or release notes for tools used by the pipeline.

Use secondary articles to understand tradeoffs, then verify the claims against primary sources when the decision affects scripts, manifests, or delivery policy.

## Dates Matter

Browser media behavior, codec support, npm packages, and video tooling change. When a source affects a recommendation, record the source date or access date in `docs/background-research.md` if the decision should persist.

## Repo Logging

Use `docs/background-research.md` for durable research context:

- source URLs,
- verified facts,
- project-specific inference,
- unresolved questions.

Use `docs/ENGINEERING_LOG.md` when research changes behavior, scripts, validation, release policy, or the pipeline contract.

## Final Responses

When external research was used, include a short "Sources" line or inline links. Do not quote long passages. Say plainly when a recommendation is an inference from sources plus repo context.
