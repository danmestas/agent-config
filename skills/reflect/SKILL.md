---
name: reflect
version: 0.1.0
description: >
  Use when the user types "/reflect", "review what we just did", "critique the last task",
  "what could go better", "post-task review", "retro this", or after a meaningful task
  ships and the agent judges a structured critique would help. Produces a markdown
  reflection report at ~/.claude/evolution-reports/<project>/reflections/. Does NOT
  auto-apply changes — output is for human review.
type: skill
targets:
  - claude-code
category:
  primary: evolution
---

# reflect

A structured post-task critique. Inspired by the Reflexion pattern: the agent reasons over its own recent transcript and emits a written self-assessment with specific, actionable proposals. The output is reviewable; nothing auto-applies.

## When to invoke

- User explicit: `/reflect`, "let's retro this", "what went wrong", "critique that".
- Auto-firing: after a "meaningful task" ships. The agent decides what "meaningful" means — typical heuristics:
  - A PR was opened or merged.
  - A multi-step plan executed to completion.
  - A reported bug was fixed and verified.
  - A new skill, hook, or component landed.
- Skip for trivial single-tool tasks (one read, one edit, one shell command). Reflection on noise is noise.

## Mode hint

Accepts `--mode <name>` (or `mode:` in the task frontmatter) to bias the
critique toward a specific domain. The mode value is a *hint* for the agent:
look up `apm-builder/modes/<name>.json` and weight the critique sections
toward that domain's `observation_types` and `memory_topics`. Examples:

- `--mode code` — emphasize architecture, performance, refactor opportunities, test patterns.
- `--mode design` — emphasize affordances, feedback, mapping, accessibility.
- `--mode ops` — emphasize incident retrospection, alerting, runbook gaps, permission hygiene.

When no mode is set, run a balanced critique across all categories.

## The structured critique

Produce a markdown report with exactly these five sections, in order:

### 1. Summary

One sentence describing what was attempted.

> Built 7 Evolution-category skills under `skills/<name>/SKILL.md` and opened PR #N.

### 2. What went well

A bullet list of 2-5 items. Be specific — "tests passed" is too generic; "validate caught a bad category enum on the second skill before commit" is useful.

### 3. What didn't

A bullet list of 2-5 items. Cite the moment things went off-track:

- Quote the exact tool error or user correction.
- Identify the upstream cause (wrong assumption, missing context, skipped check).
- Note whether you noticed it yourself or the user pointed it out (the latter is worse).

### 4. Specific actionable proposals

For each "didn't go well" item, propose ONE concrete change. Each proposal must name:

- **The artifact** to change: a file path, a memory entry, a skill description, a settings.json key.
- **The diff shape**: what to add, remove, or replace. Quote enough surrounding context to be unambiguous.
- **The trigger condition**: when next time this proposal would have helped.

Example:

> **Proposal:** add `npm run validate` to the pre-commit allowlist in `.claude/settings.json` so future commits in this repo don't trigger a permission prompt for it.
>
> Trigger condition: any commit in `agent-config`. Saw this 3× this session.

### 5. Open questions

Things the agent isn't sure about. Phrase as questions for the human, not as more proposals. ("Should reflection auto-fire on PR-merged events, or wait for explicit `/reflect`?")

## Output

```
~/.claude/evolution-reports/<project>/reflections/<YYYY-MM-DD>-<topic-slug>.md
```

`<topic-slug>` is a short kebab-case description of the task, ≤4 words, derived from the conversation. E.g., `2026-04-27-evolution-skills.md`.

After writing, print the path to the user. Do not pre-apply any of the proposals.

## Pairing with `/memorize`

If the user agrees with proposals from this reflection, the `memorize` skill (auto-fired on agreement, or invoked by the user) converts the relevant proposals into durable ADRs or memory entries.

## Anti-patterns

- **No bland self-praise.** "We did a good job" with no specifics is wasted output.
- **No rumination.** Cap each section at 5 bullets. Long reflections don't get read.
- **No auto-apply.** Even obvious-looking proposals stay as proposals. The human reviews and triggers `/memorize` for the ones worth keeping.
- **No vague proposals.** "Improve error handling" fails the spec. "Wrap the Bash call at <file:line> in a try/catch and log to <path>" passes.

## See also

- `skills/memorize/SKILL.md` — converts agreed proposals into durable ADRs/memory.
- `skills/evolution-engine/SKILL.md` — does pattern-detection across sessions; reflection is per-task.
- `skills/skill-gap-detector/SKILL.md` — finds missing skills; reflection finds tactical fixes.
