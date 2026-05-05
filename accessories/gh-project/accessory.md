---
name: gh-project
version: 1.0.0
type: accessory
description: GitHub project board toolkit.
targets: [claude-code, apm, codex, gemini, copilot, pi]
include:
  skills: [gh-project-charter, gh-project-setup, gh-project-operations, gh-project-shared]
  rules: []
  hooks: []
  agents: [gh-project-expert]
  commands: []
---

# GH-Project Accessory

Layer this when ticket or project-board work is in scope. Pulls the four gh-project-* skills (charter, setup, operations, shared) plus the gh-project-expert agent so a session can charter a new board, set it up, run day-to-day operations, and consult the expert for non-trivial workflow questions — all without manual skill loading.

The four skills are designed to compose: charter defines the board's intent, setup builds it, operations runs it, and shared holds the cross-cutting helpers the other three depend on. Loading any subset risks broken cross-references; load the bundle as a unit.

Pair this with whatever outfit is doing the underlying engineering or planning work. Without this accessory, project-board interactions fall back to ad-hoc gh CLI invocations.
