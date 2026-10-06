# macOS Built-in CLIs

These ship with macOS — zero install, always present. Prefer them when they suffice before reaching for a Homebrew tool. (A few need the Xcode Command Line Tools, noted inline.)

## Search & files
| Tool | What it does | Replaces / note |
|------|--------------|------------------|
| `mdfind` | Spotlight search from the CLI (indexed, instant). | A pre-indexed alternative to `find`/`rg` for filename/metadata queries across the whole disk. |
| `mdls` | Dump a file's Spotlight metadata attributes. | Metadata inspection without `exiftool` for many file types. |
| `qlmanage -p` / `-t` | Quick Look preview / generate thumbnails. | Render a preview or thumbnail without opening an app. |
| `stat`, `file` | File metadata / type detection. | Route files to the right parser. |

## Text & documents
| Tool | What it does | Replaces / note |
|------|--------------|------------------|
| `textutil` | Convert RTF/DOC/DOCX/HTML/TXT. | A built-in `pandoc` for Apple-native formats. |
| `plutil` | Validate/convert/lint plist and JSON (`-convert json -`). | Inspect plists; pretty-print/validate JSON without `jq`. |
| `sips` | Image convert/resize/rotate + read/set metadata. | A built-in `imagemagick` for simple raster ops. |
| `say` | Text-to-speech (and `-o` to an audio file). | Generate audio without a TTS dependency. |

## Clipboard & UI bridge
| Tool | What it does | Replaces / note |
|------|--------------|------------------|
| `pbcopy` / `pbpaste` | Read/write the system clipboard. | Pipe command output to/from the clipboard. |
| `osascript` | Run AppleScript / JXA — drive native apps, dialogs, notifications. | Scriptable bridge to GUI apps when no CLI exists. |
| `open` | Open files/URLs/apps; `open -a`, `open -R` (reveal in Finder). | Launch the default handler for anything. |
| `screencapture` | Capture screen/window/selection to file or clipboard. | Screenshots without a third-party tool. |

## System & process
| Tool | What it does | Replaces / note |
|------|--------------|------------------|
| `caffeinate` | Prevent sleep while a command runs (`caffeinate -i <cmd>`). | Keep long agent jobs alive. |
| `pmset -g` | Power management status. | Battery/sleep state. |
| `sw_vers`, `system_profiler` | OS version / full hardware+software inventory. | Environment fingerprinting. |
| `networksetup`, `scutil` | Network configuration and state. | Inspect/change network without GUI. |
| `launchctl` | Manage launchd services/agents. | Background service control. |
| `dscl` | Directory Services (users/groups). | Local account inspection. |
| `defaults` | Read/write app & system preferences. | Toggle hidden settings; inspect app config. |
| `codesign`, `spctl`, `xattr` | Signing/Gatekeeper/quarantine attributes. | Diagnose "app is damaged"/quarantine issues; `xattr -d com.apple.quarantine`. |

## Developer (Xcode Command Line Tools)
| Tool | What it does |
|------|--------------|
| `git` | Version control (also available via Homebrew for newer versions). |
| `clang` / `make` | C/C++ toolchain and build driver. |
| `lldb` | Debugger. |
| `dtruss`, `sample`, `leaks` | Syscall trace, CPU sampling profile, leak detection (some need `sudo`). |

## When NOT to use the builtin
- **Recursive content search:** `mdfind` is indexed but coarse; for code search inside a repo, `rg` is better (respects `.gitignore`, regex, context lines).
- **Heavy image work:** `sips` handles convert/resize; reach for `imagemagick` for compositing, diffing, or format breadth.
- **Structured JSON beyond pretty-print:** `plutil` validates and pretty-prints; for querying/transforming use `jq`.
