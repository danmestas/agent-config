---
name: writing
version: 1.1.1
type: mode
description: Prose / KB notes / docs.
targets:
  - claude-code
  - apm
  - codex
  - gemini
  - copilot
  - pi
categories:
  - memory-management
  - workflow
enable:
  plugins:
    - context7
    - context7-codex
    - obsidian
skill_include: []
skill_exclude: []
include:
  skills:
    - obsidian-markdown
    - defuddle
    - brainstorming
  rules: []
  hooks: []
  agents: []
  commands: []
---

Prose, knowledge-base notes, and docs. Write for clarity, lead with the why, and keep it tight — terse complete sentences over flowery ones.

You are in writing mode. Write for clarity. Lead with the why before the what —
readers landing cold need the motivation up front, not buried under context.
Use callouts and wikilinks where the harness supports them so notes link
into the broader graph rather than living as isolated artifacts. Keep it tight:
terse complete sentences over flowery ones, concrete examples over abstract
hand-waving, one strong verb instead of three weak qualifiers.
