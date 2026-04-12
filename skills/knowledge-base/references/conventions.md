# Obsidian-Native Conventions

Patterns to follow when creating and maintaining wiki pages. These are defaults — adapt to whatever conventions already exist in a vault rather than overwriting established patterns.

## Linking

- Use `[[wikilinks]]` for all internal links, never standard markdown links
- Use `[[page name|display text]]` when the link text should differ from the page name
- Use `![[embed]]` to embed content from other pages or images
- Every page should have at least one inbound link — no orphans

## Frontmatter

YAML frontmatter on every wiki page. Common fields include `tags`, `sources`, `created`, `updated` — but the LLM decides what's useful for the domain and evolves the schema as the wiki grows.

```yaml
---
tags:
  - concept
sources:
  - "[[source page]]"
created: 2026-04-12
updated: 2026-04-12
---
```

## Tags

- Use for categorization: `#concept`, `#entity`, `#source`, `#analysis`, etc.
- Let tag taxonomy emerge from content — don't pre-define a rigid hierarchy
- Tags in frontmatter (`tags: [concept]`) are preferred over inline `#tags` for queryability

## Images and Diagrams

- Store images in a consistent location (e.g., `assets/` or alongside pages)
- Reference with Obsidian embed syntax: `![[image.png]]`
- Use Excalidraw for architecture diagrams, relationship maps, concept visualizations when the tools are available
- When ingesting sources with images: read text first, then view referenced images separately for additional context

## Index / Map of Content

- Maintain at least one MOC (Map of Content) page as the wiki entry point
- Create sub-MOCs as the wiki grows and natural categories emerge
- MOC pages list wiki pages with `[[wikilinks]]` and one-line summaries
- The LLM reads the MOC first when navigating the wiki

## Log

- Append-only chronological record of wiki operations
- Parseable entry format: `## [YYYY-MM-DD] operation | Description`
- Operations: `ingest`, `query`, `lint`, `reorganize`
- Useful for understanding wiki evolution and what's been done recently

## Page Naming

- Descriptive, title-case: `Machine Learning`, `Project Architecture`
- No date prefixes unless the page is inherently temporal (meeting notes, journal entries)
- Prefer specific names over generic: `Transformer Architecture` over `Architecture`

## Structure

- Let structure emerge — create directories and groupings as they become useful
- No prescribed hierarchy — the LLM organizes based on content
- Move pages and restructure as the wiki grows; update all wikilinks when doing so
