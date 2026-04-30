---
name: finishing-a-bones-leaf
description: After a bones swarm session closes, decide what to do with the open leaf — fan-in to trunk, keep open, or abandon. Use when implementation is complete, all tests pass, and you need to integrate the work back into the bones hub trunk.
---

# Finishing a bones leaf

Your swarm session has closed (`bones swarm close --result=success`), but the leaf is still open in the hub. This skill walks you through the integration decision.

**Prerequisite**: at least one closed-success swarm session has produced commits on a leaf in the hub.

## Pre-flight: review what's about to integrate

Before any integration step:

```bash
bones swarm status                # which leaves are open?
bones repo timeline --limit 20    # recent activity on the hub
bones repo diff <trunk-rev>       # diff vs. trunk for context
```

## Three options

### Option 1: Fan-in to trunk (the merge path)

Merges open hub leaves back into trunk. **Always preview first.**

```bash
# 1. Preview — see what would be merged, no changes
bones swarm fan-in --dry-run -m "merge <leaves> to trunk"

# 2. If preview looks right, execute
bones swarm fan-in -m "merge <leaves> to trunk"
```

**On conflict** (semantics not yet empirically verified — see spec § 11 — but the defensive flow is canonical given fossil's conflict model):

If `fan-in` reports a non-zero exit code, conflicts likely exist. Enumerate and resolve:

```bash
bones repo conflicts ls
bones repo conflicts show <file>
# Choose ONE resolution strategy per conflicted file:
bones repo conflicts pick <file>           # pick one version wholesale
bones repo conflicts merge <file>          # re-merge with a different strategy
bones repo conflicts extract <file>        # extract all versions to disk for manual edit

# After resolving each file:
bones repo mark-resolved <file>

# Once all conflicts marked resolved, re-run fan-in:
bones swarm fan-in -m '<original message>'
```

### Option 2: Keep leaf open

No-op. The leaf stays open in the hub for later work. Useful when:
- Work is complete but you want trunk integration to happen later (e.g., as part of a release batch)
- You need the leaf for another swarm session (rare)

```bash
echo "leaf left open; integrate later via 'bones swarm fan-in'"
```

### Option 3: Abandon

Discard the work. Closes the swarm session as failed (releasing the claim) without fan-in. The commits remain on the leaf in the hub but are never integrated.

```bash
bones swarm close --result=fail --summary="<why abandoned>"
```

(Note: this only applies if a session is still open. If you've already cleanly closed a successful session and want to throw away the work, you'd need to manually close the leaf branch via `bones repo branch close <leaf>`.)

## Decision flow

```
Is the work done and good?
├── Yes, ready to integrate         → Option 1 (Fan-in)
├── Yes, but defer integration       → Option 2 (Keep open)
└── No, throw it away                → Option 3 (Abandon)
```

## What this skill does NOT cover (v0)

- **Pushing trunk to a git remote**: if your bones workspace is over a git-cloned repo, push manually after fan-in via `git push`. Spec § 5.8 lists this as out of scope for v0.
- **GitHub PR creation**: bones is hub-trunk, not git PR-flow. If you need a PR for human review, that's a manual workflow on top of the integrated trunk.
