---
name: skill-gap-detector
version: 0.1.0
description: >
  Use when the user wants to "find missing skills", "what skills should I have",
  "what am I explaining over and over", "/skill-gap", "audit my repeated instructions",
  or asks which skills they're missing based on session history. Also weekly cron-friendly.
  Scans recent session transcripts for "I had to explain X 3+ times" patterns and
  drafts proposed new SKILL.md files for human review. Does NOT auto-install.
type: skill
targets:
  - claude-code
category:
  primary: evolution
  secondary: [tooling]
---

# skill-gap-detector

Surfaces *missing* skills, not edits to existing ones. Pairs with `evolution-engine`: where evolution-engine proposes diffs against existing files, this proposes brand-new skills the user keeps reinventing inline.

## When to invoke

- User says "what skills am I missing", "I keep explaining X", "/skill-gap", "find gaps".
- Weekly maintenance loop (e.g., a `/loop 7d /skill-gap` cron).
- After `evolution-engine` runs and finds repeated-instruction clusters with no matching existing skill.

## Mode hint

Pass `--mode <name>` (or set `mode:` in task frontmatter) to bias the
detector toward a specific domain. The mode value is a *hint*: when set, the
agent should narrow its pattern matching to the domain's `observation_types`
(see `modes/<name>/`) and prefer drafting skills aligned with
the mode's `skills_priority` and `memory_topics`.

Example: `--mode code` favors development-leaning gap proposals (test patterns,
build-tooling, refactor workflows); `--mode design` favors UX-leaning ones
(interaction patterns, accessibility checks). When no mode is set, run on the
full pattern surface.

## How it works

1. Run the existing detector pipeline:

   ```bash
   npm run evolve -- --since 14d --json
   ```

   The `--json` output (PR #51) contains structured `repeated-instructions` clusters: each cluster is a phrase the user has typed 3+ times across sessions, with timestamps and excerpts.

2. For each cluster:
   - Cross-check the existing skill catalog (`skills/*/SKILL.md` frontmatter `description` fields). If any existing skill's description already contains 2+ of the cluster's trigger phrases, skip — it's a *triggering* problem (route to `description-linter`), not a gap.
   - Otherwise, draft a new skill scaffold.

3. For each gap, propose a name (kebab-case, ≤4 words, derived from the cluster's most-common noun phrase) and write:

   ```
   ~/.claude/evolution-reports/<project>/proposed-skills/<proposed-name>/SKILL.md
   ```

4. Print a summary to the user listing each draft path and a one-line rationale.

## Draft SKILL.md template

```yaml
---
name: <proposed-kebab-case>
version: 0.1.0
description: >
  Use when [extracted trigger phrase 1], [trigger phrase 2], or [trigger phrase 3].
  [One-line summary of what the skill should do, derived from the most recent
  cluster excerpt.]
type: skill
targets:
  - claude-code
category:
  primary: evolution   # human reviewer changes to actual category
---

# <proposed-name>

> PROPOSED — drafted by `skill-gap-detector` on <date>.
> Source: <N> repeated-instruction occurrences across <M> sessions.

## Cluster evidence

<bullet list of 3-5 verbatim user excerpts that triggered this cluster>

## Suggested body

[A short stub describing what the skill should do. Based on the agent's reading
of *what the user wanted* in the cluster excerpts, not on speculation.]

## Open questions for the human reviewer

- Is the proposed name accurate?
- Is `category.primary` correct? (Evolution drafts default to `evolution`; reviewer
  re-categorizes.)
- Should this skill replace, supplement, or hand off to <existing-skill-X>?
```

## Anti-patterns

- **Do NOT auto-install.** Drafts go under `~/.claude/evolution-reports/<project>/proposed-skills/`, not under `skills/`. The human reviews, edits, and runs `npm run init -- <name>` to formalize.
- **Do NOT mass-produce.** Cap at 5 drafts per run. If the pipeline finds more, rank by occurrence count and surface the rest as a "next 10 candidates" appendix in the summary.
- **Do NOT write the body in detail.** A stub + cluster evidence is enough. The reviewer fills in the real body.

## Output

- Per-gap directory: `~/.claude/evolution-reports/<project>/proposed-skills/<name>/SKILL.md`
- Summary printed to user: counts, paths, top 3 cluster excerpts per draft.

## See also

- `skills/evolution-engine/SKILL.md` — sibling that proposes edits to *existing* files.
- `skills/description-linter/SKILL.md` — handles the "trigger doesn't match" case.
- `skills/reflect/SKILL.md` — post-task critique that may also surface gaps.
