---
name: description-linter
version: 0.1.0
description: >
  Use when the user types "lint my skills", "check skill descriptions", "/lint-skills",
  "validate skill triggers", "audit skill descriptions", or asks whether two skills
  conflict on the same prompt. Also fires PostToolUse on edits to any skills/*/SKILL.md.
  Static-analyzes SKILL.md frontmatter for trigger quality, length, naming, and
  cross-skill conflicts. Does NOT auto-fix — only reports.
type: skill
targets:
  - claude-code
category:
  primary: evolution
---

# description-linter

A static analyzer for `description` fields in `skills/*/SKILL.md`. Reports issues; does not fix.

## When to invoke

- User explicit: `/lint-skills`, "lint descriptions", "audit my skills".
- Auto-firing: PostToolUse on any edit to `skills/*/SKILL.md`.

## Lint rules

For each skill:

### 1. Trigger phrases present

The description must contain at least:
- One **verb** indicating an action ("create", "build", "review", "find", "lint", "test", "manage").
- Two **concrete user phrases** in quotes or otherwise clearly demarcated, e.g., `"/lint-skills"`, `"check my skills"`. Quoted phrases survive the harness's matching better than abstract descriptions.

If the description is purely abstract ("skill for design philosophy") with no quoted/concrete phrases → **flag**.

### 2. Length cap

- **Hard cap: 800 chars.** Anything longer almost certainly hurts trigger reliability — the harness's relevance scoring is dominated by the first sentence in long descriptions, and the rest is noise.
- **Soft cap: 500 chars.** Above 500 → warn ("trim or split"). The strongest descriptions in this repo are 200-450 chars.

### 3. Name shape

- Must be `kebab-case` (already enforced by Zod schema in `apm-builder/lib/schema.ts`, but call it out so the user sees the rule.)
- Must be ≤4 words / ≤30 chars. Long names are a smell — usually mean the skill does too much.

### 4. Conflict check (the load-bearing rule)

For every pair of skills (A, B):
- Extract the trigger phrases from each (the substrings inside `"..."`, the verbs, and the slash-commands).
- If 2+ trigger phrases match between A and B → **flag conflict.**

The fast check is a one-liner; the agent can run:

```bash
grep -E '"[^"]{3,40}"' skills/*/SKILL.md | sort | uniq -c | sort -rn | head -30
```

The phrases that show up in 2+ skills are conflict candidates. Manually verify each before flagging — generic words like "skill" or "use" are noise.

## Output format

Print one block per affected skill:

```
description-linter: skills/<name>/SKILL.md
  WARN  length          612 chars (soft cap 500)
  FAIL  no-trigger      no quoted concrete phrase found
  WARN  conflict        shares trigger "review code" with skills/<other>
        Resolution: tighten one description to disambiguate (e.g., "review Go code" vs. "review TS code").
```

Roll-up at the bottom:

```
----
27 skills checked. 2 FAIL, 4 WARN, 21 OK.
```

## Anti-patterns

- **Do NOT auto-fix descriptions.** This skill is for *humans to read*. Auto-rewriting trigger phrases is destructive — the human knows their own use case better than a generic rule.
- **Do NOT block commits.** Even on auto-fire (PostToolUse), output is informational. Hooks should not refuse the edit.
- **Do NOT lint plugins or hooks the same way as skills.** Plugins are bundles (description matters less) and hooks are event-driven (no description-matching at all). Restrict the trigger-phrase rules to `type: skill`.
- **Don't be cute about ambiguity.** If two skills genuinely overlap but the user wants both (e.g., `vault-overview` and `knowledge-base-overview` reference each other), flag once and let the human dismiss.

## See also

- `apm-builder/lib/schema.ts` — kebab-case enforcement (already-running ground truth).
- `skills/skill-eval-runner/SKILL.md` — the dynamic complement (does the description actually trigger?).
- `skills/evolution-engine/SKILL.md` — sibling that proposes diffs against descriptions when triggers are observed-failing.
