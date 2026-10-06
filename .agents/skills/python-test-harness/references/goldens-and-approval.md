# Goldens and Approval

## Golden Policy
Use goldens where deterministic behaviour matters and a diff is the best
review artifact: serialized scene JSON, emitted SVG or text, CLI `--json`
envelopes, budget-probe reports, fixture hashes.

Requirements for a golden-able output:
- byte-stable across runs: sorted keys, fixed float formatting (`f"{x:.3f}"`
  or `round`, never default `repr`), no timestamps or absolute paths, stable
  iteration order;
- small enough to read in a diff, or accompanied by a summary golden (counts,
  hashes) that is;
- produced by one named command that a reviewer can re-run.

## Two Ways to Gate
1. In pytest: `@pytest.mark.golden` test that renders the output and
   compares with `Path("fixtures/golden/...").read_bytes()`. Failure prints a
   unified diff. Preferred for outputs the test can build in-process.
2. `scripts/golden_text_gate.sh --expected <golden> --actual <file>` for
   outputs produced by a script or the CLI; writes
   `dist/reports/gates/golden_text_gate_result.json` and a `.diff` under
   `dist/reports/tests/`.

## Bootstrap
The first golden is created only with an approval:
```bash
GOLDEN_APPROVAL="<reviewer>: initial capture from <command> at <commit>" \
  scripts/polymath/python-test-harness/golden_text_gate.sh \
  --expected fixtures/golden/<name> --actual dist/<name> --update
```
The script refuses `--update` without `GOLDEN_APPROVAL` (measured: exit 1)
and appends the approval block to `docs/ENGINEERING_LOG.md`.

## Update Workflow
1. Generate the candidate with the same command as the golden's header.
2. Run the gate; read the diff; decide whether the change is intended.
3. If intended: `--update` with `GOLDEN_APPROVAL` naming the reviewer and
   the behavioural reason. Fill the rest of the log block
   (`assets/templates/golden-update-log-block.md`).
4. If not intended: it is a regression; fix the code, not the golden.

An agent may propose a golden update; a human approves it. The approval
string is the record.

## Sabotage Control
Every golden lane keeps one deliberately wrong candidate in a test that
asserts the comparison fails (`test_golden_gate_detects_change`), so a
comparator that always passes is caught.
