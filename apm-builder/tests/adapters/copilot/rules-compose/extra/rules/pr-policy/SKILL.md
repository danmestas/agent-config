---
name: pr-policy
version: 1.0.0
description: PR rules
type: rules
targets:
  - copilot
scope: project
after:
  - base-style
---

Open PRs against main.
