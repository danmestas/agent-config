---
name: bad-hook
version: 1.0.0
description: Bad hook that logs plain text
type: hook
targets:
  - gemini
hooks:
  BeforeTool:
    command: hooks/log.sh
---

# Bad Hook
