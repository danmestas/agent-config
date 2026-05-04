# Claude Code → Gemini tool mapping

When running on Gemini, the following Claude Code tool names map to Gemini equivalents.

| Claude Code | Gemini | Notes |
|---|---|---|
| `Read` | `read_file` | Read a file from disk |
| `Edit` | `edit_file` | In-place edit |
| `Write` | `write_file` | Create or overwrite a file |
| `Bash` | `run_shell_command` | Execute shell command |
| `Glob` | `glob` | Pattern-based file search |
| `Grep` | `grep` | Content search |
| `TodoWrite` | (no direct equivalent) | Gemini agents track tasks via conversation context or external tooling. When a bones-powers skill says "TodoWrite a fresh checklist", maintain that checklist as a tracked list in your context. |
| `Skill` | (loaded via Gemini settings) | Gemini skills are loaded via `~/.gemini/settings.json` skill registration. When a skill body says "invoke skill X", X is loaded if registered. |
| `Agent` / `Task` | (Gemini subagent equivalent) | Gemini's subagent dispatch — refer to Gemini CLI docs for the exact tool name. |

## Translation notes

- TodoWrite scoping (plan-level → bones tasks; in-session micro-steps → TodoWrite per spec § 6) carries over to Gemini — track micro-steps in whatever ephemeral mechanism Gemini provides (conversation context, internal scratchpad, or external file).
- bones-powers' `subagent-driven-development` references subagent dispatch. Gemini's subagent mechanism may differ — refer to Gemini CLI subagent docs and adapt the dispatch pattern.
- File tools translate directly.

(Note: this doc is best-effort based on current Gemini CLI public surface; verify against the latest Gemini CLI docs when adopting.)
