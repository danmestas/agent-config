---
name: ac-filter-gemini
version: 0.1.0
description: >
  Hook component that reads the AC resolution artifact and injects the active
  persona/mode context (mode prompt + out-of-scope skill list) as additionalContext
  into Gemini's SessionStart hook. Used when `ac` wraps Gemini with a persona/mode.
  Path B implementation: additionalContext-only support (skill descriptions still
  load into context normally, yielding no token savings). See CONVENTIONS.md for
  fail-safe hook requirements.
type: hook
targets:
  - gemini
category:
  primary: context-management
  secondary: [economy]
hooks:
  SessionStart:
    command: hooks/filter.sh
---

# ac-filter-gemini

SessionStart hook for Gemini that reads the AC resolution artifact (`$AC_RESOLUTION_PATH`)
and injects the active persona/mode context as additionalContext. Complements
[`ac-filter-claude-code`](../ac-filter-claude-code/SKILL.md) and [`ac-filter-apm`](../ac-filter-apm/SKILL.md)
for the Gemini harness.

## Design

When `ac` launches Gemini with a persona/mode active, it:
1. Writes a JSON resolution artifact to a temporary path
2. Sets `AC_WRAPPED=1` and exports `AC_RESOLUTION_PATH` to the environment
3. Gemini's SessionStart hooks read that artifact and inject context

This hook reads the artifact and emits:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "## Active persona/mode: PersonaName\n\n<mode_prompt body>\n\nThe following skills are out-of-scope for this session and should not be invoked: skill-a, skill-b, ..."
  }
}
```

When `AC_WRAPPED` is unset (normal Gemini usage without `ac`), the hook exits 0 with `{}` (no-op).

## Output format — Path B (additionalContext-only)

Path B means additionalContext is the only supported injection mechanism in Gemini's
SessionStart hook schema. Skill descriptions still load into context normally
(no token savings).

When active, additionalContext includes:
- Header line showing the active persona/mode name (informational).
- Mode prompt body (may be multi-line markdown).
- Out-of-scope skill notice (if skillsDrop list is non-empty).

When inactive (no `AC_WRAPPED`), exits 0 with `{}`.

## Implementation notes

- Reads JSON from stdin (required by hook protocol; content is ignored).
- Writes valid JSON to stdout (Gemini's JSON-on-stdout contract).
- Exits 0 always (fail-safe per CONVENTIONS.md).
- Uses `jq` when available for correct JSON escaping; falls back to `python3` or shell.
- Logs errors to stderr but never fails loudly.

## Fail-safe behavior

Hooks must NOT block the session even on error. The hook:
- Exits 0 always, regardless of parsing errors.
- Swallows failures via `|| true` on individual commands.
- Logs unrecoverable errors to stderr (silent by default).

See [`CONVENTIONS.md`](../../CONVENTIONS.md) for the fail-safe rule.
