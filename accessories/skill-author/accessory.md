---
name: skill-author
version: 1.0.0
type: accessory
description: Skill authoring + evaluation toolkit.
targets: [claude-code, apm, codex, gemini, copilot, pi]
include:
  skills: [skill-creator, skill-development, description-linter, skill-eval-runner, skill-gap-detector]
  rules: []
  hooks: []
  agents: []
  commands: []
---

# Skill Author Accessory

Layer this when working in `wardrobe/`, `agent-skills/`, or `suit/`. Pulls the skill-creator pipeline (skill-creator + skill-development) plus description-linter (for triggering quality) and skill-eval-runner (for measuring before/after performance), with skill-gap-detector to surface candidates that don't yet exist.

The bundle is the full author loop: scaffold a skill, write its description, lint the description against trigger heuristics, run an eval, and detect gaps in the surrounding catalog. Loading the five together avoids the rediscovery tax every time you switch from authoring to evaluation.

Pair with the relevant outfit (e.g. `engineering` for general dev or a wardrobe-specific outfit when one exists). Don't layer this on `kb` or other consumer outfits — it's a producer toolkit.
