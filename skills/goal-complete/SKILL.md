---
name: goal-complete
version: 0.1.0
targets: [claude-code]
type: skill
description: Use when you (the model pursuing a long-horizon goal stored in sesh's substrate) believe the objective has been achieved and want to mark the goal as `achieved`. Walks you through a mandatory completion audit BEFORE submitting `update_goal(complete)`. ONLY invoke when you are genuinely ready to claim completion — not as a routine status check. Triggers when you say "I think we're done", "this looks complete", "objective met", or when you are about to call sesh-ops goal complete.
category:
  primary: workflow
  secondary: [integrations, backpressure]
---

# Goal completion audit

You are a model pursuing a long-horizon goal under sesh's goal-management contract. The substrate's asymmetric tool surface allows you to call ONE transition: `update_goal(status=complete)`, which flips the goal record to `achieved`. The substrate does NOT verify that completion was warranted — this skill IS the verification layer.

**Before you submit `goal complete`, you MUST perform the audit below. If any step fails, do not submit completion. Continue working instead, or surface to the operator.**

## The audit (run every step)

### 1. Re-read the objective

```sh
sesh-ops --scope "$SESH_GOAL_SCOPE" --scope-id "$SESH_GOAL_SCOPE_ID" \
  goal get "$SESH_GOAL_ID"
```

Read the `objective` field VERBATIM. Do not paraphrase. Hold it in mind through the next steps.

### 2. Enumerate concrete evidence

For each clause / requirement in the objective, list the SPECIFIC artifact that satisfies it: a commit SHA, a file path, a test run output, a PR URL, a finding-task ID, etc. If a clause has no concrete artifact, the goal is NOT complete. Either:
- Produce the missing artifact, then re-audit, OR
- Surface to the operator that the objective is partially met and ask whether to mark `unmet` with a reason

### 3. Inspect linked tasks

```sh
sesh-ops --scope "$SESH_GOAL_SCOPE" --scope-id "$SESH_GOAL_SCOPE_ID" \
  goal get "$SESH_GOAL_ID" | jq '.tasks // []'
```

For every task ID in `goal.tasks[]`:
- Status must be `completed`, `cancelled`, or terminal in some way.
- **Exception for finding-style audit goals**: if the goal's objective is "produce N findings as tasks," the tasks ARE the deliverable — they remain `pending` because they are downstream-fix work, not work-to-complete-the-audit. State this explicitly in the result payload's `notes` field.
- Otherwise: if any task is `pending` or `in_progress`, the goal is NOT complete unless that task is no longer relevant. If irrelevant, run `goal unlink-task` or `goal cleanup-tasks` BEFORE completion.

### 4. Inspect sub-goals if hierarchical

If the goal has `subgoals[]` populated, recursively audit each. A parent goal can be `achieved` even when some children are `unmet` or `budget_limited` — but you must explicitly note the partial-pursuit in the result payload.

### 5. Budget check

If `used_tokens >= token_budget * 0.9`, the work likely strained the budget. Mention this in the result payload — it's a signal for the operator that next time the budget should be larger.

### 6. Compose the result payload

The `update_goal(complete)` call accepts a JSON `result` object. Populate it richly:

```json
{
  "output": "Brief 1-2 sentence summary of what was achieved",
  "artifacts": [
    {"type": "commit", "id": "abc123", "description": "..."},
    {"type": "task", "id": "01HXX...", "description": "..."},
    {"type": "file", "path": "docs/finding-report.md", "description": "..."}
  ],
  "partial": false,
  "notes": "Optional: anything the operator should know (e.g., 'tasks remain pending as deliverables for downstream fixes')"
}
```

If you cannot produce at least ONE artifact reference, do NOT submit completion.

## Submit completion

Only after all six audit steps pass:

```sh
sesh-ops --scope "$SESH_GOAL_SCOPE" --scope-id "$SESH_GOAL_SCOPE_ID" \
  goal complete "$SESH_GOAL_ID" --result "$(cat result.json)"
```

After submission, verify the state flipped:

```sh
sesh-ops --scope "$SESH_GOAL_SCOPE" --scope-id "$SESH_GOAL_SCOPE_ID" \
  goal status "$SESH_GOAL_ID"
```

The status should now read `achieved`. Tell the operator the goal is closed, list the artifacts produced, and note any partial-pursuit caveats.

## When NOT to use this skill

- Mid-pursuit status checks → just call `sesh-ops goal status <id>`.
- Operator-requested pause → operator runs `sesh-ops goal pause` directly; this skill is model-side completion only.
- Abandoning a goal that's no longer relevant → operator runs `sesh-ops goal abandon --reason="..."`. The model should NEVER abandon its own goal; surface to the operator if the goal seems wrong.
- Pulling and completing INDIVIDUAL tasks linked to the goal → use the `working-with-sesh-tasks` skill instead. This skill is about closing the GOAL itself.

## The contract you are enforcing

The spec's "Asymmetric tool surface" section names this exact pattern: the model can only call `update_goal(status=complete)`; all other transitions are operator/runtime. The substrate does not enforce; this skill IS the harness-side enforcement. Skipping the audit defeats the entire goal-management contract.

## See also

- Spec: [`docs/goal-management.md`](https://github.com/danmestas/sesh/blob/main/docs/goal-management.md) — section "Asymmetric tool surface".
- Companion skill: `working-with-sesh-tasks` — for participating in a goal's task queue.
- Hook: `sesh-goal` — auto-accounts tokens and injects context.
