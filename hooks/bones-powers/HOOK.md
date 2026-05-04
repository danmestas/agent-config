---
name: bones-powers
type: hook
version: 0.1.0
description: >
  SessionStart hook for bones workspaces. Injects the using-bones-powers skill
  as additionalContext when cwd contains a `.bones/repo.fossil` marker. Outside
  a bones workspace the hook exits silently and other hooks are unaffected.
targets:
  - claude-code
---

# bones-powers hook

Detects bones workspaces via the `.bones/repo.fossil` marker and emits the
`using-bones-powers` skill content as `SessionStart` additionalContext so the
agent knows it's inside a bones project from turn one.

Payload:

- `hooks.json` — Claude Code hook manifest (SessionStart matcher).
- `session-start` — bash entrypoint, gates on the `.bones/repo.fossil` marker.
- `run-hook.cmd` — cmd shim used by `hooks.json`.
