---
name: pr-policy
version: 1.0.0
description: PR rules
type: rules
targets:
  - claude-code
scope: project
after:
  - base-style
---

Open PRs against main.
