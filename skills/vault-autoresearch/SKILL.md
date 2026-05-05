---
name: vault-autoresearch
version: 0.2.0
description: >-
  Use when iteratively researching a topic and filing the synthesis into an
  Obsidian vault for later ingestion. Output goes to `<vault>/.raw/` (NOT
  directly into wiki pages) so that `vault-ingest` can process it on its own
  schedule. Triggers: '/vault-autoresearch', 'autoresearch [topic]', 'research
  [topic] into the vault', 'deep dive into [topic]', 'find everything about
  [topic] for the vault', 'research and stage'.
type: skill
targets:
  - claude-code
category:
  primary: memory-management
  secondary:
    - tooling
---

# vault-autoresearch: Iterative Research, Staged for Ingestion

You are a research agent. You take a topic, run iterative web searches, synthesize findings, and **stage the raw output under `<vault>/.raw/`** for later ingestion. You do NOT write directly to wiki pages — that's `vault-ingest`'s job, on its own schedule.

This is the separation of concerns:

- **vault-autoresearch produces material.** Web searches, fetches, synthesis. Output lands in `<vault>/.raw/<topic-slug>/`.
- **vault-ingest produces wiki pages.** Reads `.raw/`, decides what becomes a source page / concept page / entity page, places into `wiki/sources/`, `wiki/concepts/`, `wiki/entities/`, `wiki/questions/`.

Don't conflate the two. If you find yourself writing to `wiki/` directly, stop — that's vault-ingest's surface, not yours.

---

## Before Starting

Read `references/program.md` to load research objectives and constraints. This file is user-configurable: source preferences, confidence-scoring rules, max rounds, max pages, domain-specific instructions. Honor it.

---

## Research Loop

```
Input: topic (from user command)

Round 1. Broad search
1. Decompose topic into 3-5 distinct search angles
2. For each angle: run 2-3 WebSearch queries
3. For top 2-3 results per angle: WebFetch the page
4. Extract from each: key claims, entities, concepts, open questions

Round 2. Gap fill
5. Identify what's missing or contradicted from Round 1
6. Run targeted searches for each gap (max 5 queries)
7. Fetch top results for each gap

Round 3. Synthesis check (optional, if gaps remain)
8. If major contradictions or missing pieces still exist: one more targeted pass
9. Otherwise: proceed to filing

Max rounds: 3 (per program.md). Stop when depth is reached or max rounds hit.
```

---

## Filing to `.raw/`

Output goes to `<vault>/.raw/<topic-slug>/`. Slug the topic (lowercase, hyphens, no punctuation): "Karpathy autoresearch pattern" -> `karpathy-autoresearch-pattern`.

Inside the topic directory, write one markdown file per fetched source plus one synthesis file. Each file carries frontmatter so vault-ingest can parse it:

```markdown
---
type: raw-source           # or "raw-synthesis"
source_url: https://...    # for raw-source
fetched_at: 2026-05-04T14:23:00Z
autoresearch_run: <run-id> # ULID or timestamp-slug
topic: karpathy-autoresearch-pattern
title: "Page title"
author: "Author if known"
date_published: "2024-08-12"   # if discoverable
key_claims:
  - "Claim 1"
  - "Claim 2"
confidence: high | medium | low
---

# {title}

{Body: summary of what the source contributes, plus extracted excerpts. Do
not paraphrase the whole page — capture the load-bearing claims and quote
key passages verbatim where they matter.}
```

The synthesis file is `<vault>/.raw/<topic-slug>/_synthesis.md` (underscore prefix sorts it first):

```markdown
---
type: raw-synthesis
autoresearch_run: <run-id>
topic: karpathy-autoresearch-pattern
created: 2026-05-04
rounds: 2
sources_fetched: 7
---

# Synthesis: {Topic}

## Overview
2-3 sentence summary.

## Key Findings
- Finding 1 (source: <filename-without-extension>)
- Finding 2 (source: <filename-without-extension>)

## Entities
- Entity name — role/significance

## Concepts
- Concept name — one-line definition

## Contradictions
- Source A says X. Source B says Y. Brief credibility note.

## Open Questions
- Question that research didn't answer
- Gap that needs more sources
```

References between raw files are by **filename**, not wikilink syntax — wikilinks are a wiki-page concept and `vault-ingest` translates them when it materializes pages.

---

## After Filing

Append a one-line breadcrumb to `<vault>/.raw/_log.md` (create if missing):

```
## [YYYY-MM-DD HH:MM] vault-autoresearch | <topic>
- Run: <run-id>
- Rounds: N | Sources: N
- Path: .raw/<topic-slug>/
- Status: ready-for-ingest
```

Do **not** touch `wiki/index.md`, `wiki/log.md`, `wiki/hot.md`, or anything under `wiki/`. That's vault-ingest's surface.

---

## Report to User

```
Research staged: <topic>

Rounds: N | Searches: N | Sources fetched: N

Staged at:
  <vault>/.raw/<topic-slug>/
    _synthesis.md
    <source-1>.md
    <source-2>.md
    ...

Key findings:
- Finding 1
- Finding 2
- Finding 3

Open questions filed: N

Run `vault-ingest` (on its own schedule) to materialize wiki pages.
```

---

## Constraints

Honor `references/program.md`:
- Max rounds (default: 3)
- Max sources per session (default: 15)
- Confidence scoring rules
- Source preference rules

If a constraint conflicts with completeness, respect the constraint and note what was left out in Open Questions.

---

## FUTURE WORK

This skill needs work — the output schema for `.raw/` files isn't fully formalized, and `vault-ingest` handles it loosely today. Iterate as the pipeline matures. In particular: the `key_claims` shape, how to encode source-of-source links between raw files, and whether `_synthesis.md` should be one file or split per round are all open questions. The shape above is the current best guess, not the final answer.
