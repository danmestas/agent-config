# Ingest Workflow

Process a new source document into the wiki. This workflow runs when a source is provided, a file watcher fires, or the user asks to ingest something.

## Inputs

- **Source:** path to the document to ingest (article, paper, notes, data, image)
- **Wiki root:** path to the wiki directory

## Workflow

### 1. Read the source

Read the full source document. If it references images, note them for separate viewing.

For different source types:
- **Markdown/text:** read directly
- **PDF:** read with PDF support, note page numbers for citations
- **Images:** view and describe; these may be the primary content (diagrams, charts, screenshots)
- **Code/repos:** focus on README, architecture docs, key interfaces

### 2. Survey the wiki

Read the MOC/index if one exists. Scan page titles and frontmatter to understand:
- What topics are already covered
- What entities and concepts have pages
- What structure and conventions are in use
- What tags are in use

If the wiki is empty or new, note this — you'll bootstrap structure as you ingest.

### 3. Extract and identify

From the source, identify:
- **Entities:** people, projects, organizations, tools, specific things with names
- **Concepts:** ideas, patterns, principles, techniques, theories
- **Claims:** specific assertions, data points, findings, conclusions
- **Relationships:** how entities and concepts connect to each other and to existing wiki content

### 4. Update the wiki

For each extracted item:

**If a wiki page already exists:**
- Update it with new information from this source
- Add the source to the page's `sources` frontmatter
- Flag any contradictions: "Source A claims X, but Source B claims Y"
- Add new cross-references to related pages

**If no wiki page exists:**
- Create a new page with frontmatter, content, and `[[wikilinks]]` to related existing pages
- Use the conventions in `references/conventions.md`

A single source typically touches 10-15+ wiki pages. This is expected.

### 5. Update the MOC

Add new pages to the MOC with one-line summaries. Create the MOC if this is the first ingest. Reorganize MOC sections if the new content shifts the wiki's structure.

### 6. Update the log

Append an entry:
```
## [YYYY-MM-DD] ingest | Source Title
- Created: [[Page A]], [[Page B]], [[Page C]]
- Updated: [[Page D]], [[Page E]]
- Contradictions found: [brief description, if any]
- Source location: path/to/source
```

Create the log if this is the first ingest.

### 7. Report

Summarize what happened:
- Pages created (with links)
- Pages updated (with what changed)
- Contradictions found
- Suggestions for follow-up (related sources to look for, questions raised)

## Headless operation

When triggered by a file watcher with no human in the loop:
- Follow the full workflow above
- Make conservative choices (don't reorganize large sections of the wiki)
- Log everything — the human reviews the log later
- If a source is ambiguous or contradicts existing content significantly, note it in the log rather than making a judgment call
