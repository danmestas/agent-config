---
name: frontend
version: 2.1.1
type: outfit
description: Datastar / shadcn / UI work.
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
  - tooling
enable:
  mcps:
    - context-mode
disable:
  plugins:
    - gopls-lsp
    - swift-lsp
  mcps:
    - axiom
    - axiom-codex
    - doppler
    - doppler-codex
    - signoz
    - signoz-codex
skill_include:
  - writing-plans
  - brainstorming
  - subagent-driven-development
  - systematic-debugging
  - datastar-tao
  - datastar-patterns
  - datastar
  - shadcn-forms
  - obsidian-markdown
  - norman
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
  - golang-patterns
include:
  hooks:
    - rtk-suggest
    - rtk-rewrite
    - rtk-pre-commit-format
  agents:
    - rtk-testing-specialist
    - rtk-rust-expert
---

# Frontend Outfit

For Datastar / shadcn / UI work — studs-cycles, studs-cycles-pb, darken.
Force-loads the core4 plus the full Datastar stack (`datastar-tao`,
`datastar-patterns`, `datastar`), `shadcn-forms`, `obsidian-markdown`, and
`norman` design heuristics. Excludes `golang-patterns` since this is not a Go
project.
