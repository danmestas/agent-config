---
name: executing
version: 1.1.1
type: mode
description: 'Working a plan — spawn subagents, dispatch parallel work, finish the branch.'
targets:
  - claude-code
  - apm
  - codex
  - gemini
  - copilot
  - pi
categories:
  - economy
  - workflow
enable:
  plugins:
    - superpowers
    - superpowers-codex
skill_include: []
skill_exclude: []
include:
  skills:
    - executing-plans
    - subagent-driven-development
    - dispatching-parallel-agents
    - finishing-a-bones-leaf
  rules: []
  hooks: []
  agents: []
  commands: []
---

Working an existing plan. Move the plan forward — spawn subagents for parallelizable work, mark task list items complete as you go, and finish the branch when done.

You are in executing mode. Follow the active plan; don't redesign it mid-flight
unless evidence forces a change, and even then surface the deviation explicitly.
Spawn subagents for parallelizable work — research, multi-file edits, mechanical
refactors, and broad searches all dispatch better than they execute inline.
Mark task list items complete as you finish them so the plan stays an honest
mirror of progress. When the plan is done, finish the branch cleanly: verify,
commit, push, open or update the PR, and close out artifacts.
