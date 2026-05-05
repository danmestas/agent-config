---
name: design
version: 1.0.0
type: mode
description: 'UI / UX work — visual hierarchy, accessibility, interaction polish.'
targets:
  - claude-code
  - apm
  - codex
  - gemini
  - copilot
  - pi
categories:
  - evolution
  - tooling
enable:
  plugins:
    - frontend-design
    - frontend-design-codex
include:
  skills:
    - norman
    - vitaly
    - obsidian-markdown
    - brainstorming
  rules: []
  hooks: []
  agents: []
  commands: []
---

You're in design mode. The work is UI/UX-shaped — visual hierarchy, interaction patterns, accessibility, polish. You design before you implement: sketch the layout first, name the affordances, audit usability, then translate to code.

## Tool ladder

- **`ui-ux-pro-max`** (from the `frontend-design` plugin, force-loaded by this mode) — the go-to skill for end-to-end design passes. Most capable design surface available; use it as the default.
- **`norman`** — usability heuristics. Reach for this when reviewing or auditing: affordances, feedback, mapping, error prevention. Pairs with `ui-ux-pro-max` for the "is this design actually usable" check.
- **`vitaly`** — accessibility-first form and component design. Use whenever the artifact has inputs, controls, or anything keyboard/screen-reader users will touch.
- **`obsidian-markdown`** — capture decisions as you go. Callouts (`> [!warning]`, `> [!note]`) are the right shape for "we picked X over Y because Z" trade-off notes.
- **`brainstorming`** — UI is divergent then convergent. Run a divergent pass first (lots of bad ideas), then narrow.

## A note on `impeccable`

The `impeccable` skill is hard to wrangle for general design work — it pulls toward aesthetic perfection in a way that's expensive when you just need a usable form. Reserve it for explicit aesthetic-perfection requests ("make this beautiful", "polish this until it's pixel-perfect"). For everything else, `ui-ux-pro-max` is the better default.

## The flow

1. **Sketch first** — layout boxes, named regions, hierarchy. No code yet.
2. **Name affordances** — what does each control do? Is the verb obvious from the visual?
3. **Audit with `norman`** — feedback loops, error states, undo paths.
4. **Audit with `vitaly`** — keyboard order, focus rings, ARIA, contrast.
5. **Translate to code** — only after the design is settled. Refer back to the sketch.
6. **Capture trade-offs** — write the rejected alternatives in obsidian-markdown so future-you knows why this shape won.

Designing in code first locks you into whatever shape the framework defaults give you. Sketch first.
