# Claude Code → Copilot CLI tool mapping

When running on GitHub Copilot CLI, the following Claude Code tool names map to Copilot equivalents.

| Claude Code | Copilot CLI | Notes |
|---|---|---|
| `Read` | `read_file` (or `cat` via shell) | Copilot CLI primarily uses shell; some implementations expose `read_file` |
| `Edit` | (shell-based: `sed`/`patch` via shell) | Copilot CLI doesn't have a structured Edit tool — use shell tools |
| `Write` | (shell: `tee`/`>` redirection) | Same — shell-based |
| `Bash` | shell (default in Copilot CLI) | Direct shell execution is the primary tool |
| `Glob` | shell (`find` / `ls`) | Pattern matching via shell |
| `Grep` | shell (`grep` / `rg`) | Content search via shell |
| `TodoWrite` | (no equivalent) | Copilot CLI doesn't have a structured task-tracking tool. Track in conversation or via external file. |
| `Skill` | (Copilot CLI skill mechanism per its docs) | If Copilot CLI supports skills, refer to its docs for invocation; otherwise skill content is implicitly loaded into context. |
| `Agent` / `Task` | (subagent — refer to Copilot CLI docs) | Copilot CLI's multi-agent orchestration may differ — adapt dispatch patterns from skill prose. |

## Translation notes

- Copilot CLI is more shell-centric than Claude Code. Tool calls that Claude Code expresses via structured `Edit` / `Write` invocations become shell commands (`sed -i`, `>`, `tee`, etc.) on Copilot CLI.
- TodoWrite has no direct equivalent — track micro-steps in conversation or a temp file.
- bones-powers' subagent-driven-development pattern depends on subagent dispatch — verify Copilot CLI's mechanism.

(Note: this doc reflects Copilot CLI v1.x patterns; verify against the version you're running.)
