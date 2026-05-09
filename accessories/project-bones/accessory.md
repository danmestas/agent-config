---
name: project-bones
version: 0.1.0
type: accessory
description: Project context accessory for the bones repo — loads bones-specific skills (using-bones-powers, using-bones-swarm, spy-on-bones-session, finishing-a-bones-leaf). Apply when working in or against a project that uses bones. Named project-bones (not bones) to avoid collision with the existing bones outfit.
targets:
  - claude-code
  - codex
  - gemini
  - pi
include:
  skills:
    - using-bones-powers
    - using-bones-swarm
    - spy-on-bones-session
    - finishing-a-bones-leaf
  rules: []
  hooks: []
  agents: []
  commands: []
---

# Bones project context

You are operating in or against a bones-instrumented project. The `bones` binary is on PATH; `.bones/` carries hub state; `.claude/skills/` may include the bones-installed skill manifest. Task coordination flows through `bones tasks` verbs and the NATS hub. ADRs live in `docs/adr/`. Read CLAUDE.md for project specifics.
