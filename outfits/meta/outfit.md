---
name: meta
version: 1.1.0
type: outfit
description: Wardrobe / suit / agent-skills authoring.
targets: [claude-code, apm, codex, gemini, copilot, pi]
categories: [economy, workflow, evolution, tooling]
disable:
  plugins: [gopls-lsp, swift-lsp, frontend-design]
  mcps: [signoz, axiom, doppler]
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
