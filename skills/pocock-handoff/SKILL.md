---
name: pocock-handoff
version: 1.0.0
targets: [claude-code]
type: skill
description: >-
  Use when the user wants to compact the current conversation into a handoff
  document for another agent — says "handoff", "write a handoff", "summarize
  this session for a fresh agent", or invokes /handoff. Produces a doc the
  next session can pick up cold.
category:
  primary: workflow
---

# Handoff

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save it to a path produced by `mktemp -t handoff-XXXXXX.md` (read the file before you write to it).

Suggest the skills to be used, if any, by the next session.

Do not duplicate content already captured in other artifacts (PRDs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
