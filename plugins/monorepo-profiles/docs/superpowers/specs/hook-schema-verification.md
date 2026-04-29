# SessionStart hook output schema verification

**Date:** 2026-04-29
**Source:** https://docs.claude.com/en/docs/claude-code/hooks (sections "Add context for Claude" and "SessionStart decision control")
**Verdict:** Spec assumption matches the official schema. No spec changes required.

## Verified schema

To inject text into the model's session context from a SessionStart hook, the
hook command writes the following JSON object to stdout:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Current branch: feat/auth-refactor\nUncommitted changes: src/auth.ts, src/login.tsx\nActive issue: #4211 Migrate to OAuth2"
  }
}
```

- Top-level key: **`hookSpecificOutput`** (object).
- Required nested fields:
  - **`hookEventName`** — must equal `"SessionStart"` for the SessionStart event.
  - **`additionalContext`** — string. Claude Code wraps it in a system reminder
    and inserts it into the conversation at the start, before the first prompt.

The docs also note: "Any text your hook script prints to stdout is added as
context for Claude" for SessionStart specifically. The structured JSON form is
preferred because it is explicit and survives format changes to plain stdout
handling.

## Other fields a SessionStart hook can return

These come from the universal "JSON output" section and apply to every hook
event, including SessionStart:

| Field | Default | Description |
| --- | --- | --- |
| `continue` | `true` | If `false`, Claude stops processing entirely after the hook runs. Takes precedence over event-specific decision fields. |
| `stopReason` | none | Message shown to the user when `continue` is `false`. Not shown to Claude. |
| `suppressOutput` | `false` | If `true`, omits stdout from the debug log. |
| `systemMessage` | none | Warning message shown to the user. |

SessionStart-specific decision-control fields are limited to
`hookSpecificOutput.additionalContext` (per the SessionStart decision-control
table in the docs). Top-level `decision`/`reason` are NOT used by SessionStart;
the docs list `decision: "block"` only for `PreToolUse`, `UserPromptSubmit`,
`PostToolUse`, `PostToolBatch`, `Stop`, `SubagentStop`, `ConfigChange`, and
`PreCompact`.

## Implication for this plugin

`bin/mr-profile.mjs session-start` should:

1. Read the active profile and concatenate `instruction_fragments`.
2. Print a single JSON object to stdout matching the verified schema above.
3. Exit 0. Use `continue: false` + `stopReason` only on a fatal error where the
   user must intervene; otherwise print an empty `additionalContext` and exit 0
   so a missing/broken profile never blocks session startup.
