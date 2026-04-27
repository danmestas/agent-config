---
name: evolution-changelog
version: 0.1.0
description: >
  Use when the user types "/changelog evolution", "log this evolution", "track applied
  evolutions", "update EVOLUTION.md", or asks to record what evolution-driven changes
  have been applied to the repo. Also fires PostToolUse on `git apply` operations
  against files matching the evolution-report path pattern. Maintains the EVOLUTION.md
  changelog at the repo root, one date-section per day, one bullet per applied change.
type: skill
targets:
  - claude-code
category:
  primary: evolution
---

# evolution-changelog

Maintains `EVOLUTION.md` at the repo root: a human-readable log of which evolution-driven changes have been applied, when, and why. Closes the loop between `evolution-engine` proposals and the actual repo history.

## When to invoke

- User explicit: "log this evolution", "/changelog evolution", "update the EVOLUTION log".
- Auto-firing: PostToolUse hook on Bash invocations matching `git apply` against any path under `~/.claude/evolution-reports/` or any patch produced by `evolution-engine`.

## File location

```
<repo-root>/EVOLUTION.md
```

If it doesn't exist, create it with the header from the format example below.

## Format

```markdown
# Evolution Changelog

A log of applied evolution-driven changes to this repo. Each entry: date, signal that
fired, file changed, one-line description.

## 2026-04-27

- **stale-memory** | `~/.claude/projects/agent-config/memory/feedback_old.md` deleted | dead branch reference cleaned
- **permission-recurring** | `.claude/settings.json` allowlist | added `npm test` (approved 7×)
- **trigger-mismatch** | `skills/reflect/SKILL.md` description | added `"retro this"` after eval failure

## 2026-04-20

- **edit-thrashing** | `skills/orchestrator-mode/SKILL.md` body | clarified §7 loop after 4 reverts
```

The format is deliberately simple: `**<signal>** | <file> | <one-line description>`. No prose; no nesting; one bullet per applied change.

## Workflow

### 1. Locate the source report

Most commonly, the latest evolution-engine output:

```
~/.claude/evolution-reports/<project>/<YYYY-MM-DD>.md
```

Read its findings. Each finding has a signal name (e.g., `permission-recurring`, `stale-memory`, `edit-thrashing`) and a target file.

### 2. Determine which were *actually applied*

Cross-check against `git log` since the report's date. For each finding, check whether the proposed file change shows up in commit history. Only applied changes get logged.

(If invoked auto-firing on `git apply`, the patch path identifies the finding directly — no cross-check needed.)

### 3. Append to EVOLUTION.md

- If today's `## YYYY-MM-DD` section exists, add bullets to it.
- If not, create a new section *above* the previous one (most recent on top).
- Keep entries chronologically descending: today first, then earlier dates.

### 4. Format each bullet

```
- **<signal-name>** | <path-relative-to-repo-root-or-~/.claude> | <one-line-description-of-change>
```

Rules:
- `<signal-name>` is the exact signal from the evolution report (kebab-case).
- `<path>` is a single file or settings key, not a directory.
- `<description>` is one sentence, ≤80 chars. Imperative or past tense, consistent within a section.

### 5. Commit (if asked)

This skill writes the file. It does NOT auto-commit. The user runs `git add EVOLUTION.md && git commit` themselves, or asks the agent to.

## Anti-patterns

- **Do NOT log proposals that weren't applied.** EVOLUTION.md is the *applied* log, not the *proposed* log. The proposed log is each day's evolution-report.
- **Do NOT prose it up.** This is a changelog. One line per change. If a change needs more explanation, link to the source report or commit, don't expand inline.
- **Do NOT auto-commit.** Writing the file is one operation; committing is a different decision.
- **Do NOT delete or rewrite history.** Append-only. If a previous entry was wrong, add a correction bullet under today's date — don't edit history.

## See also

- `skills/evolution-engine/SKILL.md` — the upstream that produces the per-day reports.
- `skills/reflect/SKILL.md` + `skills/memorize/SKILL.md` — those produce ADRs/memory; EVOLUTION.md is the third artifact and tracks file-level changes.
- `EVOLUTION.md` (this repo's root) — the file maintained by this skill.
