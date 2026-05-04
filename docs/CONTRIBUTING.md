# Contributing to wardrobe

Thanks for your interest in `wardrobe`, a multi-harness configuration
monorepo for AI agent skills, hooks, agents, commands, rules, and outfits/
modes/accessories across 6 platforms (Claude Code, APM, Codex, Gemini CLI,
Copilot CLI, Pi).

## Development setup

Requires Node 20 or newer.

```
git clone https://github.com/danmestas/wardrobe
cd wardrobe
npm install
npm run validate
```

`npm run validate` checks that all components conform to the canonical
schemas documented in `TAXONOMY.md` and `CONVENTIONS.md`.

## Building

```
npm run build       # transpile components for all 6 harnesses
npm run watch       # rebuild on change
npm run docs        # regenerate component docs
```

The [`suit-build`](https://github.com/danmestas/suit) transpiler reads
canonical-format components and emits per-harness artifacts under `dist/`
(gitignored). The build tool's own tests live in the suit repo; wardrobe
itself is content-only.

## Component types

- `skills/<name>/SKILL.md` — skills.
- `agents/<name>/AGENT.md` — subagent definitions.
- `hooks/<name>/HOOK.md` — hook scripts (with payload alongside).
- `commands/<name>/COMMAND.md` — slash commands.
- `rules/<name>/RULES.md` — harness-native rules.
- `outfits/<name>/outfit.md` — long-lived role bundles.
- `modes/<name>/mode.md` — work-shape overlays.
- `accessories/<name>/accessory.md` — small repeatable add-ons.

## Adding a new component

1. Pick the right type directory.
2. Follow the canonical schema documented in `TAXONOMY.md` and `CONVENTIONS.md`.
3. Run `npm run validate` to verify schema compliance.
4. Run `npm run build` to confirm the transpiler emits all six harness
   variants without errors.

## Submitting changes

1. Open a feature branch off `main`. Direct commits to `main` are not accepted.
2. Run `npm run validate` locally before pushing.
3. Open a PR; CI will re-run validation.

## Reporting issues

Open an issue at https://github.com/danmestas/wardrobe/issues with
reproduction steps and which target harness is affected (Claude Code, APM,
Codex, Gemini CLI, Copilot CLI, or Pi).
