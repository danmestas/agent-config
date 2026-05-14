---
name: executing-plans
version: 1.1.0
targets: [claude-code]
type: skill
description: Execute a plan task-by-task in a single session. The coordinator enumerates tasks from the plan, claims one at a time, and marks each complete on finish. Use when running a plan inline (single agent, single session); use subagent-driven-development instead for parallel agent work.
category:
  primary: workflow
  secondary: [context-management]
---

# Executing Plans

## Overview

Load plan, review critically, execute all tasks, report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Tell your human partner that Superpowers works much better with access to subagents. The quality of its work will be significantly higher if run on a platform with subagent support (such as Claude Code or Codex). If subagents are available, use superpowers:subagent-driven-development instead of this skill.

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create TodoWrite and proceed

### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Step 3: Wrap Up the Work

After all tasks complete and verified:
- Verify the full test suite is green and the implementation matches the plan
- Run any wrap-up steps the plan specifies
- Hand control back to your human partner with a summary of what shipped

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
- Never start implementation on the shared mainline without explicit user consent

## Integration

**Required workflow skills:**
- **superpowers:writing-plans** - Creates the plan this skill executes
