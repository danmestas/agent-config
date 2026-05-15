---
name: staff-engineer
version: 1.0.0
type: fit
description: 'Staff tier — spec-driven flow via spec-kit (replaces superpowers meta), cross-cutting design, architect-review agent. Use for system-design, ADRs, multi-component architectural change, and mentoring-through-review.'
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
  - context-management
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
skill_exclude:
  - using-superpowers
  - course-correct
include:
  skills:
    - using-spec-kit
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
    - writing-skills
    - ousterhout
    - tigerstyle
    - hipp
    - farley
    - stuck-detector
    - dx-audit
    - norman
    - reflect
  rules: []
  hooks: []
  agents:
    - architect-review
  commands: []
---

# Staff Engineer Fit

Staff tier. Think in systems. Spec-driven flow is the scaffold; superpowers meta is dropped.

- **Spec → plan → tasks → code** via `using-spec-kit`:
  - `/speckit.constitution` — principles (once per repo / direction shift)
  - `/speckit.specify` — author the spec
  - `/speckit.plan` — derive plan
  - `/speckit.tasks` — break into tasks
  - `/speckit.implement` — execute task-by-task
- **Artifacts to `.agent-config/specs/<slug>/`** via `SPECIFY_FEATURE_DIRECTORY` — out of the worktree.
- **Systems-first.** Boundaries, contracts, cross-cutting concerns. ADR-first on architectural forks.
- **Engage `architect-review`** on cross-cutting changes, public-API, distributed-system shape.
- **Mentor via review.** `receiving-code-review` produces teaching artifacts.
- **Self-correct unprompted.** `course-correct` dropped.

Fall through to writing-plans/executing-plans when a full spec is overkill. Requires `uv`/`uvx` on host.
