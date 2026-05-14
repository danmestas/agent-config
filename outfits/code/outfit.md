---
name: code
version: 2.0.0
type: outfit
description: Generic coding work — language-agnostic baseline for any code project.
targets: [claude-code, codex, gemini, pi]
categories: [economy, workflow, backpressure, evolution]
enable:
  mcps:
    - context-mode
skill_include:
  - writing-plans
  - brainstorming
  - subagent-driven-development
  - systematic-debugging
  - ousterhout
  - tigerstyle
  - verification-before-completion
  - executing-plans
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
include:
  hooks:
    - rtk-suggest
    - rtk-rewrite
    - rtk-pre-commit-format
  agents:
    - rtk-testing-specialist
    - rtk-rust-expert
---

# Code Outfit

Language-agnostic default for any coding project where no more-specific outfit
fits. Force-loads the universal core: `writing-plans`, `brainstorming`,
`subagent-driven-development`, and `systematic-debugging` — plus design
philosophy (`ousterhout`, `tigerstyle`) and execution discipline
(`verification-before-completion`, `executing-plans`). Layer with a `--mode`
(planning, executing, debugging, etc.) and accessories for specific work
(e.g. `--accessory test-driven-development`, `--accessory philosophy`).
