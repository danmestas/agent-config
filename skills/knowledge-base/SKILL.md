---
name: knowledge-base
version: 0.1.0
description: >
  Persistent, compounding knowledge base for Claude Code. Drop sources into a vault,
  let an autoresearch agent synthesize a living wiki, query across sessions, and keep
  the structure healthy. Use when the user wants persistent notes, a knowledge graph,
  vault management, or mentions Obsidian, "second brain", or "persistent memory".
type: skill
targets:
  - claude-code
category:
  primary: context-management
  secondary:
    - memory-management
includes:
  - ../../skills/knowledge-base-overview
  - ../../skills/vault-overview
  - ../../skills/vault-ingest
  - ../../skills/vault-query
  - ../../skills/vault-lint
  - ../../skills/vault-save
  - ../../skills/autoresearch
  - ../../skills/defuddle
  - ../../skills/obsidian-canvas
  - ../../skills/obsidian-bases
  - ../../skills/obsidian-markdown
---

# knowledge-base

Bundle of 11 skills implementing the persistent vault / LLM-maintained knowledge-base pattern.

## What's inside

**Philosophy preface**
- `knowledge-base-overview` — the LLM writes the wiki, the human curates

**Vault management** (`context-management`)
- `vault-overview` — vault scaffolding, cross-project referencing, hot cache
- `vault-ingest` — ingest sources (files, URLs, batches) into the vault
- `vault-query` — query across accumulated notes
- `vault-lint` — vault hygiene checks
- `vault-save` — save query/conversation outputs back into the vault
- `autoresearch` — autonomous research that updates the vault as it goes

**Obsidian primitives** (`tooling`)
- `defuddle` — strip web clutter (ads, nav, boilerplate) before ingest
- `obsidian-canvas` — visual reference layer
- `obsidian-bases` — Obsidian Bases (.base file) authoring
- `obsidian-markdown` — Obsidian Flavored Markdown authoring

## Source

Originally `karpathy-llm-wiki` (the name was misleading — the content is Dan's "LLM Wiki" pattern, not Karpathy's material). Brought into `agent-skills` and renamed for clarity.

## Install

Once published to the marketplace: `/plugin install knowledge-base` from the `claude-plugins-official` marketplace.
