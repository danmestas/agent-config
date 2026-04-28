# Contributing to agent-config

Thanks for your interest in `agent-config`, a multi-harness configuration
monorepo for AI agent skills, plugins, hooks, agents, and MCP integrations
across 6 platforms (Claude Code, APM, Codex, Gemini CLI, Copilot CLI, Pi).

## Development setup

Requires Node 20 or newer.

```
git clone https://github.com/danmestas/agent-config
cd agent-config
npm install
npm run validate
```

`npm run validate` checks that all components conform to the canonical
schemas documented in `TAXONOMY.md` and `CONVENTIONS.md`.

## Running tests

```
npm test            # full vitest suite
npm run smoke       # smoke tests only
npm run typecheck   # tsc --noEmit
npm run test:watch  # watch mode
```

`npm test` and `npm run validate` together form the canonical pre-PR gate.

## Building

```
npm run build       # transpile components for all 6 harnesses
npm run watch       # rebuild on change
npm run docs        # regenerate component docs
```

The transpiler in `apm-builder/` reads canonical-format components and
emits per-harness artifacts under `dist/` and `marketplace/`.

## Component types

- `skills/` — skills (canonical `SKILL.md` format).
- `plugins/` — plugin components.
- `hooks/` — hook scripts.
- `agents/` — subagent definitions.
- `apm-builder/` — transpiler and validation tooling.
- `marketplace/` — published artifacts.

## Adding a new component

1. Pick the right type directory.
2. Follow the canonical schema documented in `TAXONOMY.md` and `CONVENTIONS.md`.
3. Run `npm run validate` to verify schema compliance.
4. Run `npm test` for any cross-cutting tests.
5. Run `npm run build` to confirm the transpiler emits all six harness
   variants without errors.

## Submitting changes

1. Open a feature branch off `main`. Direct commits to `main` are not accepted.
2. Run `npm run validate`, `npm test`, and `npm run typecheck` locally
   before pushing.
3. Open a PR; CI will re-run validation, tests, and typecheck.

## Reporting issues

Open an issue at https://github.com/danmestas/agent-config/issues with
reproduction steps and which target harness is affected (Claude Code, APM,
Codex, Gemini CLI, Copilot CLI, or Pi).
