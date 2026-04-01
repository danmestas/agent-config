# Superpowers Architecture: Complete Visual Guide

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Skill Invocation Flow](#2-skill-invocation-flow)
3. [Complete Development Workflow](#3-complete-development-workflow)
4. [Subagent-Driven Development](#4-subagent-driven-development)
5. [Hook System Architecture](#5-hook-system-architecture)
6. [Integration Architecture](#6-integration-architecture)
7. [File Organization](#7-file-organization)
8. [Key Principles](#8-key-principles)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPERPOWERS SYSTEM                            │
│                  Workflow Library for Coding Agents                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
          ┌─────────▼─────────┐ ┌──▼───────┐ ┌────▼──────┐
          │   15 Core Skills  │ │  Hooks   │ │  Agents   │
          │  (Workflows)      │ │ (Init)   │ │ (Personas)│
          └─────────┬─────────┘ └──┬───────┘ └────┬──────┘
                    │               │               │
    ┌───────────────┼───────────────┼───────────────┼─────────────┐
    │               │               │               │             │
┌───▼───┐   ┌───────▼────┐   ┌─────▼──┐   ┌────────▼───┐   ┌────▼─────┐
│Design │   │Development │   │Testing │   │ Review &   │   │  Meta    │
│Skills │   │  Skills    │   │Skills  │   │Collaboration│   │ Skills   │
└───────┘   └────────────┘   └────────┘   └────────────┘   └──────────┘
    │             │               │               │              │
    ├─brainstorm  ├─worktrees    ├─TDD           ├─request-    ├─using-
    │             │               │               │  review     │  superpowers
    └─writing-    ├─subagent-    ├─systematic-   │             │
      plans       │  driven       │  debugging    ├─receiving-  └─writing-
                  │               │               │  review       skills
                  ├─executing-    └─verification- │
                  │  plans          before-       └─finishing-
                  │                 completion       branch
                  └─dispatching-
                    parallel
```

---

## 2. Skill Invocation Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SESSION START (Every conversation)                 │
└──────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │  SessionStart Hook     │
                    │  Executes bash script  │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────────────────────────┐
                    │  Load using-superpowers/SKILL.md          │
                    │  Inject into system prompt                 │
                    │  "You have superpowers"                    │
                    └───────────┬────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────┐
│                         USER MESSAGE RECEIVED                          │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │ "Might any skill       │
                    │  apply?" (even 1%)     │
                    └───────┬────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
            YES │                       │ DEFINITELY NOT
                │                       │
    ┌───────────▼────────────┐         │
    │  Invoke Skill tool     │         │
    │  with skill name       │         │
    └───────────┬────────────┘         │
                │                       │
    ┌───────────▼────────────────────┐ │
    │  Load /skills/<name>/SKILL.md  │ │
    └───────────┬────────────────────┘ │
                │                       │
    ┌───────────▼────────────────────┐ │
    │  Agent reads full content      │ │
    └───────────┬────────────────────┘ │
                │                       │
    ┌───────────▼────────────────────┐ │
    │  Announce: "Using [skill]      │ │
    │   to [purpose]"                │ │
    └───────────┬────────────────────┘ │
                │                       │
    ┌───────────▼────────────────────┐ │
    │  Follow skill exactly          │ │
    │  (rigid) or adapt (flexible)   │ │
    └───────────┬────────────────────┘ │
                │                       │
    ┌───────────▼────────────────────┐ │
    │  Skill completes,              │ │
    │  return to conversation        │ │
    └────────────────────────────────┘ │
                │                       │
                └───────────┬───────────┘
                            │
                ┌───────────▼────────────┐
                │  Respond to user       │
                └────────────────────────┘


RED FLAGS (Rationalizing away skill usage):
┌──────────────────────────────────────────────────────────────┐
│ ❌ "This is just a simple question"                          │
│ ❌ "I need more context first"                               │
│ ❌ "Let me explore the codebase first"                       │
│ ❌ "This doesn't need a formal skill"                        │
│ ❌ "I remember this skill, don't need to read it"            │
│ ❌ "The skill is overkill"                                   │
│ ❌ "I'll just do this one thing first"                       │
│                                                              │
│ ✅ CORRECT: Check for skills BEFORE any action or response  │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Complete Development Workflow

```
┌────────────────────────────────────────────────────────────────────┐
│                   USER: "Let's build feature X"                     │
└────────────────────────┬───────────────────────────────────────────┘
                         │
                         │ MANDATORY (no coding without this)
                         │
         ┌───────────────▼───────────────┐
         │  SKILL: brainstorming         │
         │  ─────────────────────        │
         │  • Explore project context    │
         │  • Ask questions one at time  │
         │  • Propose 2-3 approaches     │
         │  • Present design in sections │
         │  • Get approval per section   │
         │  • Write spec document        │
         │    docs/superpowers/specs/    │
         │    YYYY-MM-DD-<topic>.md      │
         │  • Self-review spec           │
         └───────────────┬───────────────┘
                         │
                         │ User approves spec
                         │
         ┌───────────────▼───────────────┐
         │  SKILL: writing-plans         │
         │  ─────────────────────        │
         │  • Map file structure         │
         │  • Break into 2-5 min tasks   │
         │  • Each task has:             │
         │    - Exact file paths         │
         │    - Complete code            │
         │    - Exact commands           │
         │    - Expected output          │
         │  • Self-review plan           │
         │  • Save to:                   │
         │    docs/superpowers/plans/    │
         │    YYYY-MM-DD-<feature>.md    │
         └───────────────┬───────────────┘
                         │
         ┌───────────────▼───────────────────────┐
         │  EXECUTION CHOICE:                    │
         │  ┌─────────────────┐  ┌─────────────┐│
         │  │ subagent-driven │  │  executing- ││
         │  │   development   │  │    plans    ││
         │  │  (parallel)     │  │  (current   ││
         │  │                 │  │   session)  ││
         │  └────────┬────────┘  └──────┬──────┘│
         └───────────┼──────────────────┼───────┘
                     │                  │
        ┌────────────▼─────┐   ┌────────▼─────────┐
        │                  │   │                  │
        │  SUBAGENT PATH   │   │  INLINE PATH     │
        │  (see diagram 4) │   │                  │
        │                  │   │  Execute all     │
        └────────┬─────────┘   │  tasks in order  │
                 │              │  with TodoWrite  │
                 │              │  tracking        │
                 │              └────────┬─────────┘
                 │                       │
                 └──────────┬────────────┘
                            │
            ┌───────────────▼───────────────┐
            │  SKILL: finishing-a-          │
            │         development-branch    │
            │  ─────────────────────────    │
            │  • Verify all tests pass      │
            │  • Present 4 options:         │
            │    1. Merge to main locally   │
            │    2. Create PR               │
            │    3. Keep branch for later   │
            │    4. Discard changes         │
            │  • Execute chosen workflow    │
            │  • Cleanup worktree (1 & 4)   │
            └───────────────────────────────┘


KEY PRINCIPLE: Design → Plan → Execute → Verify → Integrate
              (Never skip design/planning phases)
```

---

## 4. Subagent-Driven Development

```
┌────────────────────────────────────────────────────────────────────┐
│         SKILL: subagent-driven-development (Detailed Flow)          │
└────────────────────────┬───────────────────────────────────────────┘
                         │
         ┌───────────────▼───────────────┐
         │  SKILL: using-git-worktrees   │
         │  ─────────────────────────    │
         │  1. Create isolated worktree  │
         │  2. Verify git-ignored        │
         │  3. Run project setup         │
         │  4. Verify clean baseline     │
         └───────────────┬───────────────┘
                         │
         ┌───────────────▼───────────────────────────────┐
         │  Coordinator: Read plan ONCE at start         │
         │  Extract ALL tasks with full text             │
         │  Create TodoWrite with all tasks              │
         └───────────────┬───────────────────────────────┘
                         │
                         │ FOR EACH TASK:
                         │
         ┌───────────────▼───────────────────────────────┐
         │  Dispatch FRESH implementer subagent          │
         │  ────────────────────────────────────         │
         │  Context provided:                            │
         │  • Full task text only                        │
         │  • No session history (fresh context)         │
         │  • Related file context                       │
         └───────────────┬───────────────────────────────┘
                         │
         ┌───────────────▼───────────────────────────────┐
         │  Implementer: SKILL test-driven-development   │
         │  ──────────────────────────────────────────   │
         │  ┌──────────────────────────────────────┐    │
         │  │ RED: Write test, verify FAILS        │    │
         │  │   ↓                                   │    │
         │  │ GREEN: Write minimal code, verify    │    │
         │  │        PASSES                         │    │
         │  │   ↓                                   │    │
         │  │ REFACTOR: Clean up, keep tests green │    │
         │  └──────────────────────────────────────┘    │
         │  • Self-review code                           │
         │  • Commit with message                        │
         └───────────────┬───────────────────────────────┘
                         │
         ┌───────────────▼───────────────────────────────┐
         │  Dispatch spec-compliance-reviewer subagent   │
         │  ─────────────────────────────────────────    │
         │  Context: plan excerpt, git diff, task desc   │
         │  Review questions:                            │
         │  • Does code match spec exactly?              │
         │  • Any extra unspecified features?            │
         │  • All required parts present?                │
         │  Result: ✅ Compliant OR ❌ Issues            │
         └───────────────┬───────────────────────────────┘
                         │
                    ┌────┴────┐
                    │         │
              Issues found?   │
                    │         │
              YES   │         │ NO
         ┌──────────▼─────┐   │
         │ Re-dispatch    │   │
         │ implementer    │   │
         │ with feedback  │   │
         └────────┬───────┘   │
                  │           │
                  └─────┬─────┘
                        │
         ┌──────────────▼───────────────────────────────┐
         │  Dispatch code-quality-reviewer subagent     │
         │  ───────────────────────────────────────     │
         │  Context: code diff, TDD requirements        │
         │  Review checklist:                           │
         │  • Architecture & design patterns            │
         │  • Testing thoroughness                      │
         │  • Error handling                            │
         │  • Code clarity                              │
         │  Result: ✅ Approved OR ❌ Issues            │
         └──────────────┬───────────────────────────────┘
                        │
                   ┌────┴────┐
                   │         │
             Issues found?   │
                   │         │
             YES   │         │ NO
        ┌──────────▼─────┐   │
        │ Re-dispatch    │   │
        │ implementer    │   │
        │ with feedback  │   │
        └────────┬───────┘   │
                 │           │
                 └─────┬─────┘
                       │
        ┌──────────────▼──────────────────┐
        │  Mark task complete in TodoWrite│
        └──────────────┬──────────────────┘
                       │
                       │ NEXT TASK (loop)
                       │
         ┌─────────────▼──────────────────────────────┐
         │  After ALL tasks complete:                 │
         │  Dispatch final code-reviewer subagent     │
         │  (holistic review of entire implementation)│
         └─────────────┬──────────────────────────────┘
                       │
         ┌─────────────▼──────────────────────────────┐
         │  Return to main workflow                   │
         │  → finishing-a-development-branch          │
         └────────────────────────────────────────────┘


KEY PRINCIPLES:
┌──────────────────────────────────────────────────────────────────┐
│ • Fresh subagent per task (no context contamination)            │
│ • Two-stage review: spec compliance FIRST, then code quality    │
│ • Review loops ensure fixes actually work (re-verify)           │
│ • Coordinator reads plan ONCE, extracts all tasks               │
│ • Each subagent gets ONLY task text, not session history        │
│ • Model selection: cheap for mechanical, capable for design     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Hook System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│               PLATFORM SESSION START (Any platform)              │
└──────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼──────┐  ┌─────▼─────┐  ┌─────▼──────┐
    │ Claude Code    │  │  Cursor   │  │   Other    │
    │ (startup,      │  │ (startup, │  │ platforms  │
    │  clear,        │  │  clear)   │  │            │
    │  compact)      │  │           │  │            │
    └─────────┬──────┘  └─────┬─────┘  └─────┬──────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │  hooks/session-start          │
              │  (Bash script)                │
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────────────────┐
              │  STEP 1: Detect Platform                  │
              │  ────────────────────────                 │
              │  Check environment variables:             │
              │  • CLAUDE_PLUGIN_ROOT → Claude Code       │
              │  • CURSOR_PLUGIN_ROOT → Cursor            │
              │  • Other → Fallback                       │
              └───────────────┬───────────────────────────┘
                              │
              ┌───────────────▼───────────────────────────┐
              │  STEP 2: Load Bootstrap Skill             │
              │  ────────────────────────────             │
              │  Read file:                               │
              │  skills/using-superpowers/SKILL.md        │
              └───────────────┬───────────────────────────┘
                              │
              ┌───────────────▼───────────────────────────┐
              │  STEP 3: Escape for JSON Embedding        │
              │  ────────────────────────────────         │
              │  • Escape quotes, newlines                │
              │  • Make safe for JSON string              │
              └───────────────┬───────────────────────────┘
                              │
              ┌───────────────▼───────────────────────────┐
              │  STEP 4: Check Legacy Installation        │
              │  ────────────────────────────────         │
              │  If ~/.config/superpowers/skills exists:  │
              │  → Show migration warning                 │
              └───────────────┬───────────────────────────┘
                              │
              ┌───────────────▼───────────────────────────┐
              │  STEP 5: Output Platform-Specific JSON    │
              │  ────────────────────────────────         │
              │  Claude Code format:                      │
              │  {                                        │
              │    "hookSpecificOutput": {                │
              │      "hookEventName": "SessionStart",     │
              │      "additionalContext": "<skill>"       │
              │    }                                      │
              │  }                                        │
              │                                           │
              │  Cursor format:                           │
              │  {                                        │
              │    "additional_context": "<skill>"        │
              │  }                                        │
              └───────────────┬───────────────────────────┘
                              │
              ┌───────────────▼───────────────────────────┐
              │  Platform parses JSON output              │
              └───────────────┬───────────────────────────┘
                              │
              ┌───────────────▼───────────────────────────┐
              │  Inject into system prompt                │
              │  as additional_context                    │
              └───────────────┬───────────────────────────┘
                              │
              ┌───────────────▼───────────────────────────┐
              │  Agent initializes with:                  │
              │  "You have superpowers"                   │
              │  + full using-superpowers skill content   │
              └───────────────┬───────────────────────────┘
                              │
                      ┌───────▼────────┐
                      │  Agent ready   │
                      │  for skills    │
                      └────────────────┘


HOOK CONFIGURATION FILES:
┌────────────────────────────────────────────────────────────────┐
│  hooks/hooks.json (Claude Code)                                │
│  ─────────────────────────────────                             │
│  {                                                             │
│    "sessionStartEvent": {                                      │
│      "command": "./hooks/session-start",                       │
│      "when": ["startup", "clear", "compact"]                   │
│    }                                                           │
│  }                                                             │
│                                                                │
│  hooks/hooks-cursor.json (Cursor)                              │
│  ───────────────────────────────                               │
│  Similar format, cursor-specific events                        │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPERPOWERS INTEGRATION                       │
│                    (Multi-Platform Support)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼───────┐   ┌────────▼────────┐
│  Claude Code   │   │    Cursor      │   │  OpenCode       │
│  Integration   │   │  Integration   │   │  Integration    │
└───────┬────────┘   └────────┬───────┘   └────────┬────────┘
        │                     │                     │
        │                     │                     │
┌───────▼─────────────────────────────────────────────────────────┐
│                    PLUGIN SYSTEM                                 │
│  ────────────────────────────────────                            │
│  • Plugin manifest (plugin.json)                                 │
│  • Skills directory registration                                 │
│  • Agents directory registration                                 │
│  • Hooks registration                                            │
└───────┬─────────────────────────────────────────────────────────┘
        │
        │ Each platform loads:
        │
┌───────▼─────────────────────────────────────────────────────────┐
│                    SKILL DISCOVERY                               │
│  ────────────────────────────────                                │
│  1. Read skills/ directory                                       │
│  2. For each subdirectory:                                       │
│     • Find SKILL.md file                                         │
│     • Parse frontmatter (name, description)                      │
│     • Register skill for invocation                              │
│  3. Make available via Skill tool                                │
└───────┬─────────────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────────────┐
│                    HOOK REGISTRATION                             │
│  ────────────────────────────────                                │
│  1. Read hooks/hooks.json (or platform-specific)                 │
│  2. Register event handlers:                                     │
│     • SessionStart → hooks/session-start                         │
│  3. Execute on trigger events                                    │
│  4. Parse output and inject into system prompt                   │
└───────┬─────────────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────────────┐
│                    AGENT DISCOVERY                               │
│  ────────────────────────────────                                │
│  1. Read agents/ directory                                       │
│  2. Load agent personas (e.g., code-reviewer.md)                 │
│  3. Make available for subagent dispatch                         │
└───────┬─────────────────────────────────────────────────────────┘
        │
        │
┌───────▼─────────────────────────────────────────────────────────┐
│                    TOOL MAPPING                                  │
│  ────────────────────────────────                                │
│  Skills reference standard tools:                                │
│  • Read       → Platform-specific read                           │
│  • Write      → Platform-specific write                          │
│  • Edit       → Platform-specific edit                           │
│  • Bash       → Platform-specific command                        │
│  • Glob       → Platform-specific file search                    │
│  • Grep       → Platform-specific content search                 │
│  • Agent      → Platform-specific subagent dispatch              │
│  • TodoWrite  → Platform-specific task tracking                  │
│                                                                  │
│  Tool mapping documented in:                                     │
│  skills/using-superpowers/references/codex-tools.md              │
└──────────────────────────────────────────────────────────────────┘


PLATFORM-SPECIFIC CONFIGURATIONS:

Claude Code:
┌──────────────────────────────────────────────────────────────┐
│  .claude-plugin/plugin.json                                   │
│  ─────────────────────────                                    │
│  {                                                            │
│    "name": "superpowers",                                     │
│    "version": "5.0.6",                                        │
│    "skills": "./skills/",                                     │
│    "agents": "./agents/",                                     │
│    "hooks": "./hooks/hooks.json"                              │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘

Cursor:
┌──────────────────────────────────────────────────────────────┐
│  .cursor-plugin/plugin.json                                   │
│  ─────────────────────────                                    │
│  Similar structure, cursor-specific paths                     │
└──────────────────────────────────────────────────────────────┘

OpenCode:
┌──────────────────────────────────────────────────────────────┐
│  .opencode/plugins/superpowers.js                             │
│  ───────────────────────────────────                          │
│  • JavaScript plugin entry point                              │
│  • System prompt transform for bootstrap injection            │
│  • Auto-register skills directory                             │
│  • Extract frontmatter from SKILL.md files                    │
│  • Provide tool mapping                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. File Organization

```
superpowers/
│
├── skills/                              # 15 Core Workflow Skills
│   ├── brainstorming/                   # Design & Requirements
│   │   ├── SKILL.md
│   │   └── scripts/                     # Visual companion scripts
│   ├── writing-plans/                   # Implementation Planning
│   │   ├── SKILL.md
│   │   └── plan-document-reviewer-prompt.md
│   ├── subagent-driven-development/     # Parallel Task Execution
│   │   ├── SKILL.md
│   │   ├── implementer-prompt.md
│   │   ├── spec-reviewer-prompt.md
│   │   └── code-quality-reviewer-prompt.md
│   ├── executing-plans/                 # Sequential Plan Execution
│   ├── dispatching-parallel-agents/     # Parallel Debugging
│   ├── using-git-worktrees/             # Workspace Isolation
│   ├── test-driven-development/         # TDD Workflow
│   │   ├── SKILL.md
│   │   └── testing-anti-patterns.md
│   ├── systematic-debugging/            # 4-Phase Debugging
│   │   ├── SKILL.md
│   │   ├── root-cause-tracing.md
│   │   ├── defense-in-depth.md
│   │   └── condition-based-waiting.md
│   ├── verification-before-completion/  # Evidence Gate
│   ├── requesting-code-review/          # Initiate Review
│   │   ├── SKILL.md
│   │   └── code-reviewer.md
│   ├── receiving-code-review/           # Handle Feedback
│   ├── finishing-a-development-branch/  # Merge/PR Decision
│   ├── using-superpowers/               # System Introduction
│   │   ├── SKILL.md
│   │   └── references/codex-tools.md    # Tool mapping
│   └── writing-skills/                  # Skill Creation Guide
│       ├── SKILL.md
│       ├── anthropic-best-practices.md
│       └── examples/
│
├── hooks/                               # Session Initialization
│   ├── hooks.json                       # Claude Code config
│   ├── hooks-cursor.json                # Cursor config
│   ├── session-start                    # Bootstrap script
│   └── run-hook.cmd                     # Windows wrapper
│
├── agents/                              # Pre-built Agent Personas
│   └── code-reviewer.md                 # Senior Code Reviewer
│
├── .claude-plugin/                      # Claude Code Plugin
│   ├── plugin.json                      # Plugin manifest
│   └── marketplace.json                 # Marketplace metadata
│
├── .cursor-plugin/                      # Cursor Plugin
│   └── plugin.json
│
├── .opencode/                           # OpenCode Plugin
│   ├── plugins/superpowers.js           # JS entry point
│   └── INSTALL.md
│
├── .codex/                              # Codex Installation
│   └── INSTALL.md
│
├── tests/                               # Skill Verification Tests
│   ├── claude-code/
│   │   ├── test-helpers.sh              # Common test functions
│   │   ├── test-*.sh                    # Fast tests (~2 min)
│   │   ├── test-*-integration.sh        # Integration tests (10-30 min)
│   │   └── run-skill-tests.sh           # Test runner
│   └── subagent-driven-dev/
│       ├── go-fractals/                 # Test project
│       └── svelte-todo/                 # Test project
│
├── docs/                                # Documentation & Generated Files
│   ├── superpowers/
│   │   ├── specs/                       # Design documents (from brainstorming)
│   │   │   └── YYYY-MM-DD-<topic>-design.md
│   │   └── plans/                       # Implementation plans (from writing-plans)
│   │       └── YYYY-MM-DD-<feature>.md
│   ├── README.codex.md
│   ├── README.opencode.md
│   ├── testing.md
│   └── windows/
│
├── commands/                            # DEPRECATED - Old command system
│   ├── brainstorm.md
│   ├── write-plan.md
│   └── execute-plan.md
│
├── package.json                         # NPM package metadata
├── README.md                            # Main documentation
├── CHANGELOG.md
├── RELEASE-NOTES.md
├── gemini-extension.json                # Gemini CLI config
└── LICENSE

KEY:
├── [Directory/]     = Directory containing related files
├── [file.md]        = Markdown file (skill, doc, config)
├── [file.json]      = JSON configuration file
└── [file.sh]        = Bash script (executable)
```

---

## 8. Key Principles

```
┌─────────────────────────────────────────────────────────────────┐
│                   SUPERPOWERS CORE PRINCIPLES                    │
└─────────────────────────────────────────────────────────────────┘

1. SKILL INVOCATION RULE
┌──────────────────────────────────────────────────────────────┐
│  IF even 1% chance a skill might apply → YOU MUST INVOKE IT │
│  This is not negotiable. This is not optional.               │
│  Skills override default behavior.                           │
│  User instructions override skills.                          │
└──────────────────────────────────────────────────────────────┘

2. WORKFLOW GATES (Sequential, No Skipping)
┌──────────────────────────────────────────────────────────────┐
│  Design (brainstorming)                                      │
│    ↓ User approval required                                  │
│  Plan (writing-plans)                                        │
│    ↓ User approval required                                  │
│  Execute (subagent-driven or executing-plans)                │
│    ↓ Tests must pass                                         │
│  Review (requesting-code-review)                             │
│    ↓ Critical issues must be fixed                           │
│  Integrate (finishing-a-development-branch)                  │
└──────────────────────────────────────────────────────────────┘

3. TEST-DRIVEN DEVELOPMENT (Iron Law)
┌──────────────────────────────────────────────────────────────┐
│  NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST             │
│                                                              │
│  RED: Write test, watch it FAIL                             │
│    ↓  (If you didn't see it fail, you don't know            │
│        what it tests)                                       │
│  GREEN: Write minimal code, watch it PASS                   │
│    ↓                                                         │
│  REFACTOR: Clean up, keep tests green                       │
│                                                              │
│  All code written before tests → DELETE and start over      │
└──────────────────────────────────────────────────────────────┘

4. SYSTEMATIC DEBUGGING (No Quick Fixes)
┌──────────────────────────────────────────────────────────────┐
│  Phase 1: Root Cause Investigation                           │
│           (Read errors, reproduce, gather evidence)          │
│    ↓                                                         │
│  Phase 2: Pattern Analysis                                   │
│           (Find working examples, compare)                   │
│    ↓                                                         │
│  Phase 3: Hypothesis and Testing                             │
│           (Scientific method, one variable)                  │
│    ↓                                                         │
│  Phase 4: Implementation                                     │
│           (Create failing test, fix, verify)                 │
│                                                              │
│  If 3+ fixes fail → Question architecture, don't force it   │
└──────────────────────────────────────────────────────────────┘

5. VERIFICATION BEFORE CLAIMS
┌──────────────────────────────────────────────────────────────┐
│  NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE    │
│                                                              │
│  Before saying "done", "fixed", "passing", "working":        │
│    1. Identify verification command                          │
│    2. Run command                                            │
│    3. Read output                                            │
│    4. Verify expected state                                  │
│    5. THEN make claim                                        │
│                                                              │
│  Evidence before assertions. Always.                         │
└──────────────────────────────────────────────────────────────┘

6. TWO-STAGE REVIEW
┌──────────────────────────────────────────────────────────────┐
│  Stage 1: Spec Compliance Review                             │
│           • Does code match requirements?                    │
│           • Any extra features?                              │
│           • All required parts present?                      │
│    ↓ Must pass before Stage 2                                │
│  Stage 2: Code Quality Review                                │
│           • Architecture & design patterns                   │
│           • Testing thoroughness                             │
│           • Error handling                                   │
│           • Code clarity                                     │
│                                                              │
│  Review loops: If issues found → Fix → Re-verify            │
└──────────────────────────────────────────────────────────────┘

7. SUBAGENT ISOLATION
┌──────────────────────────────────────────────────────────────┐
│  Each subagent gets:                                         │
│    • Fresh context (no session history)                      │
│    • ONLY task text + necessary file context                │
│    • Clean slate for focused work                            │
│                                                              │
│  Benefits:                                                   │
│    • No context contamination                                │
│    • Parallel execution possible                             │
│    • Clear task boundaries                                   │
│    • Easier debugging of failures                            │
└──────────────────────────────────────────────────────────────┘

8. DESIGN VALUES
┌──────────────────────────────────────────────────────────────┐
│  • Simplicity as primary goal (reduce complexity)            │
│  • YAGNI ruthlessly (don't implement unused features)        │
│  • Technical rigor (no performative agreement)               │
│  • Evidence-based decisions (verify, don't assume)           │
│  • Systematic over ad-hoc (process beats guessing)           │
│  • One question at a time (don't overwhelm)                  │
└──────────────────────────────────────────────────────────────┘

9. SKILL PRIORITY (When Multiple Apply)
┌──────────────────────────────────────────────────────────────┐
│  1. Process skills first (brainstorming, debugging)          │
│     These determine HOW to approach the task                 │
│       ↓                                                       │
│  2. Implementation skills second (domain-specific)           │
│     These guide execution of the work                        │
│                                                              │
│  Example: "Build X" → brainstorming first, then impl skills  │
│           "Fix bug" → debugging first, then domain skills    │
└──────────────────────────────────────────────────────────────┘

10. USER INSTRUCTIONS PRECEDENCE
┌──────────────────────────────────────────────────────────────┐
│  Priority order:                                             │
│    1. User's explicit instructions (highest)                 │
│       (CLAUDE.md, GEMINI.md, AGENTS.md, direct requests)     │
│    2. Superpowers skills                                     │
│    3. Default system prompt (lowest)                         │
│                                                              │
│  If user says "don't use TDD" → Don't use TDD                │
│  User is always in control.                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Summary

Superpowers is a comprehensive workflow library that transforms coding agents into disciplined, systematic software engineers. It enforces:

1. **Mandatory design and planning** before any code is written
2. **Test-driven development** for all implementations
3. **Systematic debugging** following a 4-phase investigation process
4. **Evidence-based verification** before any completion claims
5. **Two-stage code review** (spec compliance, then code quality)
6. **Subagent isolation** for parallel work without context contamination
7. **Git worktree isolation** for clean, independent workspaces
8. **Structured workflows** from idea to merged code

The system integrates with multiple platforms (Claude Code, Cursor, OpenCode, Codex) through:
- Plugin manifests for skill/agent/hook discovery
- SessionStart hooks that auto-inject the skill system
- Platform-specific tool mappings
- Consistent skill invocation via the Skill tool

Every skill is rigorously tested with both fast unit-style tests and slow integration tests that verify complete workflows in real projects.

**The fundamental rule: If there's even a 1% chance a skill applies, you MUST invoke it. No exceptions.**
