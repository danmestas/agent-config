---
name: evolution-engine
version: 0.1.0
description: >
  Use when the user wants to "analyze sessions", "find patterns in my agent history", "evolve
  config", "/evolve", "what's been frustrating you", or asks for automated suggestions for
  improving skills/configs based on session transcripts. Triggers on requests to surface
  recurring friction, propose allowlist additions, find stale memory, or generate diff-shaped
  recommendations against existing skills, settings, and memory files.
type: skill
targets:
  - claude-code
category:
  primary: evolution
---

# evolution-engine

Library + wrapper for the Evolution category: read recent session history, detect recurring friction patterns, propose unified diffs against existing skills, configs, and memory.

## What it does

- Reuses the **`evolution-engine`** library (formerly published as `meta-scout`):
  - 12 behavioral/structural signal detectors (edit-thrashing, error-loop, correction-heavy, repeated-instructions, negative-drift, etc.)
  - Struggle-then-success arc detection
  - Skill-catalog dedup
- Adds two `agent-skills`-specific detectors:
  - **Recurring permission prompts** → diff appending to `.claude/settings.json` `permissions.allow[]`
  - **Stale memory references** → diff deleting dead file/branch refs from memory
- Renders **unified diffs** against existing files. Does NOT auto-apply. Human reviews and runs `git apply` or hand-edits.

The split: meta-scout-style detection finds *what's wrong*; evolution-engine proposes *how to fix existing config to prevent it*.

## Usage

Once `apm-builder evolve` ships:

```bash
npm run evolve -- --since 7d --project agent-skills    # default: detect + propose
npm run evolve -- --since 14d --no-llm                 # deterministic only (skip Haiku calls)
npm run evolve -- --include-arcs                       # include arc-driven proposals
npm run evolve -- --dry-run                            # detect but don't write report
```

Until `apm-builder evolve` lands, run the underlying CLI directly:

```bash
npx evolution-engine patterns --json     # 12 signals as JSON
npx evolution-engine automation --json   # struggle-then-success arcs as JSON
```

## Cost

Default `--since 7d` run: under $0.05 (one Haiku call per detected cluster, capped at 30). `--no-llm` is fully deterministic.

The 12 signals and arc detection are deterministic — no LLM cost.

## Output

A markdown report at `~/.claude/evolution-reports/<project>/<YYYY-MM-DD>.md`:

- Summary table (pattern, count, severity, top fix)
- Findings ordered by severity (high → low), each with evidence quotes and a unified diff against the target file
- Reports stay local-only; redaction filter strips secrets and sensitive paths before render

## See also

- Spec: `docs/superpowers/specs/2026-04-27-evolution-skill-design.md` (local)
- Taxonomy: `TAXONOMY.md` (Evolution category — the closed-loop self-modification primitive)
- Library: `github.com/danmestas/meta-scout` (renaming to `evolution-engine` — separate repo PR)
- Implementation plan: forthcoming via writing-plans
