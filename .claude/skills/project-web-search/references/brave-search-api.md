# Brave Search API Notes

This repo uses Brave Search as a targeted discovery lane when a task needs current external evidence.

## Key Provisioning And The Two Access Lanes

A Brave key is reachable over two independent lanes. They fail separately, and
a healthy lane tells you nothing about the other one.

- **Tool lane** — the agent calls a Brave MCP/plugin tool directly. The MCP
  client holds its own copy of the key in its server configuration and passes
  it to the server process. Nothing else in the session inherits it.
- **Key lane** — a script, harness shell, or pipeline step reads the key from
  its own process environment (`os.environ["BRAVE_API_KEY"]`,
  `$BRAVE_API_KEY`). This lane depends entirely on how the environment was
  populated for *that* process.

The common failure is a key that is live in an interactive terminal and
invisible to everything else.

### Where A Key Can Hide

| Location | Reaches | Misses |
| --- | --- | --- |
| `~/.zshrc`, `~/.bashrc` | interactive shells only | scripts, agent shell tools, cron, `launchd`, any non-interactive child |
| `~/.zshenv` | every zsh, interactive or not | non-zsh processes started outside a shell |
| `~/.zprofile`, `~/.bash_profile`, `~/.profile` | login shells | non-login shells, most spawned processes |
| MCP client configuration | the MCP server process | every other process, including the agent's own shell |
| Project `.env` | whatever explicitly loads it | anything that does not load it |
| CI/CD secret store | configured jobs | local runs |
| OS keychain via a helper | callers that invoke the helper | direct environment reads |

Shell rule behind the top two rows: zsh reads `~/.zshenv` for *every*
invocation and `~/.zshrc` only for interactive ones; bash reads `~/.bashrc`
only for interactive shells and `$BASH_ENV` (when set) for non-interactive
ones. So `export KEY=...` in `~/.zshrc` works all day in a terminal and is
absent from every script the terminal launches.

### Safe Probes

Presence and length only. Never echo, log, or commit a key value.

```sh
# Key lane, as the current process sees it
[ -n "${BRAVE_API_KEY:-}" ] && echo "set (len ${#BRAVE_API_KEY})" || echo "not set"

# Key lane, as a non-interactive child sees it — this is what a script gets
zsh -c '[ -n "${BRAVE_API_KEY:-}" ] && echo set || echo "not set"'

# Which startup file defines it (filenames only, no values)
grep -ln 'BRAVE_API_KEY' ~/.zshenv ~/.zshrc ~/.zprofile ~/.profile ~/.bashrc 2>/dev/null
```

Tool lane: find the Brave callable in the active tool inventory, then make one
small live call. A callable listed but never exercised is presence, not proof.

| Probe result | Reading |
| --- | --- |
| Tool call succeeds, key lane empty | key is in MCP configuration only; scripts stay blind |
| Key lane set, no Brave callable | scripts can search; the agent cannot call Brave itself |
| Key lane set only in an interactive shell | terminal works, every automated lane fails |
| Neither | no Brave access; degrade to local-only and say so |

### Remediation Is Standing Configuration

Moving a key between lanes changes the user's persistent environment and is
their call. Report the diagnosis — which lane is dead, which file would fix
it, what that unblocks — and let the owner apply it. Do not relocate, copy, or
re-export a key value on their behalf, and do not paste a key into a command,
a log, or a commit.

### Warning Text In Repo Code

Code in this repo that depends on the key lane should say what the caller now
lacks, not what the lookup just did. `BRAVE_API_KEY not set` reads as "you
have no key" when the usual cause is a key that exists somewhere unreachable
from this process. Name the consequence and the likely cause:
external verification is disabled for this run, and an interactive-only export
looks identical to no key at all from here.

## Local Observations

- Parallel Brave Search API calls have been easy to rate-limit in this workspace.
- Serial usage has been much more reliable: prior audit work succeeded with about 1.5 seconds between calls.
- Treat observed failures as possible burst throttling unless a response clearly says otherwise.

## Recommended Pattern

```text
query 1 -> inspect/open target page -> wait ~1.5s
query 2 -> inspect/open target page -> wait ~1.5s
query 3 -> inspect/open target page
```

- Keep query batches small, usually 5-8 high-value calls at most.
- Request small result counts unless broad discovery is necessary.
- Use Brave to find candidate pages, then open primary pages directly.
- Do not repeat the same claim search when a direct source URL is available.

## Useful Operators

- `site:developer.mozilla.org video autoplay`
- `"ffmpeg" "faststart" mp4`
- `site:trac.ffmpeg.org color management rec.709`
- `webm OR av1 browser support video`
- `ffprobe color_transfer color_primaries`

## Rate Limit Handling

1. Stop Brave calls immediately.
2. Wait 5-10 seconds.
3. Retry one targeted query serially.
4. If the retry succeeds, slow down to 2-3 seconds between calls.
5. If it fails, use standard web search or direct URLs and note the fallback in the research log.

## Search-Effort Note

When Brave materially informs a change, record:

- number of Brave calls attempted,
- number that succeeded,
- number that rate-limited,
- approximate spacing,
- verified pages used,
- fallback search path, if any.
