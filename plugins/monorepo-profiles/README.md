# monorepo-profiles

Atomic profile switching for Claude Code in monorepos. Define a profile per
sub-stack (frontend, backend), commit it, and `/profile switch <name>` swaps
MCP servers, permissions, plugins, skills, agents, and supplementary
instruction fragments.

See `docs/superpowers/specs/2026-04-29-monorepo-profiles-design.md` for the
v0.1 design and `docs/superpowers/specs/2026-04-29-monorepo-profiles-v0.2-design.md`
for v0.2 (`/profile validate`, `/profile diff`, JSON Schema, drift detail).

## Repository placement

This plugin lives under `agent-config/plugins/` but is **harness-specific by design** —
unlike sibling skill bundles, it has no `SKILL.md`, is not transpiled by `apm-builder`,
and ships only a Claude Code shell (`commands/`, `hooks/`, `bin/mr-profile.mjs`). The
core script (`bin/mr-profile.mjs`) is harness-agnostic Node ESM and could be invoked
from a Cursor/Codex/Gemini hook in the future, but no such adapters ship today.

The standalone marketplace.json was removed when this plugin was vendored into
`agent-config`; install it via the agent-config plugin pipeline (or copy the dir
into `~/.claude/plugins/cache/` for local dev).

## Editor schema setup (optional)

The plugin ships a JSON Schema for profile files. To get autocomplete, hover docs,
and typo detection in VS Code or Cursor, add to `.vscode/settings.json` in your
monorepo:

```json
{
  "json.schemas": [
    {
      "fileMatch": [".claude/profiles/*.json"],
      "url": "/absolute/path/to/monorepo-profiles/.claude-plugin/profile.schema.json"
    }
  ]
}
```

The plugin's install path is shown by `/plugin` in Claude Code. For team-shareable
editor config, copy the schema into your repo (e.g. to `.claude/profile.schema.json`)
and commit it.
