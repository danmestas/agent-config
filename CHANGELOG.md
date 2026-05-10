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

### Removed

- **APM target** — frontmatter `targets:` arrays no longer include `apm`.
  Repo-level `apm:` block dropped from `suit.config.yaml`. APM was
  scaffolded but never shipped (no published packages, no consumer); the
  wardrobe stops authoring against it. Suit's apm adapter remains as
  dead code with no inputs from this repo until a follow-up PR removes
  it upstream.

### Changed

- **Copilot demoted to DIY tier.** Frontmatter `targets:` no longer
  include `copilot`. `copilot:` block dropped from `suit.config.yaml`.
  Cross-harness tool name reference (`skills/using-bones-powers/references/copilot-tools.md`)
  removed. The previously-emitted `copilot-instructions.md` artifact
  is no longer produced. To consume wardrobe content from Copilot CLI,
  follow [`docs/HARNESS_INTEGRATION.md`](docs/HARNESS_INTEGRATION.md).
- **Tiered harness support.** README and `docs/CONTEXT.md` reframed:
  - Bulletproof: `claude-code`.
  - Well-supported: `codex`, `gemini`, `pi`.
  - DIY: anything else.

### Added

- `docs/HARNESS_INTEGRATION.md` — porting guide for the DIY tier.
  Documents the frontmatter contract, composition rules, per-harness
  emission shapes for the four kept targets, and pointers into the
  upstream `suit` source as the canonical schema.
- `skills/ship-issue` — workflow skill that drives a single issue from
  triage through merged PR with one operator authorization. Captures
  the rhythm of read-and-label → agent brief → red-green TDD →
  subagent code review → local-CI parity → push → watch CI →
  squash-merge → cleanup → next-step-suggesting report. Tagged
  `primary: workflow`, `secondary: [integrations, backpressure]`.
- `skills/spy-on-session` — generic, tool-agnostic counterpart to
  `spy-on-bones-session`. Distills the four pillars of a live spy
  audit (fingerprint files before/after the tool's bootstrap, read
  the transcript JSONL as the source of truth, monitor the tool's
  event stream live before the operator drives, write classified
  findings inline as bug / inconvenience / improvement). Carries the
  same hook-protocol envelope verification, network-egress check,
  operator-coaching, idle-handling, and source-grounded reflection
  rules — without any bones-specific verbs or paths. Triggers on
  "spy on a Claude Code integration," "audit how a hook / skill /
  MCP / sidecar behaves," "find what <tool> gets wrong on
  <project>." Tools with their own spy skill (e.g.
  `spy-on-bones-session`) keep precedence; this picks up everything
  else. Tagged `primary: evolution`, `secondary: [tooling, backpressure]`.
- **Taxonomy v2: role / stack / accessory** — Phase 1+2+4+5 of the
  orchestrator-driven wardrobe rollout (see
  `docs/plans/2026-05-08-orchestrator-driven-wardrobe.md`). Adds:
  - 6 role outfits (`implementer`, `reviewer`, `planner`, `spy`,
    `orchestrator`, `quick`) — outfit now answers "who you are."
    `quick` uses the new `compose:` field (suit ≥ 0.10.0) to union
    implementer + planner + reviewer for solo flow.
  - 5 stack cuts (`go-backend`, `ts-frontend`, `python-data`,
    `infra-cloudflare`, `bones-tooling`) — cut now answers "what
    tech stack."
  - 3 project context accessories (`project-bones`,
    `project-serverdom`, `project-dagnats`) — accessory now carries
    "where you are." Prefix `project-` avoids name collision with
    the existing `bones` outfit (suit's namespace is flat).
  - `skills/orchestrator-suit` — documents the spawn loop the
    orchestrator outfit relies on: receive intent → classify → spawn
    role-shaped child via stateless `suit claude` piped through
    `harness-spawn --cmd` → monitor → cherry-pick → escalate → audit
    log. Briefs are saved artifacts under `.scion/briefs/` or
    `<workspace>/.orchestrator/briefs/`. Brief wins on conflict with
    the role outfit's standing instructions.
  - AGENTS.md gains a "Taxonomy v2" section documenting the new axes
    and the venn-diagram composition algebra. v1 domain outfits and
    postural cuts stay alive untouched; deprecation is a follow-up
    plan after 2-3 real orchestrated runs land.

  Compatible with `@agent-ops/suit` ≥ 0.10.0 (which ships the
  composer venn algebra: `+`, `-` by name, `-` by `tag:<name>`).
  Phase 3 (agent-harness `--cmd` flag) and Phase 6 (E2E proof) ship
  separately.

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
- `skills/spy-on-bones-session` bumped 0.1.0 → 0.2.0 from lessons learned
  running an end-to-end spy on `serverdom`. Adds: hook-protocol verification
  sub-phase (catches the SessionStart `--json` envelope-shape bug class
  before Phase 4); network-egress check on the bones hub process; explicit
  "JSONL-is-the-truth, tmux capture is screen buffer" stance; a high-value
  first-calls playbook (start `bones tasks watch --json` BEFORE anything
  else; enumerate every subcommand `--help`); operator-coaching block on
  REPL-only slash commands (`/doctor`, `claude doctor` TUI hangs on
  redirect); idle-operator handling so a no-show doesn't burn three
  9-minute `harness-listen` timeouts; an optional Phase 7 architectural
  reflection that mandates source-grounded path:line citations via Explore
  subagent rather than behavior-only speculation; new "What I did NOT
  exercise" section in the report template (typical spy hits ~15% of bones
  surface area). Adds 5 entries to Common mistakes table covering each
  pattern.

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
