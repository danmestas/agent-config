# Profile File Format Reference

All profile files live in `<project>/profile/` and use YAML frontmatter for metadata.

## Frontmatter Schema

Every profile file starts with:

```yaml
---
last_updated: YYYY-MM-DD
sessions: <number of interview sessions that contributed>
completeness: <percentage estimate>
---
```

Update `last_updated` and increment `sessions` after every interview session that adds content to the file. Estimate `completeness` based on how much useful material exists — 0% means empty, 100% means thoroughly covered with rich stories and details.

## experience.md

Organized by role, most recent first. Each role has three sections.

```markdown
## [Company] — [Title] ([Start] - [End])

### Raw Stories

Capture stories as told, in the user's voice. Each story is a paragraph, not a bullet point. Include context, what happened, what was hard, and what the outcome was. Preserve colorful details, emotions, and tangents — these are the raw material for resume bullets later.

- [Full story as told during interview...]
- [Another story...]

### Key Details

Structured facts extracted from stories:

- Team size: [number and composition]
- Stack: [technologies used]
- Reporting to: [if mentioned]
- Remote/hybrid/onsite: [if mentioned]
- Hands-on coding: [percentage if mentioned]
- Domain: [industry/problem space]

### Achievements (extracted from stories)

Quantified or notable outcomes surfaced during conversation. Each should trace back to a raw story above.

- [Achievement with metric if available]
- [Achievement with metric if available]
```

## philosophy.md

Organized by topic. Capture the user's actual opinions, not sanitized versions.

```markdown
## Engineering Management

- [Opinion or take, in their voice]
- [Another take]

## Technical Decision Making

- [How they think about architecture, trade-offs, etc.]

## Team Building

- [Hiring philosophy, what they look for, how they grow people]

## Hot Takes

- [Contrarian or strong opinions they expressed]
```

Topics are not fixed — add new sections as they emerge from conversation. The goal is to capture how this person thinks, not just what they've done.

## education.md

```markdown
## Formal Education

### [University Name] — [Degree] ([Graduation Date])
- Major: [field]
- GPA: [if mentioned]
- Notable: [anything interesting — research, clubs, thesis]

## Certifications

- [Cert name] — [Issuer] — [Date]

## Ongoing Learning

- [Courses, books, conferences, self-study topics]
```

## projects.md

```markdown
## [Project Name]

- **What:** [Brief description]
- **Stack:** [Technologies used]
- **Status:** [Active / Completed / Abandoned]
- **URL:** [If applicable]
- **Story:** [Why they built it, what they learned, what's interesting about it]
```

## goals.md

```markdown
## Target Roles

- [Role types they're interested in, e.g., "EM at Series A-C startup", "Senior IC at FAANG"]

## Preferences

- Location: [Remote / hybrid / specific cities]
- Company size: [Startup / mid / enterprise]
- Industry: [Preferences or dealbreakers]
- Compensation: [Range if shared]

## Dealbreakers

- [Things they won't do]

## What They Want Next

- [In their own words, what they're looking for]
```

## skills.md (Auto-Generated)

This file is regenerated after each session by analyzing all other profile files. Do not ask about skills directly.

```markdown
## Technical Skills

### Daily Drivers
Technologies mentioned repeatedly across roles with deep context.
- **[Skill]** — [Depth]. [Context from stories]. ([Date range of use])

### Proficient
Technologies used meaningfully but not as primary tools.
- **[Skill]** — [Depth]. [Context]. ([Date range])

### Familiar
Technologies mentioned but with limited story depth.
- **[Skill]** — [Depth]. [Context]. ([Date range])

## Leadership Skills

Inferred from philosophy.md and experience.md management stories.
- **[Skill]** — [Evidence from stories]
```

### Depth Classification Rules

- **Daily Driver**: Mentioned in 2+ roles, detailed stories about building with it, mentioned as go-to
- **Proficient**: Mentioned in 1-2 roles with meaningful project context
- **Familiar**: Mentioned once or only in passing, limited story depth

### Recency Rules

- Include date range of use based on role dates where the skill appeared
- Flag if last used 3+ years ago
