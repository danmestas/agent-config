---
name: wiki
version: 1.0.0
type: plugin
description: >
  Wiki + knowledge-base toolkit — Obsidian formats, persistent memory, capture workflow.
  Use when working with file-based knowledge bases, Obsidian vaults, persistent markdown
  notes, or when capturing insights as ADRs and memory entries.
targets:
  - claude-code
  - apm
category:
  primary: memory-management
  secondary:
    - tooling
includes:
  - ../../skills/philosophy
  - ../../skills/capture
  - ../../skills/obsidian-bases
  - ../../skills/obsidian-canvas
  - ../../skills/obsidian-markdown
---

# wiki

Bundles five skills for working with long-running, file-based knowledge bases:

- `philosophy` — the wiki-first / file-shaped philosophy that informs the rest
- `capture` — persists agreed insights as ADRs (project) or memory entries (personal); pairs with `reflect`
- `obsidian-bases` — work with Obsidian Bases (.base files: views, filters, formulas)
- `obsidian-canvas` — work with JSON Canvas files (.canvas)
- `obsidian-markdown` — Obsidian-flavored markdown (wikilinks, callouts, properties)

Designed for users who keep cross-project memory in plain markdown and want the agent to participate in maintenance.
