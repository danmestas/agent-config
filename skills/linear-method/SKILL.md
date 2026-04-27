---
name: linear-method
version: 0.1.0
description: >-
  Use when creating, organizing, or prioritizing issues in Linear. Use when
  managing backlogs, setting up cycles, scoping projects, writing issue
  titles/descriptions, or deciding how to structure work in Linear. Also use
  when asked about Linear best practices.
type: skill
targets:
  - claude-code
category:
  primary: integrations
---

# Linear Method — Best Practices for AI Agents

## Overview

The Linear Method is an opinionated approach to project management that prioritizes momentum, clarity, and shipping over process overhead. This skill guides how to create, organize, and prioritize work in Linear following their official methodology.

## Core Principles

1. **Build for creators** — optimize for the person doing the work, not reporting
2. **Momentum over sprints** — sustainable cadence, not deadline pressure
3. **Clarity first** — use standard language; "projects" are projects
4. **Eliminate busy work** — automate or remove "work about work"
5. **Simple then powerful** — start minimal, add sophistication as needed
6. **Decide and move forward** — timely decisions beat endless deliberation

## Writing Issues (Not User Stories)

Linear explicitly rejects user stories as an anti-pattern. Write **short, concrete tasks in plain language**.

| Do | Don't |
|---|---|
| Short, scannable title | "As a user, I want to..." |
| Description is optional — only add necessary context | Mandatory multi-paragraph descriptions |
| Link to specs/designs instead of inlining | Explain the full user journey |
| Quote user feedback directly | Summarize or interpret feedback |
| Author your own issues (forces deeper thinking) | Have PMs write all issues for engineers |

**Good title:** `Verify login credentials in HandleSync`
**Bad title:** `As a developer, I want login verification so that multi-user sync is secure`

## Priority Levels

Linear has exactly 4 priorities + none. Don't over-specify — if you need more granularity, use labels or workflow statuses instead.

| Level | Value | Meaning | SLA Default |
|-------|-------|---------|-------------|
| **Urgent** | 1 | Drop everything. Assignee gets immediate notification + email | 24 hours |
| **High** | 2 | Important, do soon. Core path or blocking others | 1 week |
| **Medium** | 3 | Normal work. Should be done but not time-critical | None |
| **Low** | 4 | Nice-to-have. Do when bandwidth allows | None |
| **None** | 0 | Unprioritized / not yet assessed | None |

**Tie-breaking within priority:** Use drag-and-drop ordering in Linear views — this is a persistent global sort visible to the whole workspace. There is no numeric sub-priority field.

## Enablers vs Blockers

Before assigning priority, classify the work:

- **Blocker** — gap or friction that *prevents* users from using the product. Fix these first.
- **Enabler** — adds new capability, makes the product more valuable. Build these strategically.

Ask: Does this help move the needle *this week or month*? What compounding effects come from building it now? What complexity does it add?

## Hierarchy

```
Initiatives (company goals)
  └── Projects (time-bound deliverables, 1-3 weeks, 1-3 people)
        └── Milestones (meaningful stages within a project)
              └── Issues (concrete tasks with clear outcomes)
                    └── Sub-issues (breakdowns, can cross teams)
```

**Initiatives** — ambitious, focused goals. Curated list of projects.
**Projects** — scope to 1-3 weeks with 1-3 people. If it can't fit, break into phases.
**Milestones** — stages of completion within a project. Filter and track progress per milestone.
**Issues** — single tasks. Required: title + status. Everything else is optional.
**Sub-issues** — can be assigned to any team/member, not just the parent's.

## Cycles

Cycles are automated, repeating time-boxes (1-8 weeks). They are NOT releases.

- Unfinished issues auto-roll to next cycle
- Use cooldown periods between cycles for tech debt
- Capacity is calculated from velocity of previous 3 cycles
- Auto-add active issues to current cycle (configurable)
- Cycles are per-team; sub-teams inherit parent schedule

**When to use cycles vs projects:** Cycles are recurring cadence (like sprints). Projects are goal-oriented (ship feature X). An issue can belong to both.

## Workflows (Issue Statuses)

Default: `Backlog → Todo → In Progress → Done → Canceled`

Linear's own workflow: `Icebox | Backlog → Todo → In Progress → In Review → Ready to Merge → Done | Canceled | Could not reproduce | Won't Fix | Duplicate`

Categories (fixed order): Triage → Backlog → Unstarted → Started → Completed → Canceled

- Let integrations update status automatically (GitHub PR → In Progress → In Review → Done)
- Auto-close stale issues, auto-archive completed ones
- Triage is an optional inbox for new issues before they enter the workflow

## Labels

- Use workspace-level labels for cross-team concepts (Bug, Feature, Improvement)
- Use team-level labels for team-specific concepts
- Labels within a group are mutually exclusive (only one from each group)
- Use prefix convention for filtering: `type:bug`, `comp:sync`, `area:auth`
- Add descriptions to labels so Triage Intelligence can suggest them

## Relations and Dependencies

- **Blocks / Blocked by** — hard dependency, issue can't proceed
- **Related** — soft connection for context
- **Duplicate** — marks issue as duplicate, moves to Canceled
- **Sub-issue** — hierarchical breakdown
- **Parent** — the inverse of sub-issue

Use `blocks`/`blockedBy` to express ordering when priority alone isn't sufficient.

## Backlog Hygiene

Linear's method: **curate ruthlessly**. Important items resurface; forgotten ones rarely matter.

- Triage new issues before they enter the workflow
- Archive aggressively — auto-archive completed/canceled issues
- Don't let the backlog become a graveyard
- If an issue has been in backlog for months untouched, it's probably not important

## Project Scoping

**Target: 1-3 weeks, 1-3 people.** If it doesn't fit:

1. Break into sequential phases (each is its own project)
2. Ship MVP first, iterate based on feedback
3. Use milestones within a project for longer efforts

Benefits: forced prioritization, continuous shipping, rapid feedback loops, reduced risk.

## Quick Reference for Agents

When creating issues via MCP tools:

```
Required: title, team
Recommended: priority, project, description (brief)
Optional: labels, assignee, estimate, dueDate, milestone, cycle
Relations: blocks, blockedBy, relatedTo, parentId, duplicateOf
```

**Priority decision tree:**
1. Is production broken or users blocked? → **Urgent (1)**
2. Is it on the critical path or blocking other work? → **High (2)**
3. Is it normal planned work? → **Medium (3)**
4. Is it a nice-to-have or speculative? → **Low (4)**
5. Not yet assessed? → **None (0)**

**Deduplication:** Before creating, search existing issues. Use `duplicateOf` if found.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Everything is High/Urgent | If everything is urgent, nothing is. Reserve Urgent for production issues. |
| Verbose user-story descriptions | Write plain language. Link to specs. |
| Giant monolithic projects | Scope to 1-3 weeks. Break into phases. |
| Backlog as idea graveyard | Archive or delete stale issues regularly. |
| Using labels for what statuses do | Statuses track workflow. Labels categorize. |
| Creating issues without a team | Always specify team — it's required and determines workflow. |
| Sub-priority rankings | Linear doesn't have sub-priority. Use drag ordering or blockedBy relations. |
