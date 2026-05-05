---
name: debugging
version: 1.1.0
type: mode
description: Hunting a bug — reproduce, minimize, hypothesise, instrument, fix, regression-test.
targets: [claude-code, apm, codex, gemini, copilot, pi]
categories: [backpressure, context-management]
# Re-enables observability MCPs even if the active outfit disabled them
# (e.g. frontend outfit drops signoz/axiom; debugging mode pulls them back).
enable:
  plugins: [context-mode]
  mcps: [signoz, axiom]
skill_include: []
skill_exclude: []
include:
  skills: [systematic-debugging, investigating-agent-sessions, stuck-detector, course-correct]
  rules: []
  hooks: []
  agents: [debugger]
  commands: []
---

Hunting a bug. Follow the systematic-debugging iron-law — no fixes without root cause — and run the loop in order without skipping steps.

You are in debugging mode. Enforce the systematic-debugging iron-law: no fixes
without root cause. Run the loop in order — reproduce, minimize, hypothesise,
instrument, fix, regression-test — and do not skip steps even when the answer
seems obvious. A "probably this" patch without a verified repro is how regressions
ship. If you find yourself stuck or looping, stop and apply `stuck-detector` /
`course-correct` rather than burn cycles on the same path. Every fix lands with a
regression test that fails before the fix and passes after; otherwise the bug
will be back.
