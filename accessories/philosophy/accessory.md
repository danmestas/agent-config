---
name: philosophy
version: 1.0.0
type: accessory
description: Philosophy pack — Ousterhout, TigerStyle, Farley, HIPP, Norman, Vitaly.
targets: [claude-code, codex, gemini, copilot, pi]
include:
  skills: [ousterhout, tigerstyle, farley, hipp, norman, vitaly]
  rules: []
  hooks: []
  agents: [architect-review]
  commands: []
---

# Philosophy Accessory

Layer this when reviewing, refactoring, or making design decisions. Force-loads the six philosophy skills (Ousterhout, TigerStyle, Farley, HIPP, Norman, Vitaly) plus the architect-review agent so that judgment about code quality and architectural fit is always within reach.

The pack is opinionated by design: each skill represents a distinct lens on software design (deep modules, safety-critical discipline, continuous delivery, hardware-software co-design, user-facing affordances, debugging discipline). Loading them together gives a session a multi-perspective vocabulary for reasoning about tradeoffs.

Use this accessory on outfits where the work is design-heavy (engineering reviews, RFCs, refactor planning) rather than pure execution. For straight-line implementation work it's overkill — drop it and rely on the outfit's defaults.
