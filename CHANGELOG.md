# Changelog

The `wardrobe` repo (formerly `agent-config`) is a multi-harness component
monorepo without a single canonical version tag at the repo root. Components
are released through the [`suit-build`](https://github.com/danmestas/suit)
pipeline; sub-packages may carry their own tags
(e.g. `pikchr-generator@v0.2.0`).

This file tracks notable monorepo-level changes — adoption of new patterns,
harness adapter changes, taxonomy shifts. The format is loosely based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] — wardrobe layout v2

### Added

- `skills/ship-issue` — workflow skill that drives a single issue from
  triage through merged PR with one operator authorization. Captures
  the rhythm of read-and-label → agent brief → red-green TDD →
  subagent code review → local-CI parity → push → watch CI →
  squash-merge → cleanup → next-step-suggesting report. Tagged
  `primary: workflow`, `secondary: [integrations, backpressure]`.

### Changed

- `skills/idiomatic-go` superseded by `skills/golang-patterns`. The new skill
  pulls in concurrency / interfaces / generics / testing / project-structure
  reference packs from
  [jeffallan/claude-skills](https://github.com/jeffallan/claude-skills) (MIT)
  and rolls the prior idiomatic-go anti-pattern tables into
  `skills/golang-patterns/references/idiomatic-go.md`.
- `agents/golang-pro` body declares pairing with `golang-patterns` (no
  schema-level dep field exists yet — prose only).
- All outfits referencing `idiomatic-go` (backend, bones, personal, kb,
  aviation, frontend's exclude, engineer's vs-comparison prose) updated to
  `golang-patterns`.

### BREAKING

- Repo renamed: `agent-config` → `wardrobe`.
- `personas/` → `outfits/`; frontmatter `type: persona` → `type: outfit`;
  filename `persona.md` → `outfit.md`.
- `agents/<name>/SKILL.md` → `agents/<name>/AGENT.md`.
- `hooks/<name>/SKILL.md` → `hooks/<name>/HOOK.md`.
- `plugins/*/...` flattened into top-level `skills/`, `hooks/`, `commands/`,
  `agents/`. Plugin-level `.claude-plugin/manifest.json` files discarded.
- `dist/`, `marketplace/`, `.agents/`, top-level `AGENTS.md` removed (build
  artifacts now gitignored).
- `LICENSES/` collapsed into `LICENSES.md` at the repo root.
- `accessories/`, `rules/`, `commands/` introduced as top-level primitive
  directories (some empty for now with placeholder READMEs).
- Top-level docs (`CONTEXT.md`, `CONVENTIONS.md`, `TAXONOMY.md`,
  `CONTRIBUTING.md`, `SUPERPOWERS_ARCHITECTURE.md`,
  `GH_PROJECT_SETUP_GUIDE.md`) moved into `docs/`.

Compatible with `@agent-ops/suit` v0.4.0+.

## [pre-v2]

### Added

- 5 must-have subagents brought in from `wshobson/agents`.
- 6 claude-mem-inspired patterns: trace, recall, fail-safe, flat-line,
  `shouldTrackProject`, adapters+modes.
- 7 new Evolution skills: gap-detector, reflect, memorize, eval-runner,
  linter, stuck-detector, changelog.
- `career-interview` skill brought in from `agent-plugins`.
- `pikchr-generator@v0.2.0` sub-package release with idempotent release-tag
  pipeline.
