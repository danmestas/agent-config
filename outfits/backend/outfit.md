---
name: backend
version: 2.1.1
type: outfit
description: 'Backend dev work — Go, server, observability, deterministic systems.'
targets:
  - claude-code
  - codex
  - gemini
  - copilot
  - pi
categories:
  - economy
  - workflow
  - backpressure
  - evolution
  - integrations
  - context-management
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
  - golang-patterns
  - signoz-dashboard-builder
  - deterministic-simulation-testing
  - farley
  - tigerstyle
  - ousterhout
  - verification-before-completion
skill_exclude:
  - datastar
  - datastar-tao
  - datastar-patterns
  - shadcn-forms
---

# Backend Outfit

For Go-heavy server work — serverdom, dagnats, firestorm-dataworks, EdgeSync,
agent-infra. Force-loads the core4 plus `golang-patterns`, observability tooling
(`signoz-dashboard-builder`), deterministic-sim philosophies
(`deterministic-simulation-testing`, `farley`, `tigerstyle`, `ousterhout`),
and `verification-before-completion`. Excludes Datastar and shadcn frontend
skills to keep context lean.
