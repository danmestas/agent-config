---
name: aviation
version: 2.1.1
type: outfit
description: 'Flight planning, NOTAMs, charts, ops references.'
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
  - integrations
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
  - autoresearch
  - apple-contacts
skill_exclude:
  - idiomatic-go
  - datastar
  - datastar-tao
  - datastar-patterns
  - shadcn-forms
---

# Aviation Outfit

For Flight-Planner, NOTAMOrganizer, NotamsApi, preflightapi.backend, and
flight-planner-kb. Force-loads the core4 plus `knowledge-base-overview`,
`obsidian-markdown`, `autoresearch` (for charts/regs lookups), and
`apple-contacts` (for crew/ATC contact lookups). Memory of plans and
briefings, KB-leaning. Excludes coding-language and frontend skills.
