---
name: vault
version: 1.0.0
type: accessory
description: Obsidian vault toolkit — ingest, query, save, lint, plus markdown/bases/canvas authoring.
targets: [claude-code, codex, gemini, pi]
include:
  skills: [vault-ingest, vault-query, vault-save, vault-lint, obsidian-markdown, obsidian-bases, obsidian-canvas]
  rules: []
  hooks: []
  agents: []
  commands: []
---

# Vault Accessory

Layer this when an outfit other than `kb` needs vault ops — for example, an `aviation` outfit doing flight-plan KB writes, or `engineering` capturing a design note. Pulls the four vault-* skills (ingest, query, save, lint) plus the three Obsidian authoring skills (markdown, bases, canvas) so a session can both read and produce vault content.

With the `kb` outfit this accessory is redundant — `kb` already includes the same set as defaults. Layer it only when the host outfit is something else and vault interaction is incidental rather than primary.

The bundle is intentionally read-and-write: vault-query alone is too narrow for any session that might need to capture a finding, and vault-save without vault-lint produces drift. Keep them paired.
