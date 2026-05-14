---
name: backend
version: 2.1.1
type: outfit
description: 'Backend dev work — Go, server, observability, deterministic systems.'
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
  - integrations
  - context-management
enable:
  mcps:
    - context-mode
disable:
  plugins:
    - frontend-design
    - frontend-design-codex
    - swift-lsp
skill_include:
  - writing-plans
  - brainstorming
  - subagent-driven-development
  - systematic-debugging
  - golang-patterns
  - signoz-dashboard-builder
  - deterministic-simulation-testing
  - farley
  - tigerstyle
  - ousterhout
  - verification-before-completion
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
  - datastar
  - datastar-tao
  - datastar-patterns
  - shadcn-forms
permissions:
  claude-code:
    allow:
      - "Bash(git status:*)"
      - "Bash(git diff:*)"
      - "Bash(git log:*)"
      - "Bash(git branch:*)"
      - "Bash(git fetch:*)"
      - "Bash(go test:*)"
      - "Bash(go build:*)"
      - "Bash(go vet:*)"
      - "Bash(go fmt:*)"
      - "Bash(go run:*)"
      - "Bash(npm run test:*)"
      - "Bash(npm run validate:*)"
      - "mcp__signoz__signoz_search_logs"
      - "mcp__signoz__signoz_query_metrics"
      - "mcp__signoz__signoz_search_traces"
      - "mcp__signoz__signoz_list_services"
    deny:
      - "Bash(rm -rf:*)"
      - "Bash(git push --force:*)"
      - "Bash(git push -f:*)"
---

# Backend Outfit

For Go-heavy server work — serverdom, dagnats, firestorm-dataworks, EdgeSync,
agent-infra. Force-loads the core4 plus `golang-patterns`, observability tooling
(`signoz-dashboard-builder`), deterministic-sim philosophies
(`deterministic-simulation-testing`, `farley`, `tigerstyle`, `ousterhout`),
and `verification-before-completion`. Excludes Datastar and shadcn frontend
skills to keep context lean.
