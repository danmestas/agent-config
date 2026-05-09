---
name: python-data
version: 0.1.0
type: cut
description: Python data stack cut — pandas/polars, ETL, ML, notebook-style analysis. Type hints, no surprise mutation.
targets:
  - claude-code
  - codex
  - gemini
  - pi
categories:
  - workflow
  - integrations
enable:
  plugins: []
skill_include: []
skill_exclude: []
include:
  skills: []
  rules: []
  hooks: []
  agents: []
  commands: []
---

You are working on Python data code. Pure functions where possible; explicit mutation when not. Type hints everywhere — `from __future__ import annotations` and `dict[str, int]` style, not `Dict[str, int]`. Polars over pandas when performance matters. Notebooks for exploration, modules for reuse.
