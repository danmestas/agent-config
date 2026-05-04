---
name: code
version: 2.0.0
type: outfit
description: Generic coding work — language-agnostic baseline for any code project.
targets: [claude-code, apm, codex, gemini, copilot, pi]
categories: [economy, workflow, backpressure, evolution]
skill_include:
  - writing-plans
  - brainstorming
  - subagent-driven-development
  - systematic-debugging
  - ousterhout
  - tigerstyle
  - verification-before-completion
  - executing-plans
skill_exclude: []
---

# Code Outfit

Language-agnostic default for any coding project where no more-specific outfit
fits. Force-loads the universal core: `writing-plans`, `brainstorming`,
`subagent-driven-development`, and `systematic-debugging` — plus design
philosophy (`ousterhout`, `tigerstyle`) and execution discipline
(`verification-before-completion`, `executing-plans`). Layer with a `--mode`
(planning, executing, debugging, etc.) and accessories for specific work
(e.g. `--accessory test-driven-development`, `--accessory philosophy`).
