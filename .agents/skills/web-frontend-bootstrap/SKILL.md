---
name: web-frontend-bootstrap
description: Use to bootstrap a new web/frontend project when framework/runtime is not finalized; framework selection tradeoffs, minimal repo structure, quality baseline, and decision logging.
license: MIT
metadata:
  version: "1"
  track: addon
  model-posture: any
  ported-from: codex-skills-dev/web-frontend-bootstrap-2026
---

# Web Frontend Bootstrap
## Purpose
Use this skill to bootstrap a new web/frontend project when framework/runtime is not finalized. Keep decisions reversible and prioritize fast iteration.

## Outcomes
- Establish minimal repo structure for frontend delivery.
- Choose framework path with explicit tradeoffs (Next.js, Vite+React, Astro).
- Set quality baseline: linting, formatting, smoke test, preview/build scripts.
- Add decision log so architecture choices are transparent.

## Workflow
1. Detect current repo signals:
   - Check for `package.json`, lockfiles, config files, and existing app directories.
2. If no framework exists:
   - Recommend one of: Next.js, Vite+React, Astro.
   - Default to Vite+React for fastest neutral start unless product constraints require SSR.
3. Create baseline standards:
   - `README.md` with run/build/test commands.
   - `docs/architecture/decision-log.md` with dated decisions.
   - `.editorconfig` and formatting/lint scripts.
4. Validate locally:
   - Run install, lint, build, and one smoke test command.
5. Report:
   - List created/updated files and unresolved decisions.

## Guardrails
- Avoid introducing backend or hosting lock-in until requirements are explicit.
- Prefer small, composable setup over large opinionated scaffolds.
- Keep visual direction intentional and non-generic for landing pages.

## Required Read
- Repo onboarding start docs (`AGENTS.md`, `READMEFIRST.md`, `docs/starting-prompt.md`) when present in the target repo.
