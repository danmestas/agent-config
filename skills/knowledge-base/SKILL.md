---
name: knowledge-base
description: Use when building, maintaining, ingesting into, querying, or health-checking a markdown knowledge base or wiki. Use when the user wants to compile sources into structured knowledge, maintain an Obsidian wiki, ingest documents, ask questions against accumulated research, or run health checks on interlinked markdown pages. Triggers on requests involving knowledge bases, wiki maintenance, source ingestion, research compilation, Obsidian wiki workflows, or LLM-maintained documentation.
---

# Knowledge Base

Build and maintain personal knowledge bases as Obsidian-compatible markdown wikis. The LLM writes and maintains all wiki content. The human curates sources, asks questions, and directs exploration.

## Philosophy

**The LLM writes the wiki.** You summarize, cross-reference, file, and maintain. The human reads, curates sources, asks questions, and thinks about what it means.

**Knowledge compounds.** Every ingest updates existing pages, creates new ones, and strengthens cross-references. Query outputs get filed back into the wiki. The wiki gets richer with every interaction — nothing is re-derived from scratch.

**Structure emerges.** No prescribed schema. Self-organize as content comes in. Create index pages, categories, and groupings as they become useful. Maintain your own conventions and evolve them.

**Vault-agnostic.** Operate on any directory of markdown files. Don't assume a specific layout, naming convention, or pre-existing files. Read what's there and adapt.

## Required Context

You need two things:
1. **Wiki root** — the directory where wiki markdown lives
2. **Sources path** — where raw source documents live (if applicable)

These are passed as arguments or exist in conversation context.

## Routing

Determine which operation to run from context:

| Context | Action |
|---|---|
| Source file provided or file watcher event | Read `references/ingest.md`, then `references/conventions.md` |
| User asks a question or requests analysis | Read `references/query.md`, then `references/conventions.md` |
| Cron trigger or health check request | Read `references/lint.md`, then `references/conventions.md` |
| New or empty wiki | Bootstrap: survey what exists, create initial MOC, then proceed with the triggered operation |

Always read `references/conventions.md` for Obsidian-native patterns to follow.

## Tools

This skill works with whatever tools are available. It does not require any specific MCP server or plugin, but benefits from:

- **Obsidian skills plugin** — for Obsidian-specific markdown, canvas, and bases support
- **Excalidraw MCP** — for creating architecture diagrams, relationship maps, and concept visualizations
- **File system access** — for reading sources and writing wiki pages (Read, Write, Edit tools)
- **Web search** — for filling gaps identified during lint or query
- **Search tools** — CLI search over wiki pages at larger scale (e.g., qmd, ripgrep)

Use what's available. The core workflow (read sources, write wiki pages, maintain links) works with just basic file tools.

## Scale

Index-based navigation (MOC + wikilink traversal) works well at moderate scale (~100s of sources, ~100s of pages, ~400K+ words). No RAG infrastructure needed. If the wiki outgrows index navigation, consider adding a search tool the LLM can shell out to.
