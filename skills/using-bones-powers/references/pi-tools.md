# Claude Code → Pi tool mapping

When running on Pi, the following Claude Code tool names map to Pi equivalents.

| Claude Code | Pi | Notes |
|---|---|---|
| `Read` | (file read via Pi tooling) | Pi exposes filesystem operations through its agent runtime |
| `Edit` | (Pi edit tooling) | Refer to Pi docs for the structured edit tool |
| `Write` | (Pi write tooling) | Same |
| `Bash` | (Pi shell tooling) | Pi's shell access primitive |
| `Glob` | (Pi pattern search) | File pattern matching |
| `Grep` | (Pi content search) | File content search |
| `TodoWrite` | (no equivalent) | Pi agents track tasks via Pi's task primitives or external files |
| `Skill` | (Pi skill loading via package keyword `pi-package`) | Per `suit.config.yaml` pi conventions, skills are loaded via Pi packages |
| `Agent` / `Task` | (Pi subagent / task delegation) | Refer to Pi docs for multi-agent orchestration |

## Translation notes

- Pi is file/package-oriented — many Claude Code tools have file-based equivalents through Pi's runtime.
- TodoWrite scoping (plan-level → bones tasks; micro-steps → TodoWrite per spec § 6) carries over — track micro-steps in whatever ephemeral mechanism Pi provides.
- bones-powers' subagent-driven-development pattern depends on subagent dispatch — verify Pi's mechanism.
- Pi-specific package conventions (the `pi-package` keyword) determine how bones-powers skills appear in a Pi installation; per-skill tool naming follows Pi's runtime conventions.

(Note: this doc is best-effort based on Pi's suit-build adapter conventions; verify against Pi's official docs when adopting.)
