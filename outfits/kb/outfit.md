---
name: kb
version: 1.1.1
type: outfit
description: Obsidian vault / knowledge curation.
targets:
  - claude-code
  - apm
  - codex
  - gemini
  - copilot
  - pi
categories:
  - economy
  - workflow
  - memory-management
  - context-management
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
  - autoresearch
  - defuddle
  - knowledge-base-overview
skill_exclude:
  - idiomatic-go
  - datastar
  - datastar-tao
  - datastar-patterns
  - shadcn-forms
---

# KB Outfit

For Knowledge-Base and FirestormKB — Obsidian vault curation. Force-loads
the core4 plus the full vault-* set (`vault-overview`, `vault-ingest`,
`vault-query`, `vault-save`, `vault-lint`), the obsidian-* set
(`obsidian-markdown`, `obsidian-bases`, `obsidian-canvas`), `defuddle` for
cleaning ingested content, and `autoresearch` for KB-driven inquiry.
Excludes coding-language and frontend skills.
