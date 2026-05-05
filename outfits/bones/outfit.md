---
name: bones
version: 1.1.0
type: outfit
description: The bones Go orchestrator — leaves, swarm, parallel work.
targets: [claude-code, apm, codex, gemini, copilot, pi]
categories: [economy, workflow, backpressure, evolution, integrations]
disable:
  plugins: [frontend-design, swift-lsp]
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
  - idiomatic-go
  - dispatching-parallel-agents
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
`takeoff`, `landing`), `idiomatic-go`, and `dispatching-parallel-agents`
for cross-leaf coordination. Excludes Datastar / shadcn frontend skills.
