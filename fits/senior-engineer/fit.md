---
name: senior-engineer
version: 1.0.0
type: fit
description: 'Senior tier — superpowers stack + philosophy (ousterhout/tigerstyle/hipp/farley) + LSPs + backpressure rails. Use when design judgment, deep-modules thinking, and parallel-agent dispatch matter as much as execution.'
targets:
  - claude-code
  - codex
  - gemini
  - pi
categories:
  - workflow
  - economy
  - backpressure
  - evolution
enable:
  plugins:
    - gopls-lsp
  mcps: []
  hooks: []
disable:
  plugins: []
  mcps: []
  hooks: []
skill_include: []
skill_exclude: []
include:
  skills:
    - writing-plans
    - brainstorming
    - subagent-driven-development
    - systematic-debugging
    - executing-plans
    - dispatching-parallel-agents
    - verification-before-completion
    - test-driven-development
    - requesting-code-review
    - receiving-code-review
    - using-superpowers
    - writing-skills
    - ousterhout
    - tigerstyle
    - hipp
    - farley
    - course-correct
    - stuck-detector
    - dx-audit
    - norman
    - reflect
  rules: []
  hooks: []
  agents: []
  commands: []
---

# Senior Engineer Fit

Senior tier. Design before code on non-trivial work. Trust convention on the rest.

- **Design first when the change has shape.** New module, public API, multi-component refactor — author the plan and pause for `requesting-code-review` on the plan before writing code.
- **Dispatch subagents heavily.** Multi-file edits, mechanical refactors, broad searches, comparative reads — `dispatching-parallel-agents` is the default.
- **LSP before grep.** `gopls-lsp` is on. Cross-refs, type-resolution, find-all-usages — LSP first, regex fallback.
- **Reflect post-task.** Run `reflect` after meaningful changes ship.
- **Trust convention; surface only taste/architecture forks.** Decide implementation details. State 1-sentence rationale.
- **Self-trigger backpressure rails.** `course-correct`, `stuck-detector`, `dx-audit`, `norman` fire per their gates — respond without prompting.
