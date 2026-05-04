---
name: using-bones-swarm
version: 1.0.0
targets: [claude-code]
type: skill
description: Open, work in, and close a bones swarm session — the slot-shaped lane that bundles a worktree, a claimed task, and an open hub branch. Use when starting feature work that needs isolation from current workspace, before executing implementation plans, or when you need a worktree for parallel work in a bones workspace.
category:
  primary: workflow
  secondary: [context-management]
---

# Using bones swarm

`bones swarm` is the slot-scoped session primitive. One swarm session = one leaf = one worktree + one claimed task + one open hub branch. This skill walks you through the 5-step lifecycle.

**Prerequisite**: a bones workspace (`.bones/repo.fossil` exists in cwd or a parent). If missing, run `bones up` first.

## The lifecycle

```
1. swarm join    →  open a leaf, claim a task, prepare a worktree (atomic)
2. swarm cwd     →  navigate to the worktree
3. work          →  edit files; make changes
4. swarm commit  →  heartbeat the session + commit (repeat as needed)
5. swarm close   →  release claim, post result, stop the leaf
```

## Step 1: Join

```bash
bones swarm join --slot=<slot-name> --task-id=<task-id>
```

What this does (atomically):
- Opens a new leaf in the hub for the given slot.
- Claims the named task in `bones tasks` (fails if already claimed or closed).
- Prepares a worktree on disk for that leaf.
- Registers the swarm session so `swarm status` and `swarm cwd` can find it.

**Recovery**: if a previous swarm session is stuck (crashed agent, stale lock):
```bash
bones swarm join --slot=<slot> --task-id=<id> --force
```
This clobbers the existing slot session. Use only when you're sure nothing else is using that slot.

## Step 2: Navigate

```bash
cd "$(bones swarm cwd --slot=<slot-name>)"
```

Or capture the path once:
```bash
WORKTREE=$(bones swarm cwd --slot=<slot-name>)
cd "$WORKTREE"
```

## Step 3: Work

Edit files. The worktree is a normal filesystem checkout — your editor and tools work as usual.

If you need to verify the workspace is clean:
```bash
bones repo status
```

## Step 4: Commit and heartbeat

Every meaningful save during the session:

```bash
bones swarm commit -m "<message>" [files...]
```

This commits and emits a heartbeat. The hub knows the session is alive. Repeat as often as you'd commit normally.

If you only want to commit (not heartbeat — rare), use `bones repo ci -m "…" <files>` directly. Prefer `swarm commit` while inside a session.

## Step 5: Close

When work is done:

```bash
bones swarm close --result=success --summary="<one-line result>"
```

This releases the claim, posts the result to the task's thread, and stops the leaf. The leaf remains in the hub (open for fan-in).

If the work is incomplete or failed:
```bash
bones swarm close --result=fail --summary="<reason>"
```

Releases the claim so another worker (or another attempt) can pick the task back up.

## Composition

This skill is a primitive used by other bones-powers skills:
- `bones-powers:executing-plans` (single-session inline) — invokes the lifecycle once per task.
- `bones-powers:subagent-driven-development` — invokes the lifecycle per implementer subagent (one per slot, in parallel).
- `bones-powers:dispatching-parallel-agents` — N concurrent invocations across N slots.
- `bones-powers:finishing-a-bones-leaf` — what happens AFTER `swarm close`: fan-in, keep, or abandon.

## Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| `swarm join` errors "slot busy" | Previous session not cleanly closed | `swarm join --force` (recovery) or `swarm close` the stale session first |
| `swarm cwd` returns nothing | No active session for that slot | Run `bones swarm status` to see what's open |
| Heartbeat stops being sent | Agent crashed mid-task | The hub will eventually time the leaf out; recover with `--force` |
| `swarm close` errors "no active session" | Already closed, or never joined | `bones swarm status` to confirm |
