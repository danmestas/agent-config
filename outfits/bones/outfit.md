---
name: bones
version: 1.1.1
type: outfit
description: 'The bones Go orchestrator — leaves, swarm, parallel work.'
targets:
  - claude-code
  - codex
  - gemini
  - pi
categories:
  - economy
  - workflow
  - backpressure
  - evolution
  - integrations
enable:
  mcps:
    - context-mode
disable:
  plugins:
    - frontend-design
    - frontend-design-codex
    - swift-lsp
skill_include:
  - writing-plans
  - brainstorming
  - subagent-driven-development
  - systematic-debugging
  - using-bones-powers
  - using-bones-swarm
  - finishing-a-bones-leaf
  - takeoff
  - landing
  - golang-patterns
  - dispatching-parallel-agents
  - rtk-triage
  - rtk-tdd
  - rtk-tdd-rust
  - rtk-issue-triage
  - rtk-pr-triage
  - rtk-pr-review
  - rtk-security-guardian
  - rtk-code-simplifier
  - rtk-design-patterns
  - rtk-performance
  - rtk-ship
  - rtk-repo-recap
  - caveman
  - caveman-commit
  - caveman-compress
  - caveman-help
  - caveman-review
  - caveman-stats
  - cavecrew
skill_exclude:
  - datastar
  - datastar-tao
  - datastar-patterns
  - shadcn-forms
---

# Bones Outfit

For the bones repo and any bones-shaped workspace doing leaf/swarm
orchestration. Force-loads the core4 plus the bones-powers pack
(`using-bones-powers`, `using-bones-swarm`, `finishing-a-bones-leaf`,
`takeoff`, `landing`), `golang-patterns`, and `dispatching-parallel-agents`
for cross-leaf coordination. Excludes Datastar / shadcn frontend skills.
