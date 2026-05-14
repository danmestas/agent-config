---
name: context-mode-tooling
version: 1.0.0
type: accessory
description: Use when a session will do heavy research, debugging, or analysis and you want context-mode's token-saving MCP loaded (ctx_batch_execute for gathering, ctx_search for follow-ups, ctx_execute for processing).
targets:
  - claude-code
  - codex
  - gemini
  - pi
enable:
  plugins: []
  mcps:
    - context-mode
  hooks: []
include:
  skills: []
  rules: []
  hooks: []
  agents: []
  commands: []
---

# context-mode-tooling accessory

Layer this when a session will do significant research, debugging, log analysis, or web fetches that would otherwise flood the context window. Enables the `context-mode` MCP server, which gives the agent the `ctx_*` tool surface for token-cheap gathering, search, and processing. The plugin's own SessionStart hook injects usage guidance, so no separate skill vendor is needed here.

## What this loads

- **`context-mode` MCP** — exposes the `ctx_*` tool surface (batch execute, search, execute, fetch-and-index, stats). The plugin's SessionStart hook adds the usage guidance to the system prompt automatically.

## Requires

The `context-mode` binary / plugin. Install method depends on the harness:

```bash
# Claude Code (plugin marketplace — fully automatic, includes hooks)
/plugin marketplace add mksglu/context-mode
/plugin install context-mode@context-mode

# Other harnesses (Gemini, VS Code MCP, etc.) — global npm install + per-harness MCP config
npm install -g context-mode

# MCP-only (no hooks or slash commands)
claude mcp add context-mode -- npx -y context-mode
```

See context-mode's README for the full per-harness setup (Gemini settings.json, VS Code `.vscode/mcp.json`, Cursor, etc.).

## When to use

- Multi-file research, log analysis, or codebase surveys where raw tool output would otherwise dominate the context window.
- Debugging sessions that need to grep across large outputs without paying full token cost.
- Web research that would otherwise pull entire pages via WebFetch.
- Long-running sessions where conserving tokens lets the session run further before compaction.

## Pairing

- `engineer` / `backend` / `staff-engineer` fits — sessions that benefit most from context savings on broad investigative work.
- `--cut debugging` — re-adds observability MCPs (signoz, axiom) which produce large outputs that context-mode can buffer.
- Pairs cleanly with `rtk-tooling`: rtk filters Bash output, context-mode buffers MCP and large processing output. Different layers, no overlap.
