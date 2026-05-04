# Claude Code → Codex tool mapping

When running on Codex, the following Claude Code tool names map to Codex equivalents.

| Claude Code | Codex | Notes |
|---|---|---|
| `Read` | `read_file` | Read a file from disk |
| `Edit` | `apply_patch` | In-place edit; Codex requires a patch format (diff-like) |
| `Write` | `write_file` | Create or overwrite a file |
| `Bash` | `run_shell` | Execute shell command |
| `Glob` | `find_files` | Pattern-based file search |
| `Grep` | `search_in_files` | Content search |
| `TodoWrite` | (no exact equivalent) | Codex tracks tasks via the AGENTS.md TODO section. When a bones-powers skill says "TodoWrite a fresh checklist", treat it as "add a TODO section to your AGENTS.md scratch space and track in-task micro-steps there". |
| `Skill` | (auto-loaded) | Codex skills are loaded via AGENTS.md frontmatter. When a skill body says "invoke skill X", X is already loaded — no explicit invocation needed. |
| `Agent` / `Task` | `delegate_to` | Subagent dispatch in Codex |

## Translation notes

- bones-powers skills reference TodoWrite for in-session worker micro-steps. On Codex, use the AGENTS.md TODO section equivalent. The hybrid task model rule (plan → bones tasks, micro-steps → TodoWrite) becomes (plan → bones tasks, micro-steps → AGENTS.md TODO).
- bones-powers' `subagent-driven-development` references the `Task` tool / `Agent` dispatch. On Codex, this is `delegate_to` (or whatever Codex calls subagent dispatch — verify against current Codex docs).
- File-manipulation tools (Read/Edit/Write/Bash/Glob/Grep) have direct Codex equivalents — translate at face value.
