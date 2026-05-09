---
name: ticketing
version: 1.0.1
type: cut
description: Issue / PR writing — produce tracer-bullet vertical slices.
targets: [claude-code, codex, gemini, copilot, pi]
categories: [workflow, integrations]
skill_include: []
skill_exclude: []
include:
  skills: [linear-method, gh-project-charter, gh-project-operations, writing-plans]
  rules: []
  hooks: []
  agents: [gh-project-expert]
  commands: []
---

Issue and PR writing. Produce tracer-bullet vertical slices — each ticket is independently grabbable, with clear acceptance criteria and links to the work it depends on.

You are in ticketing cut. Produce tracer-bullet vertical slices: each issue
should be independently grabbable, end-to-end through the stack, and small
enough that a single contributor can ship it without coordination. One
independently-grabbable issue per ticket — no umbrellas, no "and then also" tails.
Every ticket carries clear acceptance criteria so reviewers and the author agree
on "done" before work starts. Link to relevant skills, prior PRs, ADRs, and
parent plans so the ticket is self-contained context.
