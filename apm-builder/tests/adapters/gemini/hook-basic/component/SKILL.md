---
name: tool-guard
version: 1.0.0
description: Validate tool calls before execution
type: hook
targets:
  - gemini
hooks:
  BeforeTool:
    command: hooks/before-tool.sh
  SessionStart:
    command: hooks/before-tool.sh
---

# Tool Guard

Inspects every tool call before Gemini executes it.
