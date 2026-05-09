---
name: planning
version: 1.1.2
type: cut
description: 'Designing before code — produce a plan, don''t write the implementation yet.'
targets:
  - claude-code
  - codex
  - gemini
  - copilot
  - pi
categories:
  - economy
  - workflow
enable:
  plugins:
    - superpowers
    - superpowers-codex
skill_include: []
skill_exclude: []
include:
  skills:
    - brainstorming
    - writing-plans
    - reflect
  rules: []
  hooks: []
  agents: []
  commands: []
---

Designing before code. The deliverable here is a plan, not an implementation — defer writing code until the shape of the work is clear.

You are in planning cut. Plan only — do not write the implementation yet. Your
deliverable is a written plan: structure, components, interfaces, sequencing,
trade-offs, open questions. Brainstorm the problem space before you settle on an
approach; cheap exploration up front saves expensive rework downstream. When
something is unclear, ask one question at a time — never batch a multi-question
battery and stall the thread. Reflect on what you've drafted before declaring it
done; a plan that hasn't been pressure-tested isn't ready.
