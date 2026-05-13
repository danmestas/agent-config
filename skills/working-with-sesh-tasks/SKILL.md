---
name: working-with-sesh-tasks
version: 0.1.0
targets: [claude-code, codex, pi, gemini]
type: skill
description: Use when you are a worker participating in a sesh goal pursuit (SESH_GOAL_ID is set in your environment) and need to find, claim, work on, or complete tasks linked to that goal. Covers the CAS pull protocol, goal-id filtering (pull-discipline so you don't poach tasks tagged to other goals), task state transitions, and how to surface partial progress to the operator. Triggers when you say "let me check the task queue", "pull the next task", "complete this task", "what's left to do", or when you boot into a session with SESH_GOAL_ID exported.
---

# Working with sesh tasks under a goal pursuit

You are a worker session that has been spawned (or is operating) under an active sesh goal pursuit. The operator has exported `SESH_GOAL_ID`, `SESH_GOAL_SCOPE`, and `SESH_GOAL_SCOPE_ID` into your environment. This skill teaches you to participate in the goal's task queue without poaching tasks tagged to other goals.

## First action on session start

Always begin by orienting:

```sh
# What goal am I pursuing?
sesh-ops --scope "$SESH_GOAL_SCOPE" --scope-id "$SESH_GOAL_SCOPE_ID" \
  goal get "$SESH_GOAL_ID"

# What tasks are linked to it?
sesh-ops --scope "$SESH_GOAL_SCOPE" --scope-id "$SESH_GOAL_SCOPE_ID" \
  goal get "$SESH_GOAL_ID" | jq '.tasks // []'
```

If the goal's `status` is anything other than `pursuing`, STOP. Report to the operator. Do not claim or complete tasks against a `paused`, `achieved`, `unmet`, or `budget_limited` goal.

## Pull discipline (CRITICAL)

Sesh's task pull protocol is goal-aware via the `metadata.goal_id` convention. When you pull a task, you MUST filter by goal context to avoid poaching tasks meant for a different pursuit:

| Your context | Pull tasks where… |
| --- | --- |
| Pursuing goal `G` (you are a worker spawned for goal G) | `task.metadata.goal_id == G` OR `task.metadata.goal_id == null` (untagged tasks in the free pool) |
| Not pursuing any goal | `task.metadata.goal_id == null` |
| Explicitly opted into goal-agnostic pool | any task (must be operator-blessed via `--allow-foreign-goal-pull`) |

In practice: only claim tasks whose `metadata.goal_id` matches your `SESH_GOAL_ID`, OR has no goal-id at all.

## Pulling a task

The `sesh-ops task pull` command CAS-claims the highest-priority eligible task and atomically transitions it to `in_progress`:

```sh
# Pull from your goal's task scope (often same as goal scope; verify by checking goal.tasks)
sesh-ops --scope workflow --scope-id "<workflow-id>" task pull --puller "claude-code:worker-${ORCH_PANE_ID:-solo}"
```

`task pull` may emit `no pullable tasks` — that's normal and means either:
1. All goal-linked tasks are claimed by other workers, or
2. They're all `completed` / `cancelled` (goal completion is imminent)

If you pulled a task NOT linked to your goal (the substrate doesn't enforce goal-filtering on pull):

```sh
# Check the claimed task's goal_id
sesh-ops task get <task-id> | jq -r '.metadata.goal_id // "null"'
```

If it doesn't match your `SESH_GOAL_ID` AND is not `null`, **fail the task back to pending immediately**:

```sh
sesh-ops task fail <task-id> --result '{"error":"foreign-goal poach refused; releasing for original goal worker"}'
```

This restores the task for the right worker to pull.

## Working on a task

Once you've claimed an eligible task:

1. **Extend the deadline** periodically (every 10s, with a 30s push) so it doesn't lapse back to pending while you work:
   ```sh
   sesh-ops task extend <task-id> --by 30s
   ```
2. Do the work. The task's `title` and `description` are your spec. The task's `metadata` may carry additional structured context (e.g., a finding's severity, a target file path).
3. If the work depends on something not in the task, surface to the operator. Do NOT make scope-creep decisions unilaterally on a long-horizon goal — the operator owns scope.

## Completing a task

```sh
sesh-ops task complete <task-id> --result '{"output":"<what was produced>", "artifacts":[...]}'
```

The `--result` should mirror the goal-completion artifact shape: include commit SHAs, file paths, PR URLs — anything a future reader (or the operator's `goal-complete` audit) needs to verify the work.

## Failing a task

If the work is blocked or impossible:

```sh
sesh-ops task fail <task-id> --result '{"error":"<why>", "next_step":"<recommendation if any>"}'
```

The task returns to `pending` (or `failed` if `max_attempts` exhausted). Surface to the operator that you failed it.

## Block / unblock for external dependencies

If the work needs to pause for an external dependency (e.g., a code review, an API access grant), block instead of failing:

```sh
sesh-ops task block <task-id> --reason "awaiting OAuth2 provider credentials"
# ... later, when unblocked ...
sesh-ops task unblock <task-id>
```

Blocked tasks retain your `puller` claim, so they're not poachable.

## Surfacing partial progress

If you complete part of a task but not all of it (and not enough for `complete`), do NOT silently bail. Either:

- Fail the task with a clear `next_step` recommendation, OR
- Block the task if a re-claim later is feasible, OR
- Complete the work and file a NEW task for the remaining piece via `sesh-ops task add --goal-id="$SESH_GOAL_ID"`.

Goal-management is about long-horizon visibility; silent partial-completion defeats it.

## When the goal is approaching completion

If `sesh-ops goal get $SESH_GOAL_ID | jq '.tasks // []'` shows all tasks `completed` / `cancelled` and the goal's objective seems met:

- Do NOT submit `goal complete` yourself. That's the operator's call, AND it must go through the `goal-complete` skill's 6-step audit.
- Surface to the operator: "All linked tasks terminal; objective looks met. Ready to invoke goal-complete audit when you say."

## What NOT to do

- Do NOT claim tasks tagged to a different `goal_id`.
- Do NOT mark the goal complete yourself (use the `goal-complete` skill, and only when the operator confirms).
- Do NOT abandon, pause, or clear the goal — those are operator-only.
- Do NOT bypass the task `--result` field; downstream goal completion needs artifact references.
- Do NOT fail a task as a workaround for a blocked external dependency — use `block`/`unblock` instead.

## See also

- Spec: [`docs/task-management.md`](https://github.com/danmestas/sesh/blob/main/docs/task-management.md) — the underlying CAS pull protocol.
- Spec: [`docs/goal-management.md`](https://github.com/danmestas/sesh/blob/main/docs/goal-management.md), section "Tasks linked to a goal".
- Companion skill: `goal-complete` — for the operator-side completion audit when all linked tasks are done.
- Hook: `sesh-goal` — auto-accounts tokens against the goal's budget on every turn.
