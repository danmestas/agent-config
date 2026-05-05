---
name: meta
version: 1.1.1
type: outfit
description: Wardrobe / suit / agent-skills authoring.
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
  - tooling
disable:
  plugins:
    - frontend-design
    - frontend-design-codex
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
  - skill-creator
  - skill-development
  - suit-build
  - verification-before-completion
  - executing-plans
skill_exclude: []
---

# Meta Outfit

For working in the suit, wardrobe, agent-skills, and agent-config repos —
authoring new skills, modes, accessories, and outfits. Force-loads the core4
plus `skill-creator`, `skill-development`, `suit-build`,
`verification-before-completion`, and `executing-plans`. Distinct from
`stasi`: meta is for *creating* wardrobe content; stasi is for *observing
and auditing* it.
