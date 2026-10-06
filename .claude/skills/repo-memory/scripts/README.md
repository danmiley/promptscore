# repo-memory script pack

Installed at `scripts/polymath/repo-memory/` in target repos.

## memory_audit.sh

Deterministic contract check for `docs/ai-memory/`.

```bash
./scripts/polymath/repo-memory/memory_audit.sh [target-root]
```

`target-root` defaults to the enclosing git repo root, else the current directory.

### When to run

- After install (confirm empty memory layout is valid)
- After bootstrap or consolidation
- Before committing memory changes
- In target CI if you want structural enforcement

### Exit behavior

- **Exit 0:** no hard failures (warnings may be present)
- **Exit 1:** hard failures — missing README/INDEX, untitled lesson, missing
  one-line summary, index/file disagreement, broken index link, index over
  **200 lines**, absolute host paths, obvious secret patterns

### Warnings (non-fatal)

- Lesson over ~40 lines (audit warns at 60+ lines)

## Smoke check for a new agent

After install, paste the prompt in
`assets/templates/memory-smoke-check-prompt-v1.md` (also under the installed
skill tree) to verify setup, record/update/delete, and audit in one pass.
