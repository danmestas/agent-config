---
name: personal
version: 2.1.1
type: outfit
description: 'Journaling, resume, life admin (formerly personal + taxes).'
targets:
  - claude-code
  - codex
  - gemini
  - pi
categories:
  - economy
  - workflow
  - memory-management
enable:
  mcps:
    - context-mode
disable:
  plugins:
    - code-review
    - code-review-codex
    - code-simplifier
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
  - career-interview
  - memorize
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
---

# Personal Outfit

For home dir, resume, craft-design-group-website, staging-report, and tax
prep — journaling, life admin, and career work. Folds in the former `taxes`
outfit. Force-loads the core4 plus `obsidian-markdown`, `career-interview`,
and `memorize`. Lean text-only setup; excludes coding-language and frontend
skills.
