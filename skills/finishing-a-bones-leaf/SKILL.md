---
name: finishing-a-bones-leaf
version: 1.0.0
targets: [claude-code]
type: skill
description: After a bones swarm session closes, decide what to do with the open leaf — fan-in to trunk, keep open, or abandon — and (optionally) materialize trunk into the git worktree, push, and open a PR for the swarmed changes. Use when implementation is complete, all tests pass, and you need to integrate the work back into the bones hub trunk.
category:
  primary: workflow
---

# Finishing a bones leaf

Your swarm session has closed (`bones swarm close --result=success`), but the leaf is still open in the hub. This skill walks you through the integration decision.

**Prerequisite**: at least one closed-success swarm session has produced commits on a leaf in the hub.

## Requirements

- A bones workspace (`.bones/repo.fossil` exists in cwd; required for all options)
- For the optional push-to-git tail (Option 1's follow-up):
  - The workspace is also a git repo (`.git/` exists at the same root)
  - `bones apply` subcommand available (bones v0.X+ — calibrate against the bones release that ships it)
  - `gh` CLI authenticated against the git remote (for `gh pr create`)
  - Standard git: clean worktree, on the default branch

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

After fan-in succeeds, the skill offers an optional follow-up to materialize the swarmed changes into your git worktree, push them, and open a PR. See "## After fan-in: push to git remote and open PR (optional)" below.

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

## After fan-in: push to git remote and open PR (optional)

After Option 1's `bones swarm fan-in` succeeds and trunk has the swarmed changes, the skill offers a follow-up:

> Push to git remote and open PR? (y/N)

Answering `y`/`Y`/`yes` (case-insensitive) runs the flow below. Anything else finishes the skill cleanly with the fan-in committed but no further side effects.

### Pre-flight git checks

| Check | Command | Failure handling |
|---|---|---|
| Workspace has `.git/` | `[[ -d .git ]]` | Skip the push tail entirely. Skill says "no git remote available; this workspace isn't bones-over-git. Done." |
| Git worktree clean | `git status --porcelain` (empty output) | Abort. Skill says "git worktree has uncommitted changes — commit or stash them first, then re-run." |
| On the default branch | `git branch --show-current` matches `origin/HEAD`'s tracked branch | Abort. Skill says "currently on `<branch>`; switch to `main` (or default) first to make a clean fan-in branch." |

### Materialize trunk into the git worktree

```bash
bones apply
```

This is the bones-side checkout-equivalent: it copies fossil-trunk's tip state onto the git working tree. After this, `git status` shows the swarmed changes as unstaged.

`bones apply` is invoked with no arguments — assumes the default behavior is "materialize trunk tip into cwd's git worktree". If the actual `bones apply` CLI requires explicit args when the bones release ships, adjust this skill's invocation.

If `bones apply` fails — likely either the subcommand isn't available (bones too old) or there's a conflict — the skill surfaces the error and aborts. Resolve manually before re-running.

### Branch name

The skill auto-suggests a branch name slugified from the root bones task's title. Slugification: lowercase, non-alphanumeric → `-`, collapse runs of `-`, trim leading/trailing `-`, truncate to 50 chars, prefix with `bones/`.

Example: root task title "Implement search feature with full-text" → `bones/implement-search-feature-with-full-text`.

If the root task title is empty or unparseable, fall back to `bones-fan-in/<YYYY-MM-DD>-<short-root-id>` where `<short-root-id>` is the first 6 chars of the root task UUID.

```
Branch name [<auto-suggested>]:
```

User presses Enter to accept the default OR types a different name.

### Commit + push

```bash
git checkout -b <branch>
git add -A
git commit -m "<auto-generated message>"
git push -u origin <branch>
```

The commit message is auto-generated from the bones task graph (no user prompt — the human-facing artifact is the PR text). Format:

```
<root task title>

Fan-in of bones swarm work. <N> tasks completed under root <short-root-id>.

- [<slot>] <child title> (<result>) — <summary>
- [<slot>] <child title> (<result>) — <summary>
...

Plan: <plan-path>
Bones root task: <root_id>
```

Where:
- `<short-root-id>` = first 6 chars of root task UUID
- `<N>` = count of children
- Each child line uses the child's title, slot tag, result (`success`/`fail`/`fork`), and summary from `bones tasks show`
- `<plan-path>` from root task's `--files` field

### Open PR

The skill prompts for the PR title and PR body, with defaults derived from the task graph.

**PR title prompt** (default = root task title):
```
PR title [<root task title>]:
```

User presses Enter to accept OR types a different title.

**PR body prompt** ($EDITOR-based, default pre-filled):

The skill writes the default body to a temp file and opens `$EDITOR` (falls back to `vi` if unset). User edits, saves, and exits.

Default PR body template:

```markdown
## Summary

<one-line summary; falls back to "Fan-in of <N> bones tasks" if no shorter summary derivable from root task title>

## Tasks completed

- [<slot>] <child title> (<result>) — <summary>
- [<slot>] <child title> (<result>) — <summary>
...

## Plan

`<plan-path>`

## Bones lineage

- Root task: `<root_id>`
- Children: `<child_id_1>`, `<child_id_2>`, ...
```

If any child task closed with `--result=fail` or `--result=fork`, the skill prepends a `> ⚠ <N> task(s) closed as failed:` callout listing them — visual emphasis on top of the inline `(<result>)` markers in the bullets.

After both prompts:

```bash
gh pr create --title "<…>" --body "<…>"
```

### Idempotency / re-run

If a previous run pushed the branch but `gh pr create` failed (e.g., auth issue), re-running `finishing-a-bones-leaf` after fixing the issue detects the already-pushed branch:

- Detection: `git rev-parse --verify <branch>` succeeds AND `git log origin/<branch>..HEAD` is empty (local matches remote).
- Skill behavior: skips re-creating branch, re-staging, re-committing, re-pushing. Goes directly to the PR-prompt step.

This lets the user fix `gh auth login` (or whatever blocked the PR) and re-run without redoing the upstream work.

### Cancellation

| Input point | Cancel signal | Skill behavior |
|---|---|---|
| Initial Y/N prompt | Anything other than `y`/`Y`/`yes` | Treated as no. Skill exits cleanly; fan-in stays committed. |
| Branch name override prompt | Empty input + Enter | Accept the auto-suggested default. |
| PR title prompt | Empty input + Enter | Accept the default (root task title). |
| PR body `$EDITOR` session | Save with empty body | Abort PR creation. Branch stays pushed. Skill says "PR body was empty — branch is pushed; re-run to retry, or open the PR manually at `<remote-url>/compare/<branch>`." |
| Ctrl+C / SIGINT mid-flow | OS-level interrupt | Skill exits with non-zero. No automatic cleanup of partial state. User can `git status` to see where things stopped, then either continue manually or re-run (idempotency picks up). |

### Failure modes

| Step | Failure mode | Skill action |
|---|---|---|
| `bones apply` | Subcommand missing (older bones) | Error: "this skill requires `bones apply`. Update bones to the version that ships it." |
| `bones apply` | Conflicts during materialize | Surface bones's error verbatim. Skill aborts; user resolves manually and re-runs. |
| `git add -A` shows no changes | Apply produced an empty diff (no-op) | Skill says "no changes to push. Done." Cleans up the empty branch via `git checkout - && git branch -D <branch>`. |
| `git push` | Auth / network / branch-protection error | Surface git's error. Skill aborts. User fixes and re-runs (idempotency kicks in). |
| `gh pr create` | No `gh` auth, no remote configured, etc. | Surface `gh`'s error. Skill notes: "branch is pushed; open the PR manually at `<remote-url>/compare/<branch>`." |

## Decision flow

```
Is the work done and good?
├── Yes, ready to integrate         → Option 1 (Fan-in)
│                                      │
│                                      └── (after success) Push to git remote and open PR? → see "## After fan-in" section
├── Yes, but defer integration       → Option 2 (Keep open)
└── No, throw it away                → Option 3 (Abandon)
```

## What this skill does NOT cover

- **Auto-stash of uncommitted git changes**: skill aborts if the worktree is dirty rather than stashing. User owns their git state.
- **Automatic remote configuration / fork management**: skill assumes `origin` is configured and points at the right place. `git remote add` setup is out of scope.
- **`--force` push for protected branches**: skill does a normal `git push -u origin <branch>`. If the branch is rejected (protected, requires signed commits, etc.), the failure surfaces verbatim and the user resolves.
- **Cross-repo PRs (forks)**: PR opens against the configured `origin` remote only. Pushing to a fork and PR'ing against an upstream is manual.
