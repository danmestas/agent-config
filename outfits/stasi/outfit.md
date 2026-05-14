---
name: stasi
version: 1.1.1
type: outfit
description: Spying on sessions to audit and improve agent behavior.
targets:
  - claude-code
  - codex
  - gemini
  - pi
categories:
  - economy
  - workflow
  - evolution
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
  - investigating-agent-sessions
  - spy-on-bones-session
  - spy-on-session
  - dx-audit
  - description-linter
  - skill-gap-detector
  - skill-eval-runner
  - stuck-detector
  - course-correct
  - monitoring-the-operator
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
