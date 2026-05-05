---
name: takeoff
version: 1.0.0
targets: [claude-code]
type: skill
description: Beginning-of-session inventory and orientation. Surfaces stale worktrees, behind-origin state, recent specs/plans, open PRs, and recent memory entries to help the agent re-orient. Use when starting a new session, asking "where were we", running a takeoff check, beginning work, or wanting a situational report before diving in. Read-only — pure inventory + recommendations, no automatic actions.
category:
  primary: workflow
---

# Takeoff

Pre-flight check. Inventory the state of the repo and recent context, then suggest where to start. Read-only — surfaces information; user picks each next action.

## When to use

- Starting a new session ("let's get going", "where were we", "begin work")
- Returning to a project after time away
- Wanting a situational report before deciding what to work on
- Checking for stale state from a prior crashed session

## Workflow

### 1. Inventory

Run this batch and present results to the user as a single situational report:

```bash
echo '---branch + status---'
git branch --show-current
git status --porcelain | head -20
echo '---active worktrees---'
git worktree list
echo '---commits ahead/behind origin/main---'
git fetch origin main 2>/dev/null
git rev-list --left-right --count HEAD...origin/main 2>/dev/null | awk '{print "ahead:", $1, "behind:", $2}'
echo '---recent commits---'
git log --oneline -10
echo '---open PRs by user---'
gh pr list --author @me --state open --json number,title,headRefName 2>/dev/null \
  | jq -r '.[] | "#\(.number) \(.headRefName): \(.title)"' | head -10
echo '---recent specs (last 7 days)---'
find docs/superpowers/specs docs/superpowers/plans -mtime -7 -name '*.md' -type f 2>/dev/null | head -10
echo '---npm install needed?---'
if [ -f package-lock.json ] && [ ! -d node_modules ]; then
  echo 'YES — node_modules missing'
elif [ -f package-lock.json ] && [ "package-lock.json" -nt "node_modules/.package-lock.json" ] 2>/dev/null; then
  echo 'YES — lockfile newer than installed'
else
  echo 'no'
fi
echo '---memory entries (last 7 days)---'
MEMDIR=$(find ~/.claude/projects -maxdepth 2 -name "memory" -type d -path "*$(basename "$(pwd)")*" 2>/dev/null | head -1)
[ -n "$MEMDIR" ] && find "$MEMDIR" -name '*.md' -mtime -7 -type f 2>/dev/null | grep -v MEMORY.md | head -10 || echo "(no project memory dir)"
```

### 2. Situational report

Format the inventory as a concise report. Example shape:

> **Where we are:**
> - Branch: `<branch>` (clean / N modified files / etc.)
> - Worktrees: N active (`<list>`)
> - vs. origin/main: <ahead/behind>
> - Recent: 3 commits in last day, 2 specs touched, 1 open PR
> - Memory: 5 entries in last 7 days
>
> **Suggestions:**
> - Stale worktree at `<path>` from prior session — resume `<branch>` or invoke `landing`?
> - Behind origin/main by N — run `git pull --ff-only`?
> - npm install needed — run it now?
> - Recent unfinished plan: `<plan-path>` — resume?
> - Open PR #N — check status with `gh pr checks <N>`?

If nothing is in flight (clean tree, no recent activity, no open PRs), end with:
> What's the goal for this session?

### 3. No automatic actions

`takeoff` is read-only. The agent presents the report and waits for the user to pick the next action. Don't run `git pull`, `npm install`, etc. without explicit user confirmation — even if the inventory says "needed".

## Composition with other skills

- Stale worktree detected → suggest `flight-deck:landing` for cleanup
- Recent unfinished plan in `docs/superpowers/plans/` → suggest `superpowers:executing-plans` or `superpowers:subagent-driven-development`
- No goal yet → suggest `superpowers:brainstorming` if the user wants to design something new

## Safety rules

- **Never** mutate state during inventory. No `git pull`, `npm install`, branch deletion, worktree creation.
- **Never** assume the user wants to resume the most recent thing — always ask.
- If `gh` isn't authenticated or `git fetch` fails, surface the error and continue with reduced inventory.

## Tone

Terse. Be a useful copilot during pre-flight: surface what matters, don't narrate everything found.
