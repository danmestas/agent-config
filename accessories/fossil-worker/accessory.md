---
name: fossil-worker
version: 0.1.0
type: accessory
description: Worker-side fossil discipline — use fossil commit/update, never git, in .sesh/checkouts/<label>/. Apply to any AFK worker spawned into a sesh fossil checkout so its commits land in the fossil trunk and reach peers via NATS autosync.
targets:
  - claude-code
  - codex
  - gemini
  - pi
include:
  skills: []
  rules: []
  hooks: []
  agents: []
  commands: []
---

# fossil-worker accessory

You are working in a **fossil checkout** at `.sesh/checkouts/<label>/`, not a git worktree. Your commits land in the fossil trunk that the sesh hub serves over NATS. The sesh-level operator (your parent) materializes the fossil trunk into git on mission complete — that is **not** your job.

This accessory injects worker-facing discipline for that operating context. Load it on any AFK worker spawned into a sesh fossil checkout (Slice 5 of [sesh#64](https://github.com/danmestas/sesh/issues/64) wires this in automatically via `orch-spawn ... --accessory fossil-worker`).

## Operating context

- Your working directory is `.sesh/checkouts/<label>/` inside the parent project.
- That directory is a **fossil checkout**, not a git worktree. There is no `.git/` here.
- Fossil's autosync publishes your commits over NATS (libfossil's `.commit` announce) within seconds; your peers' `fossil update` pulls them.
- The parent project at `<project>/` is a normal git worktree, but you do not touch it. Materialization (fossil trunk → git worktree) is the operator's gatekeep step at mission complete.

## Command discipline

Operations you run inside `.sesh/checkouts/<label>/`:

- `fossil add <files>` — stage.
- `fossil commit -m "<msg>"` — commit + auto-publish via NATS. Peers see your work within seconds.
- `fossil update` — pull latest from trunk. Peers' commits land here.
- `fossil status`, `fossil diff`, `fossil timeline` — inspection.

**NEVER** run any of these inside `.sesh/checkouts/<label>/`:

- `git add`, `git commit`, `git push`, `git status`, `git checkout`, `git branch`, `git log`, `git diff`, or any other `git` subcommand.

This directory is not a git repo. Running `git` here is a programming error — the parent git worktree is at `<project>/`, and materialization is the operator's job, not yours.

## Pull before non-trivial work

Before starting non-trivial work — anything beyond a single tightly-scoped edit — run `fossil update` to pull peer commits.

libfossil's autosync is event-driven (pulls on the hub's `.commit` announces), so in steady state your checkout is fresh. But a defensive `fossil update` at logical work boundaries (start of a new task, before a risky merge-adjacent edit, after returning from a long-running tool call) reduces conflict risk at near-zero cost.

## Conflict-resolution protocol

If `fossil commit` reports a merge conflict that fossil's text-merge can't auto-resolve:

1. Read the conflict markers in the affected files.
2. **Trivial-resolution case:** the two edits touched adjacent independent lines and the merge marker is just adjacency, not semantic overlap. Resolve and re-commit.
3. **Judgment-required case:** the two sides edited the same logical concept — semantic overlap, intent conflict, or any case where picking one side silently discards real work. STOP. Surface the conflict to your sesh-level operator with:
   - the file path,
   - the conflicting hunks (your side + peer side),
   - your read of what each side was trying to do,
   - a recommended resolution and your confidence.

Then wait for direction. **Do not pick autonomously when judgment is required.** A wrong autonomous pick discards a peer's work and is invisible until materialization — exactly the bug class the operator is in the loop to prevent.

## Mission-complete signal

When your task is done, tell your sesh-level operator clearly:

> implementation complete, fossil trunk has commits {X, Y, Z}.

Substitute the actual commit IDs from `fossil timeline -n 10` or the IDs `fossil commit` printed. The operator uses these to decide whether to run `sesh materialize` (Slice 3).

You do **not** run `sesh materialize` yourself. That's the operator's gatekeep step — bridging fossil trunk into the parent git worktree at mission complete. Workers who self-materialize bypass review and can ship un-audited changes to the parent project's git history.

## What you NEVER do

- `git` anything inside `.sesh/checkouts/<label>/`. Wrong tool. Wrong directory.
- `os.Remove`, `rm -rf`, or any destructive op on `.sesh/messaging/`, `.sesh/sessions/`, `.sesh/checkouts/` siblings. Those are operator territory. JetStream state in `.sesh/messaging/` is irreplaceable.
- Open PRs from inside the fossil checkout. PRs are the maintainer's gatekeep, not yours. If a PR is needed, surface it to the operator with a recommendation.
- Touch `.git/` in the parent project. Your scope ends at the fossil checkout's edge.
- Run `sesh materialize`, `sesh worktree rm`, or any sesh subcommand that mutates checkout state. Read-only sesh commands (`sesh status`, `sesh worktree ls`) are fine if you need them.

## Why this discipline exists

The fossil-as-trunk workflow ([sesh#64](https://github.com/danmestas/sesh/issues/64)) gives multiple AFK workers a shared, append-only commit log over NATS without git's merge-when-pushed friction. The cost is that workers must internalize a different command vocabulary inside their checkout dir. This accessory makes that vocabulary explicit and lists the failure modes the workflow is trying to prevent (git contamination, autonomous conflict picks, self-materialization, peer-state destruction).

## See also

- [sesh#64](https://github.com/danmestas/sesh/issues/64) — fossil-as-trunk swarm workflow tracking issue.
- [sesh `docs/synadia-agents-on-sesh.md`](https://github.com/danmestas/sesh/blob/main/docs/synadia-agents-on-sesh.md) — the larger context for fossil + NATS + agent swarms.
- `orch-spawn --accessory fossil-worker` — how this accessory reaches its consumers (Slice 5).
