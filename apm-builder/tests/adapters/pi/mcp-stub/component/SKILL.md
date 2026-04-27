---
name: filesystem-mcp
version: 1.0.0
description: Filesystem MCP server (experimental on Pi)
type: mcp
targets: [pi]
mcp:
  command: node
  args:
    - server.js
  env:
    LOG_LEVEL: info
---

# Filesystem MCP

Server description.
