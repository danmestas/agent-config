---
name: writing-plans
version: 1.0.0
targets: [claude-code]
type: skill
description: Use when you have a spec or requirements for a multi-step task in a bones workspace, before touching code — produces a bones task graph plan with slot assignments and leaf-level steps
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:** `docs/bones-powers/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default)

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use bones-powers:subagent-driven-development (recommended) or bones-powers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task Structure

````markdown
### Task N: [Component Name]  `[slot: <slot-name>]`

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
bones repo add tests/path/test.py src/path/file.py && bones repo ci -m "feat: add specific feature" tests/path/test.py src/path/file.py
```
````

### Slot annotation

Each task carries a `[slot: <name>]` tag matching the bones swarm slot that should claim it. Slots group tasks by worker type (e.g. `infra`, `frontend`, `data`). One slot per task; tasks without a natural slot use `[slot: any]`.

Slot names become `--slot=<name>` arguments when the plan is materialized into bones tasks at the end of this skill (see "## Plan → bones tasks" below).

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Remember
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Plan → bones tasks

After the plan is saved AND user-reviewed, materialize it into the bones task graph (per spec § 4.4 of `docs/superpowers/specs/2026-04-29-bones-powers-design.md`):

```bash
PLAN=docs/bones-powers/plans/<filename>.md
bones repo add "$PLAN"
bones repo ci -m "add <feature> plan" "$PLAN"

# Root task (no slot, no parent)
ROOT_ID=$(bones tasks create "<feature>" --files="$PLAN" --json | jq -r .id)
echo "Root task: $ROOT_ID"

# One child per plan task — repeat for each [slot: X] task in the plan
bones tasks create "<task-1-title>" --parent="$ROOT_ID" --slot="<slot>" --files="$PLAN"
bones tasks create "<task-2-title>" --parent="$ROOT_ID" --slot="<slot>" --files="$PLAN"
# ... (one per task in the plan)
```

Children inherit no fields automatically — be explicit. Reuse `--files="$PLAN"` on every child so `bones tasks show <id>` always surfaces the source-of-truth plan.

## Execution Handoff

After tasks are emitted, offer execution choice:

> "Plan materialized. Root task `<ROOT_ID>` with N children. Two execution modes (per spec § 5):
>
> 1. **`subagent-driven-development` (recommended for parallel work)** — dispatches a fresh implementer subagent per child task, each in its own slot/leaf via `bones swarm join`. Two-stage review between tasks.
>
> 2. **`executing-plans` (single-session inline)** — coordinator loops through `bones tasks list --parent=<ROOT_ID>`, claiming and closing each task in this session.
>
> Which mode?"

If `subagent-driven-development` chosen:
- **REQUIRED SUB-SKILL:** Use `bones-powers:subagent-driven-development`.

If `executing-plans` chosen:
- **REQUIRED SUB-SKILL:** Use `bones-powers:executing-plans`.
