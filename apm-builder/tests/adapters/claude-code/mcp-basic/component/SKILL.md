---
name: my-mcp
version: 1.0.0
description: A custom MCP server
type: mcp
targets:
  - claude-code
mcp:
  command: node
  args:
    - server.js
  env:
    LOG_LEVEL: debug
---

# My MCP

Server description.
