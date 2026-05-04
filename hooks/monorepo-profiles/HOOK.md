---
name: monorepo-profiles
type: hook
version: 0.1.0
description: >
  SessionStart hook that activates a per-monorepo-cwd profile. Reads
  `.claude/profiles/<name>.json` and applies MCP servers, permissions, plugin
  enables, and CLAUDE.md preambles for the active profile. Use when working in
  monorepos where different subdirectories need different Claude config.
targets:
  - claude-code
---

# monorepo-profiles hook

Profile-aware SessionStart hook for monorepos. The `mr-profile` CLI in `bin/`
implements `session-start`, `status`, `validate`, `diff`, and `switch`
subcommands; the hook invokes `session-start` on every fresh session.

Payload:

- `hooks.json` — Claude Code hook manifest.
- `bin/mr-profile.mjs` — CLI entrypoint (Node ≥20, ESM).
- `package.json` — `npm test` runs the test suite below.
- `test/` — `node --test` suite covering profile validation, loading, MCP/
  permissions/symlinks/preamble application, and the `session-start`,
  `status`, `switch`, and `diff` subcommands. Run from this directory:
  `npm test`.

The `/profile` slash command (in `commands/monorepo-profile/`) drives the
same CLI from the user side.
