# Repo-Grounded Search Workflow

## Before Searching

1. Read the local docs that define the task area.
2. Identify the local claim, gap, or uncertainty.
3. Decide what source type would settle it.
4. Write focused queries using project vocabulary.

## During Search

- Start narrow.
- Prefer exact terms from repo manifests and docs.
- Use `site:` when the target source family is known.
- Open pages before relying on them.
- Save durable findings only when they change future work.

## After Search

Bring the result back to the repo:

- update manifests when asset facts change,
- update workflow docs when the pipeline changes,
- update `docs/background-research.md` for durable external context,
- update `docs/ENGINEERING_LOG.md` for behavior/policy changes.

## Example Query Plan

For a question about mobile hero video size:

```text
site:developer.mozilla.org video autoplay muted playsinline
site:ffmpeg.org ffmpeg h264 faststart movflags
site:web.dev video encoding web performance
```

Then verify the pages and turn the result into project-specific render targets.
