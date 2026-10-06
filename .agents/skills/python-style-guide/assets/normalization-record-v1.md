# Normalization Record

One record per review-lane sweep. Fill every field; write `none` or
`unmeasured` rather than leaving a field blank.

- **Target:** <package / modules / files>
- **Commit before:** <sha>  **Commits after:** <style sha; fix and harness shas, if any>
- **Requester and agreed scope:** <who; public signatures in scope? yes/no>
- **Clean-tree baseline:** <commands run; result>
- **Excluded:** <vendored / generated / hotspot files routed to
  refactoring-governance>

## Marks and actions
| File:line | Construct found | Rule ID | Zone (hot (request/loop/load) + call site, cold, unknown) | Action (rewrite / keep+TRICKY / leave) | Reason |
|---|---|---|---|---|---|
| | | | | | |

## Perf guard (one row per hot-zone rewrite)
| Path | Bench or command | Host, interpreter, input size | Before | After | Noise floor | Decision |
|---|---|---|---|---|---|---|
| | | | | | | |

Memory (only for memory-bound zones): <peak RSS or tracemalloc peak before /
after, tool used>

## Behaviour preservation
- Existing tests: <lane run; result>
- Characterization tests added: <names>
- Oracle twins kept under `tests/`: <names, or none>
- Observable exceptions/messages changed: <none, or list with the approver's name>
- Public signatures changed: <none, or list with importers touched>

## TRICKY sites
- Kept: <file:line, one-line reason>
- Added: <file:line>
- Removed: <file:line, replaced by rule ID>

## Not done / residuals
- <what was left, why, and who owns it>
