# Release Evidence Checklist — <tool-name> v<version>

Record that this release produced its required artifacts and passed its gates. The release is more than the executable.

## Artifacts produced
- [ ] Versioned archives per supported target (binary + license + notices + README + completions)
- [ ] SHA-256 checksums in a separately downloadable file
- [ ] Signatures or artifact attestations + verification instructions
- [ ] Man pages and shell completions
- [ ] SBOM (if dependency/enterprise policy requires)
- [ ] Machine-readable release manifest (artifacts, targets, hashes, min platform)
- [ ] Stable-alias asset names published alongside versioned names
- [ ] Release notes calling out CLI / output-schema / config / install changes

## Contract gates passed (real-binary, black-box)
- [ ] Language-native fmt / lint / test gates
- [ ] Full command tree + help snapshots
- [ ] JSON/JSONL schema compatibility; no stderr contamination of stdout
- [ ] Every documented exit class
- [ ] TTY and non-TTY interaction behavior
- [ ] Config precedence and origin reporting
- [ ] Dry-run equivalence
- [ ] Pagination, timeouts, cancellation, retries, partial failures
- [ ] Secret redaction
- [ ] Completions / man pages / capability manifest / reference-doc drift check
- [ ] Install, upgrade, uninstall smoke tests on supported targets

## Versioning surfaces
- [ ] Package SemVer bump correct for the change class (patch/minor/major)
- [ ] Output `schema_version` unchanged, or bumped with documented migration
- [ ] Config format version unchanged, or migration path shipped
- [ ] Deprecations warned (stderr + machine `warnings`); aliases retained per policy
- [ ] Docs/site published from the same tag as the binary

## Distribution lanes verified
- [ ] Always-publish GitHub Release archives present and downloadable
- [ ] `releases/latest/download/<stable-name>` resolves
- [ ] Homebrew/other primary lane bumped and installs cleanly (route mechanics to rust-homebrew-distribution)
- [ ] Published artifact (not just the workspace binary) tested
