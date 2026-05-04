---
name: executing-plans
type: skill
description: Execute a plan task-by-task in a single session inside a bones workspace. Coordinator enumerates tasks via bones tasks list, claims one at a time, and closes with --reason on completion. Use when running a plan inline (single agent, single session); use subagent-driven-development instead for parallel slot work.
---

> **Execution mode**: this skill is for **single-session inline execution** — one agent runs the whole plan in one session. For parallel slot sessions, use `bones-powers:subagent-driven-development` instead. (Per spec § 5 boundary.)

# Executing Plans

## Overview

Load plan, review critically, execute all tasks, report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Tell your human partner that bones-powers works much better with access to subagents. The quality of its work will be significantly higher if run on a platform with subagent support (such as Claude Code or Codex). If subagents are available, use bones-powers:subagent-driven-development instead of this skill.

## Source of truth: the bones task graph

The plan was materialized into bones tasks by `writing-plans` (per spec § 4.4). The coordinator's source of truth is **NOT** TodoWrite — it is `bones tasks list --parent=<root_id>`.

```bash
ROOT_ID=<paste from writing-plans output>
bones tasks list --parent="$ROOT_ID" --json | jq '.[] | {id, title, slot, status}'
```

Loop through pending tasks; for each:

```bash
TASK_ID=<id from list>
bones tasks claim "$TASK_ID"

# (do the work — see hybrid task model § 6: TodoWrite the in-task micro-steps here)

bones tasks close "$TASK_ID" --reason="<short result note>"
```

Heartbeat during long work via `bones swarm commit -m '…'`.

**Hybrid task model**: per spec § 6, the coordinator keeps NO TodoWrite of its own. TodoWrite is the worker's tool, used only for micro-steps inside one currently-claimed bones task; it is discarded when the bones task closes.

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Enumerate tasks from `bones tasks list` and proceed

### Step 2: Execute Tasks

For each task from `bones tasks list --parent="$ROOT_ID"`:
1. Claim via `bones tasks claim "$TASK_ID"`
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Close via `bones tasks close "$TASK_ID" --reason="<result>"`

### Step 3: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-bones-leaf skill to complete this work."
- **REQUIRED SUB-SKILL:** Use bones-powers:finishing-a-bones-leaf
- Follow that skill to verify tests, present options, execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **bones-powers:using-bones-powers** - REQUIRED: Set up isolated workspace before starting
- **bones-powers:writing-plans** - Creates the plan this skill executes
- **bones-powers:finishing-a-bones-leaf** - Complete development after all tasks
