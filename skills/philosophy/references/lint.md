# Lint Workflow

Health-check the wiki for consistency, completeness, and quality. This workflow runs on a cron schedule or when the user requests a review.

## Inputs

- **Wiki root:** path to the wiki directory

## Workflow

### 1. Scan the wiki

Read all wiki pages. Build a mental model of:
- All pages and their wikilinks (inbound and outbound)
- Frontmatter fields and tags in use
- The MOC structure
- The log (recent activity)

### 2. Check for issues

**Structural:**
- Orphan pages: pages with no inbound `[[wikilinks]]` (nothing links to them)
- Broken wikilinks: `[[links]]` whose target page doesn't exist
- Missing MOC entries: pages that exist but aren't listed in any MOC
- Dead-end pages: pages with no outbound links to other wiki pages

**Content:**
- Contradictions: pages that make conflicting claims about the same thing
- Stale content: claims that newer sources have superseded (check source dates)
- Thin pages: pages with minimal content that could be expanded or merged
- Duplicate coverage: multiple pages covering the same topic that should be consolidated

**Completeness:**
- Mentioned but missing: concepts, entities, or topics referenced in text but lacking their own page
- Missing cross-references: pages that discuss related topics but don't link to each other
- Source gaps: areas where the wiki's coverage is thin and new sources would help

**Consistency:**
- Frontmatter inconsistencies: pages using different field names or formats for the same metadata
- Tag inconsistencies: similar tags that should be unified (e.g., `#ml` vs `#machine-learning`)
- Naming inconsistencies: similar pages with inconsistent naming patterns

### 3. Auto-fix safe issues

Fix automatically without human input:
- Add missing cross-references where the connection is clear
- Fix broken wikilinks where the intended target is obvious (e.g., typo, renamed page)
- Standardize frontmatter format across pages
- Add orphan pages to the appropriate MOC

### 4. Report issues needing judgment

Create a lint report (can be a wiki page itself):
- Contradictions with context from both sides
- Suggested page merges or splits
- Data gaps with suggested sources to look for
- New questions the wiki raises but doesn't answer
- Candidate topics for new pages

### 5. Update the log

```
## [YYYY-MM-DD] lint | Health check
- Pages scanned: N
- Auto-fixed: [list of fixes]
- Issues found: [summary]
- Suggestions: [key recommendations]
```

## Cron operation

When triggered by a cron job with no human in the loop:
- Run the full scan and auto-fix safe issues
- Write the lint report to the wiki as a page (e.g., `Lint Report YYYY-MM-DD`)
- Log everything
- Don't make structural changes (reorganizing, merging, splitting) — flag them for human review
