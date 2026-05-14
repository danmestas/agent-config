---
name: rtk-rewrite
version: 1.0.0
description: >
  Transparently rewrites raw Bash commands to their rtk equivalents at PreToolUse,
  consulting `rtk rewrite` as the single source of truth for command mapping and
  permission rules. Skips heredocs, respects deny/ask exits, and auto-allows safe
  rewrites. Gracefully passes through unchanged when rtk or jq is missing — never
  blocks the user. Use when you want invisible token-saving substitution rather
  than rtk-suggest's passive hints.
type: hook
targets:
  - claude-code
category:
  primary: economy
license:
  upstream: Apache-2.0
  source: rtk-ai/rtk@3ba1634
  path: .claude/hooks/rtk-rewrite.sh
hooks:
  PreToolUse:
    matcher: Bash
    command: hooks/rtk-rewrite.sh
---

# rtk-rewrite

Transparent rtk substitution. PreToolUse fires before Claude Code runs Bash; this hook asks the local `rtk rewrite` binary whether the command has a token-saving equivalent and, if so, swaps the command string before execution. No suggestion is shown to the model — the rewrite is invisible.

## Behavior

- Reads PreToolUse JSON from stdin, extracts `tool_input.command`.
- Guards: silently exits 0 (no-op) if `rtk` or `jq` is missing from `PATH`. The raw command then runs unchanged. This is the **graceful pass-through** that lets the hook ship in environments that haven't installed rtk yet.
- Skips heredocs (`<<`) — rewrites would be unsafe.
- Calls `rtk rewrite "$CMD"`. The rtk binary's exit code is the protocol:

| Exit | Meaning | Hook action |
|------|---------|-------------|
| `0` + stdout | Rewrite found, no permission rules matched | Auto-allow and substitute |
| `1` | No rtk equivalent | Pass through unchanged |
| `2` | Deny rule matched | Pass through; let Claude Code's native deny rule handle it |
| `3` + stdout | Ask rule matched | Substitute the command but omit `permissionDecision` so Claude Code prompts |

- On success (exit 0), emits a `PreToolUse` hook response with `permissionDecision: allow`, `permissionDecisionReason: "RTK auto-rewrite"`, and an `updatedInput` containing the rewritten command (other tool_input fields preserved).
- On exit 3 (ask), emits `updatedInput` but no permission decision — the user sees the prompt with the rewritten command pre-filled.

## Why a single rewrite source of truth

The hook contains no mapping logic. All command→rewrite knowledge lives in `rtk`'s registry (`src/discover/registry.rs`), so adding a new rewritable command is a one-place change in rtk itself. The hook reflects whatever rtk knows.

## Audit log

Set `RTK_HOOK_AUDIT=1` to log every decision to `${RTK_AUDIT_DIR:-$HOME/.local/share/rtk}/hook-audit.log` as pipe-delimited records: `timestamp | action | original | rewritten`. Useful when diagnosing "why didn't this rewrite?" or "what got auto-allowed last week?".

## Files

- `hooks/rtk-rewrite.sh` — payload script wired to `PreToolUse:Bash`. Version-tagged via `# rtk-hook-version: 3`.

## Pairs with

- `hooks/rtk-suggest` — passive hints instead of auto-rewrites. **Don't enable both** — they collide on the same event.
- `skills/rtk-tdd`, `skills/rtk-triage`, `skills/rtk-pr-review` — the rtk-specific skill pack.

## Source

Vendored from `github.com/rtk-ai/rtk` at commit `3ba1634` (`.claude/hooks/rtk-rewrite.sh`). Apache-2.0; see `THIRD_PARTY_LICENSES.md`.
