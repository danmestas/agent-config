---
name: quick
version: 0.1.0
type: outfit
description: Quick generalist outfit composed from implementer + planner + reviewer for solo flow. Use when working alone on a small task and the role keeps shifting. For orchestrated multi-pane work, use the individual role outfits instead — quick is the v2 generalist replacement for v1 domain outfits.
targets:
  - claude-code
  - codex
  - gemini
  - copilot
  - pi
categories:
  - workflow
  - evolution
  - backpressure
disable:
  plugins:
    - frontend-design
    - frontend-design-codex
    - swift-lsp
  mcps: []
  hooks: []
skill_include: []
skill_exclude: []
compose:
  - implementer + planner + reviewer
---

# Quick Outfit

Solo generalist mode. You play implementer, planner, and reviewer as the work shape demands. The compose expression unions the skill sets of all three role outfits, so you get TDD discipline, planning thinking, and review lenses without committing to a single role posture.

For orchestrated multi-pane work, use the role-specific outfits instead — `quick` is for the case where you're alone and the role keeps shifting. When orchestrated, role boundaries matter (the planner shouldn't implement, the implementer shouldn't redesign); when solo, the boundaries blur and that's fine.

Pair with a stack cut (e.g. `--cut go-backend`) and a project accessory (e.g. `--accessory project-bones`) for a fully-dressed solo session.
