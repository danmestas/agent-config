---
name: aviation
version: 2.1.2
type: outfit
description: 'Flight planning, NOTAMs, charts, ops references.'
targets:
  - claude-code
  - codex
  - gemini
  - pi
categories:
  - economy
  - workflow
  - memory-management
  - integrations
enable:
  mcps:
    - context-mode
disable:
  plugins:
    - frontend-design
    - frontend-design-codex
    - gopls-lsp
    - plugin-dev
    - plugin-dev-codex
    - skill-creator
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
  - knowledge-base-overview
  - obsidian-markdown
  - vault-autoresearch
  - apple-contacts
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
  - datastar
  - datastar-tao
  - datastar-patterns
  - shadcn-forms
include:
  hooks:
    - rtk-suggest
    - rtk-rewrite
    - rtk-pre-commit-format
  agents:
    - rtk-testing-specialist
    - rtk-rust-expert
---

# Aviation Outfit

For Flight-Planner, NOTAMOrganizer, NotamsApi, preflightapi.backend, and
flight-planner-kb. Force-loads the core4 plus `knowledge-base-overview`,
`obsidian-markdown`, `vault-autoresearch` (for charts/regs lookups, staging
into the vault for ingestion), and `apple-contacts` (for crew/ATC contact
lookups). Memory of plans and briefings, KB-leaning. Excludes coding-language
and frontend skills.
