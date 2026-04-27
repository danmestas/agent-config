---
name: recall
version: 0.1.0
description: >
  Auto-injects recent feedback memories and ADRs at session start so the agent
  has context from past learnings. Walks `~/.claude/projects/<project>/memory/`
  and `<repo>/docs/adr/` for the latest entries (default 5) and emits them as
  SessionStart additionalContext. Use when the user types "/recall", "what
  should I remember", "recent decisions", "load my memories", or asks about
  prior conclusions. Default ON; opt out by creating
  `.agent-config/recall.disabled` in the repo.
type: hook
targets:
  - claude-code
category:
  primary: memory-management
  secondary:
    - context-management
hooks:
  SessionStart:
    command: hooks/recall.sh
---

# recall

The complement to [`hooks/trace`](../trace/SKILL.md). Trace writes; recall reads.
At session start, the script walks two directories and injects up to N recent
markdown entries into the session's additional context window:

1. `~/.claude/projects/<project>/memory/feedback_*.md` — the auto-saved feedback memories.
2. `<repo-root>/docs/adr/*.md` — Architectural Decision Records, when the repo uses them.

Latest 5 entries (combined, sorted by mtime) are injected by default. The
result is rendered with the flat-line format described in [`CONVENTIONS.md`](../../CONVENTIONS.md).

## Output shape

The hook prints a single JSON object on stdout, conforming to the Claude Code
SessionStart hook protocol:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "## Recent feedback\n\n**M-001** 2026-04-25 [feedback] | `feedback_specs_local_only.md` | …\n…"
  }
}
```

If there is nothing to inject (no memory files, no ADRs, recall disabled),
the hook exits 0 with no JSON — Claude Code treats that as "no additional
context" and continues normally.

## Default ON, opt out manually

Recall is on by default for any tracked project. To disable for the current
project, create an empty file:

```bash
touch .agent-config/recall.disabled
```

Recall checks for that file on every SessionStart event and bails immediately
when it exists. The hook does NOT auto-create the disable marker — opting out
is intentional.

It also checks the per-project / global exclusion list (see
[`hooks/_lib/should-track.sh`](../_lib/should-track.sh)). Excluded directories
get no memory injection regardless of the disable flag.

## Token cost

Estimated 100-500 tokens per session, depending on memory volume. The hook
truncates each memory to its first 30 lines and caps the combined output at
roughly 4 KB. Increase `RECALL_LIMIT` (default 5) or `RECALL_LINES` (default 30)
in the environment to grow the budget; lower them to shrink it.

## Why a hook, not a daemon

Same reasoning as `trace`: a one-shot bash script that fires on a single
lifecycle event is enough. claude-mem performs vector search over an embedding
index for "relevant past memories"; we use mtime-sorted recency, which is good
enough for the prior-art-from-yesterday case that drives 80% of the value.

## See also

- [`hooks/trace/SKILL.md`](../trace/SKILL.md) — the writer counterpart.
- [`skills/memorize/SKILL.md`](../../skills/memorize/SKILL.md) — how memories get written.
- [`CONVENTIONS.md`](../../CONVENTIONS.md) — flat-line format + fail-safe rule.
