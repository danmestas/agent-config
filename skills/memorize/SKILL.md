---
name: memorize
version: 0.1.0
description: >
  Use when the user types "/memorize", "save this learning", "make this an ADR",
  "capture this for future sessions", "remember this", "write this down for next time",
  or "save that proposal". Also auto-fires after /reflect when the user expresses
  agreement with a proposal. Converts a recent insight or reflection into either
  a project ADR or a personal memory entry. Always confirms content with the user
  before writing.
type: skill
targets:
  - claude-code
category:
  primary: memory-management
  secondary: [evolution]
---

# memorize

Persists a learning. Pairs with `reflect`: reflection produces proposals, memorize converts agreed proposals into durable artifacts.

## When to invoke

- User explicit: `/memorize`, "save that", "make it an ADR", "remember this for next time".
- Auto-firing: immediately after `/reflect` if the user replies with agreement (e.g., "yes do that", "ship it", "good, save it"). The agent picks up the most-recently-agreed proposal.

## Two output forms

The skill writes ONE of two file shapes, chosen by scope:

### Form A: Project ADR (project-scoped lessons)

For learnings that belong with the codebase — "this repo's commit hooks expect signed commits", "this codebase's tests need DB seeded first", etc.

- Path: `<repo-root>/docs/adr/<YYYY-MM-DD>-<topic-slug>.md`
- ONLY write here if `<repo-root>/docs/adr/` already exists.
- If it doesn't exist, **propose** creating it: tell the user "this lesson is project-scoped but `docs/adr/` doesn't exist; want me to create it?" Wait for explicit yes before mkdir.

ADR format:

```markdown
# <YYYY-MM-DD>: <Topic>

## Context

One paragraph: what situation surfaced this lesson.

## Decision

What we decided / what the rule is going forward.

## Consequences

What this implies for future contributors.

## Provenance

- Source: `/reflect` on <date> | inline insight from session <id>
- Related files: <list>
```

### Form B: Personal memory (cross-project lessons)

For learnings about *the user* — preferences, recurring frustrations, principles — that should travel with the user across all projects.

- Path: `~/.claude/projects/<project>/memory/feedback_<topic>.md`
- This is compatible with the existing auto-memory system; the runtime indexes these and surfaces them in MEMORY.md.

Memory format:

```markdown
# <Title — short, declarative>

<2-4 sentence body explaining the lesson, in the user's voice as much as possible.
Include the trigger phrase that caused the lesson if there is one.>

## When this applies

- <bullet: trigger condition 1>
- <bullet: trigger condition 2>

## Source

- Session: <id or date>
- Related: <reflection path if applicable>
```

## Workflow

1. Identify what to memorize:
   - From `/reflect` proposals: the user agreed to a specific proposal. Pull its text verbatim.
   - From inline insight: read recent conversation and synthesize one paragraph.

2. Decide scope (Form A vs Form B):
   - Mentions a specific file/path/command in the current repo → Form A.
   - About preferences, principles, recurring user friction → Form B.
   - Ambiguous → ask the user.

3. **Show the file content to the user before writing.** Render the proposed content in the chat. Get explicit confirmation. Edit if requested.

4. Write the file. Print the path.

## Anti-patterns

- **Don't write without showing first.** Always preview, get confirmation, then write.
- **Don't make it both forms.** One memorize call = one file. If something is both project-scoped AND personal, propose two memorize calls explicitly.
- **Don't memorize trivia.** "We used grep today" is not a lesson. Lessons must include a *generalizable* rule.
- **Don't expand beyond one topic per file.** Multiple lessons get multiple files.

## See also

- `skills/reflect/SKILL.md` — the upstream that surfaces what to memorize.
- `skills/evolution-engine/SKILL.md` — finds *recurring* friction; memorize captures *one* lesson at a time.
- `~/.claude/projects/<project>/memory/MEMORY.md` — the auto-memory index where Form B entries appear.
