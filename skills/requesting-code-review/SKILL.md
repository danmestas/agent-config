---
name: requesting-code-review
type: skill
description: Use when completing tasks, implementing major features, or before fan-in to verify work meets requirements in a bones workspace
---

# Requesting Code Review

Dispatch bones-powers:code-reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

**Core principle:** Review early, review often.

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

**1. Get fossil revs:**
```bash
# Show recent timeline to find rev UUIDs
bones repo timeline --limit 10

# Diff current work vs tip (trunk's latest committed state)
bones repo diff

# Diff current work vs a specific rev
bones repo diff <BASE_REV>
```

**2. Dispatch code-reviewer subagent:**

Use Task tool with bones-powers:code-reviewer type, fill template at `code-reviewer.md`

**Placeholders:**
- `{WHAT_WAS_IMPLEMENTED}` - What you just built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_REV}` - Starting fossil rev (UUID prefix, tag, or `trunk`/`tip`)
- `{HEAD_REV}` - Ending fossil rev (or omit to mean current working state)
- `{DESCRIPTION}` - Brief summary

**3. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Reviewer dispatch in bones

**Reviewer dispatch in bones**: the reviewer subagent runs in a sibling slot (e.g., `slot=spec-review` or `slot=code-review`), separate from the implementer's slot. If the reviewer only reads (no commits expected), it doesn't need its own `swarm join` — it can read the implementer's leaf via `bones swarm cwd --slot=<implementer-slot>`. If the reviewer might write fixes, open its own slot session via `bones swarm join --slot=<reviewer-slot> --task-id=<task>`.

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

bones repo timeline --limit 10
# → identifies base rev as a7981ec (after Task 1)

bones repo diff a7981ec
# → shows all changes since that rev

[Dispatch bones-powers:code-reviewer subagent]
  WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
  PLAN_OR_REQUIREMENTS: Task 2 from docs/plans/deployment-plan.md
  BASE_REV: a7981ec
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## Integration with Workflows

**Subagent-Driven Development:**
- Review after EACH task
- Catch issues before they compound
- Fix before moving to next task

**Executing Plans:**
- Review after each batch (3 tasks)
- Get feedback, apply, continue

**Ad-Hoc Development:**
- Review before merge
- Review when stuck

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: requesting-code-review/code-reviewer.md
