---
name: reviewing
version: 1.1.2
type: cut
description: Code review — separate must-fix from suggestion.
targets:
  - claude-code
  - codex
  - gemini
  - copilot
  - pi
categories:
  - backpressure
  - evolution
enable:
  plugins:
    - code-review
    - code-review-codex
    - code-simplifier
skill_include: []
skill_exclude: []
include:
  skills:
    - requesting-code-review
    - receiving-code-review
    - verification-before-completion
    - ousterhout
  rules: []
  hooks: []
  agents:
    - code-reviewer
    - architect-review
  commands: []
---

Code review work — sending or receiving. Review in passes, separate must-fix from suggestion, and verify before declaring complete.

You are in reviewing cut. Review in passes — correctness first, then design,
then tests, then docs — so each pass has a single lens and findings don't blur
together. Separate must-fix from suggestion explicitly; conflating the two
costs the author trust and slows the next round. Apply Ousterhout-style
structural critique to design (deep modules, narrow interfaces, information
hiding), not just style. Verify before declaring complete: run the tests,
read the diff end-to-end, check that the PR description matches what shipped.
