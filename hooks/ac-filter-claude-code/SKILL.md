---
name: ac-filter-claude-code
version: 1.0.0
type: hook
description: ac wrapper filter for Claude Code — reads $AC_RESOLUTION_PATH and injects mode prompt + out-of-scope skill list as additionalContext
targets: [claude-code]
category:
  primary: context-management
  secondary: [economy]
hooks:
  SessionStart:
    command: hooks/filter.sh
    matcher: "*"
---

# ac-filter-claude-code

Companion hook for the `ac` wrapper. When `ac claude --persona X --mode Y`
runs, the wrapper writes a resolution artifact and exports `AC_RESOLUTION_PATH`.
This hook reads that artifact at SessionStart and injects `additionalContext`
into the session so Claude honours the active persona/mode constraints.

When `ac` is not in use (no `AC_WRAPPED` env var), this hook is a no-op.

## Implementation note

**Path B — additionalContext only.** Research into the Claude Code SessionStart
hook output schema (docs.anthropic.com/en/docs/claude-code/hooks) confirms that
the only supported output key for injecting content is `additionalContext` inside
`hookSpecificOutput`. There is no documented `skillsToRemove`, `disabledSkills`,
or equivalent key that would allow the hook to mutate the loaded skill catalog at
runtime. As a result, this implementation injects the mode prompt body plus a
prose instruction listing out-of-scope skills; the skill descriptions themselves
still load into the context window (no token savings). This is a known limitation.
A future Plan 9b can revisit with Path C (pre-launch compose: `ac` rewrites
`~/.claude/settings.json` / symlinks a curated `.claude/skills/` directory before
exec) to achieve full token reduction.

## Output format

When active, the hook emits:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "...<modePrompt>...\n\nThe following skills are out-of-scope for this session and should not be invoked: skill-a, skill-b, ..."
  }
}
```

When inactive (no `AC_WRAPPED`), the hook exits 0 with `{}` — Claude Code
treats the absence of `additionalContext` as a no-op.
