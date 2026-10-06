# Memory system smoke check

Run this after `repo-memory` is installed and you have started a fresh agent
session in the target repo.

---

**Prompt (copy from here):**

Verify the repo-memory system end to end in this repository:

1. **Confirm install wiring** — Check that `docs/ai-memory/README.md` and
   `docs/ai-memory/INDEX.md` exist, and that root `AGENTS.md` contains the
   `polymath:repo-memory` managed block. If any of these are missing, run the
   repo-memory Setup Workflow from the installed skill before continuing.

2. **Recall** — Read `docs/ai-memory/INDEX.md`. Open zero or more lesson files
   only if their hooks match this task (an empty index is OK).

3. **Record** — Add a temporary smoke-test lesson:
   - Copy the lesson template from the installed skill assets.
   - File: `docs/ai-memory/smoke-test-lesson.md`
   - Title: "Smoke test lesson"
   - One-line summary: "Repo memory record/update/delete path works."
   - Add one matching line to `INDEX.md`.

4. **Update** — Append `Last confirmed: <today's date>` to that lesson.

5. **Audit** — Run `./scripts/polymath/repo-memory/memory_audit.sh` and report
   the output. It must exit 0.

6. **Delete** — Remove the smoke-test lesson file and its index line (git
   history is the archive; leave no tombstone).

7. **Audit again** — Re-run the audit script; it must exit 0 with zero lessons.

Report: what existed before step 1, what you created/changed, both audit
outputs, and whether always-on recall via `AGENTS.md` would work on the next
session without loading the skill again.

---

**Expected outcome:** steps 1 and 5–7 pass; the repo is ready for real lessons.
Do not commit the smoke-test lesson — delete it in step 6.
