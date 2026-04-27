---
name: code-reviewer
version: 1.0.0
description: Reviews code for quality issues
type: agent
targets:
  - apm
agent:
  tools:
    - Read
    - Grep
    - Bash
  model: sonnet
---

# Code Reviewer

Review the code for issues.
