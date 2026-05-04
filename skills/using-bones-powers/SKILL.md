---
name: using-bones-powers
version: 1.0.0
targets: [claude-code]
type: skill
description: Use when starting any conversation in a bones workspace - establishes how to find and use bones-powers skills, requiring Skill tool invocation before ANY response including clarifying questions
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## Instruction Priority

bones-powers skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (CLAUDE.md, direct requests) — highest priority
2. **bones-powers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

If CLAUDE.md says "don't use TDD" and a skill says "always use TDD," follow the user's instructions. The user is in control.

## How to Access Skills

**In Claude Code:** Use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you—follow it directly. Never use the Read tool on skill files.

**In other environments:** Check your platform's documentation for how skills are loaded.

## Bones primitives

bones-powers skills assume you understand these concepts. If any are unfamiliar, run `bones --help` and `bones <subcommand> --help`.

| Term | Meaning |
|---|---|
| **workspace** | A directory bootstrapped by `bones up`. Marker: `.bones/repo.fossil`. |
| **hub** | The Fossil repo at the center of the workspace. Holds trunk and all leaves. |
| **trunk** | The mainline branch in the hub. Equivalent to git's `main`. |
| **slot** | A named worker role (e.g. `alpha`, `frontend`, `infra`). Tasks are routed by slot. |
| **leaf** | A slot's working session — a worktree + claimed task + open hub branch. Created by `bones swarm join`. |
| **swarm session** | The lifecycle of one slot's leaf, from `swarm join` to `swarm close`. |
| **fan-in** | `bones swarm fan-in` — merge open hub leaves back into trunk. |
| **task** | A unit of work in `bones tasks`. Has `id`, `slot`, `parent`, `files`, `status` (pending/claimed/closed), `result` (success/fail/fork). |
| **task graph** | Per spec § 4.4: one root task per plan, one child task per plan step, all sharing `--files=<plan-path>`. |

| Tool you'd reach for | bones equivalent |
|---|---|
| `git worktree add` | `bones swarm join --slot=X --task-id=Y` |
| `git commit` | `bones repo ci -m '…'` (free-form) or `bones swarm commit -m '…'` (heartbeats the active slot) |
| `git merge`, "open a PR" | `bones swarm fan-in -m '…'` (preview with `--dry-run` first) |
| TodoWrite (for plan tracking) | `bones tasks create/list/claim/close` |
| TodoWrite (for in-session steps) | TodoWrite (still — see hybrid task model in § 6 of the spec) |

## Cross-harness tool names

bones-powers skill content uses Claude Code tool names (TodoWrite, Skill, Read, Edit, Write, Bash, Glob, Grep, Agent/Task). On non-Claude-Code harnesses, see the per-harness mapping in `references/`:

- Codex: `references/codex-tools.md`
- Gemini: `references/gemini-tools.md`
- Copilot CLI: `references/copilot-tools.md`
- Pi: `references/pi-tools.md`

When you encounter a Claude Code tool name in a bones-powers skill running on another harness, translate using the relevant mapping. The agent reads this meta-skill at session start (via the gated SessionStart hook), so the mapping is implicit context for all downstream skill reads.

apm is intentionally not listed — apm is an intermediate package format whose downstream consumers (codex, gemini, etc.) bring their own tool naming. If you're authoring an apm-published variant, refer to the consumer harness's mapping.

# Using Skills

## The Rule

**Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply means that you should invoke the skill to check. If an invoked skill turns out to be wrong for the situation, you don't need to use it.

```dot
digraph skill_flow {
    "User message received" [shape=doublecircle];
    "About to EnterPlanMode?" [shape=doublecircle];
    "Already brainstormed?" [shape=diamond];
    "Invoke brainstorming skill" [shape=box];
    "Might any skill apply?" [shape=diamond];
    "Invoke Skill tool" [shape=box];
    "Announce: 'Using [skill] to [purpose]'" [shape=box];
    "Has checklist?" [shape=diamond];
    "Create TodoWrite todo per item" [shape=box];
    "Follow skill exactly" [shape=box];
    "Respond (including clarifications)" [shape=doublecircle];

    "About to EnterPlanMode?" -> "Already brainstormed?";
    "Already brainstormed?" -> "Invoke brainstorming skill" [label="no"];
    "Already brainstormed?" -> "Might any skill apply?" [label="yes"];
    "Invoke brainstorming skill" -> "Might any skill apply?";

    "User message received" -> "Might any skill apply?";
    "Might any skill apply?" -> "Invoke Skill tool" [label="yes, even 1%"];
    "Might any skill apply?" -> "Respond (including clarifications)" [label="definitely not"];
    "Invoke Skill tool" -> "Announce: 'Using [skill] to [purpose]'";
    "Announce: 'Using [skill] to [purpose]'" -> "Has checklist?";
    "Has checklist?" -> "Create TodoWrite todo per item" [label="yes"];
    "Has checklist?" -> "Follow skill exactly" [label="no"];
    "Create TodoWrite todo per item" -> "Follow skill exactly";
}
```

## Red Flags

These thoughts mean STOP—you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ≠ using the skill. Invoke it. |

## Skill Priority

When multiple skills could apply, use this order:

1. **Process skills first** (brainstorming, debugging) - these determine HOW to approach the task
2. **Implementation skills second** (frontend-design, mcp-builder) - these guide execution

"Let's build X" → brainstorming first, then implementation skills.
"Fix this bug" → debugging first, then domain-specific skills.

## Skill Types

**Rigid** (TDD, debugging): Follow exactly. Don't adapt away discipline.

**Flexible** (patterns): Adapt principles to context.

The skill itself tells you which.

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.
