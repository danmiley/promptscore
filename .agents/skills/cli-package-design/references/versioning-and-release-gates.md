# Versioning, Deprecation, and Release Gates

Maintain separate but connected versions for each surface so a human-facing feature release never silently breaks an automated integration.

## Surfaces and Their Rules

| Surface | Versioning rule |
|---|---|
| Binary / package | SemVer; MAJOR for incompatible command/config/default changes |
| Machine output | integer `schema_version`; additive fields allowed within a version if documented |
| Config file | integer format version with explicit migration/diagnostic path |
| Run metadata / ledgers | schema or rubric version plus tool version, target identity, environment, and policy knobs |
| Remote API | negotiate independently from the CLI package version |
| Toolchain (e.g. Rust MSRV) | publish and test it; raise it in release notes |
| Documentation | ship and publish from the same tag as the binary |

A CLI may add human features in `2.4.0` while still emitting `schema_version: 1`. **Never force users to match the binary version to the JSON version.** Support explicit format negotiation for durable integrations:

```console
$ tool inspect --output json --schema-version 1
$ tool watch  --output jsonl --schema-version 1
```

## Compatibility Policy

- **Patch:** bug and security fixes; no intentional contract changes.
- **Minor:** additive commands, flags, fields, opt-in behavior. Existing scripts keep working.
- **Major:** removals, renames, incompatible defaults, exit reclassification, or config changes without transparent migration.
- **Experimental** surfaces carry an explicit marker in help and structured metadata; excluded from normal stability promises but still noted in the changelog.
- **Deprecations** warn on stderr for humans and appear in a structured `warnings` field for machine mode. Keep aliases for at least two minor releases or a stated time window before a major removal.
- **Never** silently change the meaning of an existing flag — add a new flag or version the relevant protocol.

Before `1.0`, publish a narrower written contract rather than claiming every accident is stable. Still treat structured output and destructive behavior as stable as soon as external users automate against them.

## Release Gates (Contract Tests)

Run at minimum the language-native fmt/lint/test gates (see `rust-cli-app` for the Rust set), plus black-box tests that execute the real binary for:

- the full command tree and help snapshots;
- JSON/JSONL schema compatibility and absence of stderr contamination;
- every documented exit class;
- TTY and non-TTY interaction behavior;
- config precedence and origin reporting;
- dry-run equivalence (proves it plans the same operation without committing);
- read-only diagnostics (`doctor`/`check`) leave the filesystem and user config untouched;
- pagination, timeouts, cancellation, retries, and partial failures;
- secret redaction;
- completions, man pages, capability manifest, and reference-doc drift;
- install, upgrade, and uninstall smoke tests on supported targets.

Use `assets/templates/release-evidence-checklist-v1.md` to record that each release produced its required artifacts and passed its gates.

When comparing generated ledgers or benchmark runs, compare metadata first: tool version, schema/rubric version, target URL or environment class, scenario set, and policy flags. Treat mismatches as advisories or incompatibility notes before interpreting metric deltas, so a schema change is not mistaken for a product regression.

## Pilot Decisions Worth Making Explicitly

1. Is the primary object model naturally resource/action, or is a smaller verb-led surface clearer?
2. Do machine errors go to stdout as a result envelope or stderr as a separate JSON stream? Pick once and contract-test it.
3. Is field selection (`--fields`) needed in v1, or is full JSON small enough initially?
4. Which mutations can be truly dry-run, and which can only validate locally?
5. Is a plugin/extension model a real requirement or premature architecture?
6. Does the audience justify a self-updater, or will package managers own upgrades?
7. What is the minimum support matrix, MSRV, and deprecation window the team can continuously test?
