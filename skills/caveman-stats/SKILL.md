---
name: caveman-stats
version: 1.0.0
targets: [claude-code]
type: skill
description: >-
  Use when the user invokes /caveman-stats or asks for caveman token-usage
  stats. Shows real token usage and estimated savings for the current
  session, read directly from the Claude Code session log — no AI
  estimation. Output is injected by the `caveman-mode-tracker` hook
  (vendored alongside this skill), which intercepts the slash command and
  returns the formatted stats as a blocked-decision reason.
category:
  primary: economy
license:
  upstream: MIT
  source: https://github.com/JuliusBrussee/caveman@63a91ec
  path: skills/caveman-stats/SKILL.md
---

# Caveman Stats

This skill is delivered by the `hooks/caveman-mode-tracker` hook, which intercepts `/caveman-stats` on `UserPromptSubmit` and runs the bundled `caveman-stats.js` against the active Claude Code session transcript. The hook returns `decision: "block"` with the formatted stats as the reason — the user sees real token counts and estimated savings immediately, and the model never has to compute or estimate anything.

Numbers come from the JSONL session log on disk:

- `output_tokens` and `cache_read_input_tokens` summed across every assistant turn.
- Estimated savings derived from the mean per-task ratio recorded in `caveman-stats.js` (`COMPRESSION` table — currently only `full` mode has benchmark data; other modes report no estimate).
- Lifetime aggregation across sessions via `/caveman-stats --all` or `/caveman-stats --since 7d`, backed by `~/.claude/.caveman-history.jsonl`.

If the hook isn't registered in the active settings, the slash command falls through to the model — surface that fact and point the user at the wardrobe `hooks/caveman-mode-tracker` component (or the upstream installer at https://github.com/JuliusBrussee/caveman).
