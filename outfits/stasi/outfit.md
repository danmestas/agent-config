---
name: stasi
version: 1.1.1
type: outfit
description: Spying on sessions to audit and improve agent behavior.
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
  - evolution
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
  - investigating-agent-sessions
  - spy-on-bones-session
  - dx-audit
  - description-linter
  - skill-gap-detector
  - skill-eval-runner
  - stuck-detector
  - course-correct
skill_exclude: []
---

# Stasi Outfit

Cross-cutting outfit for reading session transcripts
(`~/.claude/projects/<repo>/*.jsonl`), surfacing DX gaps in
skills/agents/hooks, and adapting the wardrobe based on real usage — the
closed-loop improvement outfit. Force-loads the core4 plus the
investigation/audit pack (`investigating-agent-sessions`,
`spy-on-bones-session`, `dx-audit`, `description-linter`,
`skill-gap-detector`, `skill-eval-runner`, `stuck-detector`,
`course-correct`). Distinct from `meta` (which authors content); stasi
observes and improves what's already there.
