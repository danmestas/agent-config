---
name: linear
version: 1.0.0
type: accessory
description: Linear toolkit — issue management via CLI + method etiquette.
targets:
  - claude-code
  - codex
  - gemini
  - pi
include:
  skills:
    - linear-method
    - linear-cli
  rules: []
  hooks: []
  agents: []
  commands: []
---

# Linear Accessory

Layer this when working in Linear — issue creation, project boards, cycles, scoping. Combines the etiquette/method skill with the CLI skill for hands-on issue manipulation.

`linear-method` is the judgment surface (when to file an issue, what makes a good title, how cycles fit together). `linear-cli` is the mechanical surface (the actual `acli linear` / `mcp__linear__*` calls). They pair: the method skill tells you _what_ to do, the CLI skill tells you _how_.

## MCP vs. CLI fallback

The Linear MCP server is configured **per-project**, not via a user-scope plugin — so this accessory does not declare an `enable.plugins` block. The MCP lives in either:

- The project's `.mcp.json` under `mcpServers.linear`, or
- The user's `~/.claude.json` under `projects.<path>.mcpServers.linear`.

Configure it once per project. When `mcp__linear__*` tools are loaded, `linear-cli` prefers them — they have richer schema awareness and don't shell out. When the MCP is unavailable, `linear-cli` falls back to `acli linear` shell commands, which work everywhere `acli` is installed.

If a session reports "Linear tools missing" when you expected them present, check the per-project MCP config first — that's almost always the answer.
