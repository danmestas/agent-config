---
name: ac-filter-pi
version: 0.1.0
description: >
  Hook component that reads the AC resolution artifact and injects the active
  persona/mode context (mode prompt + out-of-scope skill list) via Pi's
  additionalContext on session_start. Used when `ac` wraps Pi with a persona/mode.
  Path B implementation: additionalContext-only support via sendUserMessage
  (not setActiveTools). See CONVENTIONS.md for fail-safe hook requirements.
type: hook
targets:
  - pi
category:
  primary: context-management
  secondary: [economy]
hooks:
  session_start:
    command: index.ts
---

# ac-filter-pi

SessionStart hook for Pi that reads the AC resolution artifact (`$AC_RESOLUTION_PATH`)
and injects the active persona/mode context via additionalContext. Complements
[`ac-filter-claude-code`](../ac-filter-claude-code/SKILL.md),
[`ac-filter-apm`](../ac-filter-apm/SKILL.md), and
[`ac-filter-gemini`](../ac-filter-gemini/SKILL.md) for their respective harnesses.

## Design

When `ac` launches Pi with a persona/mode active, it:
1. Writes a JSON resolution artifact to a temporary path
2. Sets `AC_WRAPPED=1` and exports `AC_RESOLUTION_PATH` to the environment
3. Pi's session_start hooks read that artifact and inject context

This hook reads the artifact and:
- Emits the mode prompt via `pi.sendUserMessage(..., { deliverAs: "steer" })`
- Includes out-of-scope skill notice (if skillsDrop list is non-empty)

When `AC_WRAPPED` is unset (normal Pi usage without `ac`), the hook is a no-op.

## Output format — Path B (additionalContext-only via sendUserMessage)

Path B means additionalContext is injected via `pi.sendUserMessage()` with
`deliverAs: "steer"` option. Skill descriptions still load into context normally
(no token savings).

When active, the message includes:
- Mode prompt body (may be multi-line markdown).
- Out-of-scope skill notice (if skillsDrop list is non-empty).

When inactive (no `AC_WRAPPED`), the hook exits silently (no-op).

## Implementation notes

- Loads resolution from `$AC_RESOLUTION_PATH` environment variable (if set).
- Reads JSON and extracts `modePrompt`, `skillsDrop` fields.
- Uses `pi.sendUserMessage()` to inject context (Path B marker; Path A deferred to Plan 9b).
- Falls back gracefully if `$AC_WRAPPED` is unset or artifact missing.

## Fail-safe behavior

Hooks must NOT block the session even on error. The hook:
- Catches JSON parse errors and silently returns if the artifact is malformed.
- Never throws; always succeeds.

See [`CONVENTIONS.md`](../../CONVENTIONS.md) for the fail-safe rule.
