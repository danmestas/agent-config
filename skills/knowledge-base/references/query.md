# Query Workflow

Answer questions, generate analysis, and produce outputs from the wiki. This workflow runs when the user asks a question or requests analysis against the knowledge base.

## Inputs

- **Question or request:** what the user wants to know or produce
- **Wiki root:** path to the wiki directory

## Workflow

### 1. Navigate the wiki

Read the MOC/index to find relevant pages. Follow `[[wikilinks]]` from those pages to gather related context. Go as deep as needed — follow chains of links until you have enough context to answer well.

If the wiki has a search tool available (CLI or MCP), use it. Otherwise, the MOC + wikilink traversal is sufficient at moderate scale.

### 2. Synthesize

Build the answer from wiki content. Cite wiki pages using `[[wikilinks]]` so the user can trace your reasoning. If the answer requires information not in the wiki, say so — suggest sources that could fill the gap.

### 3. Choose output format

Match the format to the question:

| Question type | Format |
|---|---|
| Factual question | Direct answer with `[[citations]]` |
| Comparison | Markdown table |
| Overview/summary | Markdown page |
| Architecture/relationships | Excalidraw diagram (if available) |
| Presentation | Marp slide deck |
| Data/trends | Chart image (matplotlib or similar) |
| Timeline | Chronological markdown or diagram |

Default to markdown. Use richer formats when they genuinely serve the question better.

### 4. File valuable outputs

If the output is worth keeping — a substantive analysis, a useful comparison, a connection discovered, a synthesis that took real work — offer to file it as a new wiki page.

This is how explorations compound in the knowledge base. A question you asked last month becomes a page that informs answers to future questions.

When filing:
- Add appropriate frontmatter and tags
- Cross-link to the pages that informed the analysis
- Update the MOC
- Append to the log: `## [YYYY-MM-DD] query | Question summary → filed as [[Page Name]]`

### 5. Suggest follow-ups

Based on what you found (and didn't find), suggest:
- Related questions worth exploring
- Gaps in the wiki that new sources could fill
- Connections between pages that aren't currently linked
