---
name: trace
version: 0.1.0
description: >
  Append-only JSONL trace of every tool call in the session. Records `{ts, tool,
  args, status, duration_ms}` per `PostToolUse` event so later skills can audit
  what happened without an LLM. Use when the user types "/trace", "track tool
  calls", "trace this session", "audit tool history", or asks why the agent did
  something. The hook fires automatically on every tool call; the trigger
  phrases are mostly for the agent to surface the file path on demand.
type: hook
targets:
  - claude-code
category:
  primary: evolution
  secondary:
    - context-management
hooks:
  PostToolUse:
    command: hooks/trace.sh
---

# trace

Each Claude Code session writes one JSONL file under
`.agent-config/trace/<session-id>.jsonl`. Every line is a single tool-call
record:

```json
{"ts":"2026-04-27T18:33:11Z","tool":"Bash","args":{"command":"npm test"},"status":"ok","duration_ms":1247}
```

Compared to the per-tool LLM critique pattern claude-mem uses for memory
extraction, the trace hook costs nothing at runtime (no model call, no DB
write — just a JSONL append). The cost is paid later: skills like `reflect`,
`stuck-detector`, and the evolution detectors read the trace file to spot
patterns (edit thrashing, repeated permission prompts, tool-call loops) that
would be invisible from message-history alone.

## Schema

| Field | Type | Notes |
|---|---|---|
| `ts` | ISO-8601 string | UTC, second-precision is fine |
| `tool` | string | The Claude Code tool name (`Bash`, `Read`, `Edit`, `Grep`, etc.) |
| `args` | object | Tool input. Truncated at ~2KB per record. |
| `status` | `"ok"`, `"error"`, `"blocked"` | `blocked` when a permission denial occurred |
| `duration_ms` | number | From PreToolUse to PostToolUse, when both fire |

The schema is intentionally small. Skills that need richer context resolve it
on demand from the transcript (see `skills/reflect/SKILL.md`).

## File location

`<repo-root>/.agent-config/trace/<session-id>.jsonl`

The directory is created on the first PostToolUse event and is gitignored
(see `.gitignore`).

## Disable

Tracking is disabled automatically for excluded directories
(`~/.config`, `~/Downloads`, `~/Desktop`, `/tmp`, `/var`, plus any path listed
in `.agent-config/exclude.json` or `~/.config/agent-config/exclude.json`).
See the `should-track` logic in the [suit repo](https://github.com/danmestas/suit).

To disable for a specific project that would otherwise be tracked, add the
path to a project-local exclude file:

```json
{ "exclude": ["/absolute/path/to/project"] }
```

## Cost

The hook does about 1ms of work per tool call. No LLM, no network, no DB.
Storage grows roughly linearly with session length — a 4-hour session writes
on the order of 50-200 KB of JSONL.

## Why a hook, not a daemon

claude-mem runs a stateful background process that observes events and pushes
them through an LLM extraction pipeline into SQLite + a vector index. We
deliberately reject that architecture for this repo: a single fail-safe shell
script is enough for the patterns we care about, and consumers
(`reflect`, `stuck-detector`) can read the JSONL on demand without any
running process.

## See also

- [`hooks/recall/SKILL.md`](../recall/SKILL.md) — the SessionStart counterpart that injects past context.
- [`skills/reflect/SKILL.md`](../../skills/reflect/SKILL.md) — post-task critique that consumes the trace.
- [`skills/stuck-detector/SKILL.md`](../../skills/stuck-detector/SKILL.md) — mid-task detector that reads the trace for thrashing patterns.
- [`CONVENTIONS.md`](../../CONVENTIONS.md) — fail-safe hook convention this script follows.
