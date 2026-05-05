---
name: frontend
version: 2.1.1
type: outfit
description: Datastar / shadcn / UI work.
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
  - backpressure
  - evolution
  - tooling
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
skill_exclude:
  - idiomatic-go
---

# Frontend Outfit

For Datastar / shadcn / UI work — studs-cycles, studs-cycles-pb, darken.
Force-loads the core4 plus the full Datastar stack (`datastar-tao`,
`datastar-patterns`, `datastar`), `shadcn-forms`, `obsidian-markdown`, and
`norman` design heuristics. Excludes `idiomatic-go` since this is not a Go
project.
