---
name: linear-cli
version: 1.0.0
type: skill
description: >-
  Use when manipulating Linear issues from the CLI — creating, updating,
  listing, transitioning, commenting via `acli linear` or the Linear MCP.
  Triggers: 'create linear issue', 'update issue status', 'list my issues',
  'transition to in-progress', 'add comment to LIN-X', '/linear', 'lin issue'.
targets:
  - claude-code
  - codex
  - gemini
  - copilot
  - pi
category:
  primary: integrations
  secondary:
    - tooling
---

# linear-cli: Manipulating Linear Issues from the CLI

Two backends do the same job: the **Linear MCP** (`mcp__linear__*` tools) and the **`acli linear`** shell command. Prefer MCP when loaded — it has richer schema awareness, doesn't shell out, and surfaces issue / project / cycle structure as typed inputs. Fall back to `acli linear` when the MCP isn't available.

This skill is the mechanical surface. For judgment about _when_ to create issues, _what_ makes a good title, _how_ to scope a cycle — see the separate `linear-method` skill. They pair.

## Issue ID convention

Linear IDs are `<TEAM>-<NUMBER>`: `INF-42`, `ENG-901`, `LIN-7`. The team prefix is set per-team in Linear settings; ask the user (or read prior issue refs in the repo) if unsure.

## MCP-loaded path (preferred)

When the Linear MCP is loaded, the tools surface as `mcp__linear__*` — exact names depend on the server build, but typical surface:

- Create issue (title, description, team, priority, labels, assignee)
- Update issue (status, assignee, priority, labels)
- List issues (filtered by team, assignee, status, cycle)
- Comment on issue
- Get issue (full detail including comments)

Use these directly. They take typed inputs and avoid the parsing fragility of shelling out.

## CLI fallback (`acli linear`)

When the MCP isn't loaded, fall back to Atlassian's `acli`:

```bash
# Create an issue
acli linear issue create --team INF --title "Fix X" --description "..." --priority 2

# List issues assigned to me
acli linear issue list --my

# List by team and status
acli linear issue list --team INF --status "In Progress"

# Update status
acli linear issue update INF-42 --status="In Progress"

# Update assignee
acli linear issue update INF-42 --assignee=<user>

# Add a comment
acli linear issue comment INF-42 "Status update: blocked on X"

# Get full issue detail
acli linear issue view INF-42
```

Status values are workspace-specific (typically `Backlog`, `Todo`, `In Progress`, `In Review`, `Done`, `Cancelled`); pass the exact label as it appears in Linear.

## Common patterns

- **Transitioning to in-progress when starting work**: `acli linear issue update <ID> --status="In Progress"` (or the MCP equivalent). Do this _when you actually start_, not when you triage.
- **Comment with PR link on open**: `acli linear issue comment <ID> "Opened: <PR URL>"`. Linear auto-links GitHub PRs when the issue ID is in the PR title or body, but an explicit comment makes the timeline more readable.
- **Filing from a triage conversation**: gather title + description + labels in one pass; don't iteratively edit unless the user asks.

## What this skill is not

- Not a project-management methodology — see `linear-method`.
- Not a substitute for the Linear UI when the user wants to see their board. Use it for hands-on issue manipulation, not for surfacing a dashboard.
