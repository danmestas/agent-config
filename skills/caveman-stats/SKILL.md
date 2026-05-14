---
name: caveman-stats
version: 1.0.0
targets: [claude-code]
type: skill
description: >-
  Use when the user invokes /caveman-stats or asks for caveman token-usage
  stats. Shows real token usage and estimated savings for the current
  session, read directly from the Claude Code session log — no AI
  estimation. Output is normally injected by the upstream mode-tracker
  hook; without that hook the model should explain that hook integration
  is required.
category:
  primary: economy
license:
  upstream: MIT
  source: https://github.com/JuliusBrussee/caveman@63a91ec
  path: skills/caveman-stats/SKILL.md
---

# Caveman Stats

This skill is normally delivered by `hooks/caveman-stats.js` (read by `hooks/caveman-mode-tracker.js` on `/caveman-stats`) from the upstream caveman pack. The model does not need to compute anything when this skill fires — the hook returns `decision: "block"` with the formatted stats as the reason. The user sees the numbers immediately.

If the upstream hooks are not installed in this environment, surface that fact: tell the user that `/caveman-stats` reports real token counts from the Claude Code session log and requires the upstream hook to be active. Point them at the upstream caveman installer: https://github.com/JuliusBrussee/caveman
