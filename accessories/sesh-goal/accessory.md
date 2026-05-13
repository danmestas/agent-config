---
name: sesh-goal
version: 0.1.0
type: accessory
description: Sesh goal-management harness — auto token accounting, goal-context injection, task linkage awareness, and completion audit. Apply to any worker session that should participate in a long-horizon goal pursuit. Required for workers spawned by orch when a goal is active in the parent.
targets:
  - claude-code
  - codex
  - pi
  - gemini
include:
  skills:
    - goal-complete
    - working-with-sesh-tasks
  rules: []
  hooks:
    - goal-pursuit
  agents: []
  commands: []
---

# sesh-goal accessory

Wires a session into [sesh's goal-management protocol](https://github.com/danmestas/sesh/blob/main/docs/goal-management.md): durable, long-horizon objectives that survive turn boundaries, conversation compaction, and cold starts.

## When to use

- A worker is being spawned to advance a goal that lives in sesh's KV (parent has `SESH_GOAL_ID` exported).
- An operator session is initiating a goal pursuit and wants the same hooks + skills available locally.
- Any harness that wants to participate in the goal-management contract via the asymmetric tool surface (model can only call `update_goal(complete)` after passing a 6-step audit).

## What it bundles

- **`goal-complete` skill** — model-facing completion audit that walks 6 checks before allowing `update_goal(complete)`. Enforces the asymmetric tool surface that the substrate doesn't.
- **`working-with-sesh-tasks` skill** — teaches the worker how to read its active goal, pull tasks linked to it (filtered by `metadata.goal_id`), complete them via the CAS pull protocol, and surface partial progress to the operator.
- **`sesh-goal` hook** — Stop hook auto-accounts token estimate per turn via `sesh-ops goal account`; SessionStart hook auto-injects the active goal record into context on resume.

## Prerequisites

- A running [sesh](https://github.com/danmestas/sesh) hub (auto-spawned by `sesh up` in a project worktree).
- [`sesh-ops`](https://github.com/danmestas/sesh-ops) on `$PATH`.
- `jq` on `$PATH`.
- The session env must export `SESH_GOAL_ID` (and optionally `SESH_GOAL_SCOPE`, `SESH_GOAL_SCOPE_ID`) for the hooks and skills to activate. The hooks no-op silently when `SESH_GOAL_ID` is unset, so the accessory is safe to include in outfits that may or may not pursue goals.

## How it composes

- With `implementer` outfit: the worker pulls finding-task → completes it → loops.
- With `planner` outfit: the worker reads the goal objective + linked tasks, decomposes additional sub-tasks, links them via `sesh-ops goal link-task`.
- With `reviewer` outfit: the worker pulls a task that's in_progress, audits the work, completes or fails the task.
- With `spy` outfit: the worker observes a goal pursuit without participating — reads the record + tasks for telemetry, never claims or completes.

## See also

- [orch](https://github.com/danmestas/orch) — the harness that wires this accessory into worker spawns via `orch-spawn --accessory=sesh-goal` (auto-injected when `SESH_GOAL_ID` is set in the operator's env).
- [`sesh-ops`](https://github.com/danmestas/sesh-ops) — the reference CLI for the substrate.
- Spec: [`docs/goal-management.md`](https://github.com/danmestas/sesh/blob/main/docs/goal-management.md) in sesh.
