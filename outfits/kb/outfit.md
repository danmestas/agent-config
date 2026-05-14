---
name: kb
version: 1.1.2
type: outfit
description: Obsidian vault / knowledge curation.
targets:
  - claude-code
  - codex
  - gemini
  - pi
categories:
  - economy
  - workflow
  - memory-management
  - context-management
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
  - obsidian-markdown
  - vault-overview
  - vault-ingest
  - vault-query
  - vault-save
  - vault-lint
  - obsidian-bases
  - obsidian-canvas
  - vault-autoresearch
  - defuddle
  - knowledge-base-overview
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

# KB Outfit

For Knowledge-Base and FirestormKB — Obsidian vault curation. Force-loads
the core4 plus the full vault-* set (`vault-overview`, `vault-ingest`,
`vault-query`, `vault-save`, `vault-lint`), the obsidian-* set
(`obsidian-markdown`, `obsidian-bases`, `obsidian-canvas`), `defuddle` for
cleaning ingested content, and `vault-autoresearch` for KB-driven inquiry
(stages into `.raw/` for `vault-ingest`). Excludes coding-language and
frontend skills.
