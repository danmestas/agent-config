---
name: goal-pursuit
version: 0.1.0
description: >
  Two hooks for sesh's goal-management contract. Stop hook auto-accounts an
  estimated token cost per assistant turn via `sesh-ops goal account` when
  `SESH_GOAL_ID` is exported in the environment. SessionStart hook injects
  the active goal record + linked-task summary into context on initial
  connection or `/resume`. Both no-op silently when no goal is active, so
  including this hook is safe for any session.
type: hook
targets:
  - claude-code
category:
  primary: backpressure
  secondary:
    - context-management
    - integrations
hooks:
  Stop:
    command: hooks/sesh-goal-stop-account.sh
  SessionStart:
    command: hooks/sesh-goal-session-context.sh
---

# goal-pursuit

Wires a Claude Code session into [sesh's goal-management substrate](https://github.com/danmestas/sesh/blob/main/docs/goal-management.md). The hooks rely on three env vars:

| Env | Purpose | Default |
| --- | --- | --- |
| `SESH_GOAL_ID` | Active goal record id (required to activate) | unset → no-op |
| `SESH_GOAL_SCOPE` | sesh scope where the record lives | `project` |
| `SESH_GOAL_SCOPE_ID` | scope-id (project name, etc.) | cwd basename, sanitized |

When `SESH_GOAL_ID` is unset, both hooks exit 0 immediately and produce no output. This makes the hook safe to include in any outfit — it's free unless the operator opts in by exporting the env vars (typically via `orch-goal-pursue`).

## Stop hook (`hooks/sesh-goal-stop-account.sh`)

Fires on every assistant turn end. When a goal is active, calls:

```sh
sesh-ops --scope "$SESH_GOAL_SCOPE" --scope-id "$SESH_GOAL_SCOPE_ID" \
  goal account "$SESH_GOAL_ID" "${ORCH_GOAL_TOKEN_ESTIMATE:-5000}"
```

This CAS-increments the goal's `used_tokens` counter. If the running total meets or exceeds `token_budget`, sesh-ops auto-transitions the goal to `budget_limited` and the next turn's SessionStart hook surfaces that status.

The default per-turn estimate is 5000 tokens. Override with `ORCH_GOAL_TOKEN_ESTIMATE` for a closer model-specific approximation. A production harness with access to the model SDK's reported usage should set the env var per turn for accuracy; v0.1 ships the fixed estimate.

**Failure policy:** if `sesh-ops` isn't on `$PATH` or the call fails, the hook logs to stderr and exits 0. Goal accounting is best-effort observability — a broken hook must never block the user's session.

## SessionStart hook (`hooks/sesh-goal-session-context.sh`)

Fires on session-init and `/resume`. When a goal is active, reads the goal record from sesh and emits `additionalContext` JSON per Claude Code's SessionStart hook contract:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Active goal pursuit:\n  id: ...\n  objective: ...\n  status: ...\n  budget: ...\n  tasks: ...\n"
  }
}
```

This is the mechanism by which long-horizon goals survive context loss: the goal record persists in sesh's KV; the hook re-reads it on every cold start; Claude picks up where the last session left off.

## Prerequisites

- [`sesh-ops`](https://github.com/danmestas/sesh-ops) on `$PATH`.
- A running [sesh](https://github.com/danmestas/sesh) hub (auto-spawned by `sesh up` in a project worktree).
- `jq` on `$PATH`.

## Bundled with

This hook is bundled in the `sesh-goal` accessory along with the `goal-complete` and `working-with-sesh-tasks` skills. Apply the accessory to any worker outfit that should participate in a goal pursuit. Alternatively, include the hook directly via `--accessory=sesh-goal` or `suit show hook sesh-goal` for inspection.

## See also

- [orch](https://github.com/danmestas/orch) — auto-injects this accessory into worker spawns when the operator has an active `SESH_GOAL_ID`.
- Spec: [`docs/goal-management.md`](https://github.com/danmestas/sesh/blob/main/docs/goal-management.md), section "Token accounting and budget enforcement".
