---
name: code-reviewer
version: 1.0.0
description: Reviews code for quality issues
type: agent
targets:
  - claude-code
agent:
  tools:
    - Read
    - Grep
    - Bash
  model: sonnet
  color: blue
---

# Code Reviewer

Review the code for issues.
