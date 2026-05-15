---
name: engineer-fit
version: 1.0.0
type: fit
description: 'Standard engineering tier — the superpowers workflow scaffold (no-git): plan, execute, verify, review, dispatch. Use as default for fluent engineers shipping reasonably-scoped changes.'
targets:
  - claude-code
  - codex
  - gemini
  - pi
categories:
  - workflow
  - economy
enable:
  plugins: []
  mcps: []
  hooks: []
disable:
  plugins: []
  mcps: []
  hooks: []
skill_include: []
skill_exclude:
  - ousterhout
  - tigerstyle
  - hipp
  - farley
  - norman
  - dx-audit
include:
  skills:
    - writing-plans
    - brainstorming
    - subagent-driven-development
    - systematic-debugging
    - executing-plans
    - dispatching-parallel-agents
    - verification-before-completion
    - test-driven-development
    - requesting-code-review
    - receiving-code-review
    - using-superpowers
    - writing-skills
  rules: []
  hooks: []
  agents: []
  commands: []
---

# Engineer Fit

Engineer tier. Apply the superpowers workflow: plan, execute, verify, review.

- **Plan before non-trivial code.** `writing-plans` + `executing-plans`. Trivial: plan mentally, skip the doc.
- **Test-first on behavioral surfaces.** `test-driven-development` is the default loop.
- **Verify before done.** `verification-before-completion` is the gate.
- **Dispatch subagents for parallelizable work.** Multi-file reads, mechanical refactors, broad searches via `dispatching-parallel-agents`.
- **Trust convention.** Decide implementation details unilaterally; state the call in one sentence. Surface only taste/architecture/ethics/reversibility forks.
- **Self-correct on review.** `receiving-code-review` + `requesting-code-review`.

Read `using-superpowers` once at session start. Escalate to `--fit senior-engineer` if a task demands deep design thinking.
