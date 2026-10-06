# Packaging and Distribution

The release is more than the executable. Language-neutral here; route Homebrew tap/formula mechanics to `rust-homebrew-distribution` and Rust build specifics to `rust-cli-app`.

## Deliverable Contents

Each release should produce:

- versioned archives per supported target containing the binary, license, notices, a concise README, and shell completions (or instructions to generate them);
- SHA-256 checksums in a separately downloadable file;
- signatures or artifact attestations and verification instructions;
- an SBOM where dependency or enterprise policy makes it useful;
- generated man pages and shell completions;
- release notes that call out CLI, output-schema, config, and install changes;
- a machine-readable release manifest naming artifacts, targets, hashes, and minimum platform requirements.

See `assets/templates/release-evidence-checklist-v1.md`.

## Target Matrix

Recommended initial set:

- `aarch64-apple-darwin`, `x86_64-apple-darwin`;
- `x86_64-unknown-linux-gnu`, and `aarch64-unknown-linux-gnu` when demand exists;
- `x86_64-pc-windows-msvc`, adding ARM Windows from demonstrated demand.

Do not promise musl as a universal Linux binary without testing DNS, TLS, native dependencies, and the actual supported distributions.

## Distribution Lanes

| Lane | Strength | Cost / risk | Recommendation |
|---|---|---|---|
| Homebrew tap | familiar upgrades on macOS/Linux; auditable formula | tap token and formula lifecycle | primary macOS lane |
| GitHub Release archives | transparent, universal fallback | manual PATH/update work | always publish |
| shell/PowerShell installer | low-friction onboarding | security scrutiny; PATH mutation | offer with pinned-version + checksum verification |
| `cargo install` (crates.io) | natural for Rust devs | compiles locally; toolchain/native-dep burden | secondary developer lane |
| WinGet/Scoop/Chocolatey | native Windows discovery/upgrades | more manifests + automation | add based on audience |
| Nix | reproducible; attractive to advanced operators | maintenance and channel lag | community or later lane |
| self-update | convenient for standalone installs | channel/rollback/trust, package-manager conflicts | defer unless direct installs dominate |

`cargo-dist` can generate archives, checksums, installers, GitHub release workflows, and a Homebrew formula; the alternative is a smaller hand-authored Actions pipeline. Choose automation only after reviewing its generated workflow and deciding who owns upgrades to that tool. Regardless of generator, **test the published artifact**, not only the workspace binary.

## A Download Button Is a Contract

If a "Download" link points at an asset that is not actually published, the link is worse than no button. Durable pattern:

- a tag-driven release workflow (on `v*` pushes) builds and publishes artifacts;
- publish **both** versioned names (`tool_v1.2.3_arm64.tar.gz`) and **stable-alias** names (`tool_arm64.tar.gz`);
- link marketing/download pages to GitHub's `releases/latest/download/<stable-name>` pattern so the link never breaks across releases;
- automate artifact creation from a tag, never manual uploads.

A separate `bump-tap` workflow can fire on `release: published` to resolve the new tag, recompute the archive SHA-256, and open a PR against the tap formula — keeping the Homebrew lane in sync without manual edits (mechanics: `rust-homebrew-distribution`).

## GitHub Pages Note

Auto-assigned Pages subdomains are not directly renamable. For a polished URL, configure a custom domain in Pages settings via DNS — plan this early if the product surface is meant to feel finished. Product-site build/publish mechanics: `product-site-pages`.
