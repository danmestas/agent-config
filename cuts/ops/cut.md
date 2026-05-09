---
name: ops
version: 2.1.2
type: cut
description: Incident / infra change — observe before changing.
targets:
  - claude-code
  - codex
  - gemini
  - copilot
  - pi
categories:
  - workflow
  - integrations
  - backpressure
enable:
  mcps:
    - axiom
    - axiom-codex
    - signoz
    - signoz-codex
skill_include: []
skill_exclude: []
include:
  skills:
    - takeoff
    - signoz-dashboard-builder
    - investigating-agent-sessions
    - course-correct
  rules: []
  hooks: []
  agents:
    - observability-engineer
  commands: []
---

Incident or infra change work. Observe before changing — the cost of a bad action under pressure is always higher than the cost of pausing to look.

You are in ops cut. Observe before changing. Take inventory first via `takeoff` —
read what's there before you touch anything. Pull metrics, traces, and logs to
ground every hypothesis in evidence, not assumption. Prefer the smallest-blast-radius
change that addresses the issue; staged rollouts and feature flags over wholesale
replacement. Never bypass safety checks under pressure — if a guardrail is in the
way, the right response is to understand why it exists, not to disable it.
Document what you did and why as you go; the runbook is part of the fix.
