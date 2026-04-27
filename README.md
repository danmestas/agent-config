# agent-skills

Multi-harness skills monorepo for AI coding agents. Authors write skills, agents, rules, hooks, MCP configs, and plugins once in canonical `SKILL.md` format; `apm-builder` emits per-harness artifacts for **Claude Code**, **APM**, **Codex**, **Gemini CLI**, **Copilot CLI**, and **Pi**.

> **Status (2026-04-27):** All six adapters merged. Skill migrations to canonical frontmatter (Plan 7) are still pending — most pre-existing skills carry only `name` + `description` + `category` and won't yet be emitted by `apm-builder build` until they declare `version`, `type`, and `targets`. New skills authored against the canonical schema work today.

## Taxonomy

Skills and configs are tagged across an 8-axis taxonomy. See [`TAXONOMY.md`](TAXONOMY.md) for definitions, examples, and the gap analysis.

| Axis | What it is |
|---|---|
| **Economy** | Cost-shaping (output / context / cache / model) |
| **Workflow** | Forward-driving orchestration (brainstorm → spec → plan → execute) |
| **BackPressure** | Quality feedback that pulls the agent back to revisit work |
| **Tooling** | Capability extensions (new senses/abilities) |
| **Integrations** | External-service hookups |
| **ContextManagement** | Runtime session strategies (subagents, worktrees, rewinds) |
| **MemoryManagement** | Persistent cross-session memory |
| **Evolution** | Meta-skills that observe sessions and propose config updates |

## Install

### Claude Code (marketplace)

```text
/plugin marketplace add danmestas/agent-skills
/plugin install <plugin-name>@danmestas/agent-skills
```

Plugins available today: `dev-tools`, `knowledge-base`. Individual skill installs become available once Plan 7 migrates remaining skills to the canonical schema.

### APM

```yaml
# apm.yml
dependencies:
  apm:
    - danmestas/agent-skills
```

### Codex / Gemini CLI / Copilot CLI / Pi

Adapters emit native artifacts for each harness when a skill declares it in `targets:`. Run `npm run build -- --target <harness>` to generate the per-harness output under `dist/<harness>/`. Install paths follow each harness's convention.

## Categories

### Software design philosophy (BackPressure)

- [`ousterhout`](skills/ousterhout) — *A Philosophy of Software Design*: deep modules, information hiding, strategic programming, minimizing cognitive load.
- [`hipp`](skills/hipp) — D. Richard Hipp's principles (SQLite, Fossil): zero-config, embedded, simplicity, built to last decades.
- [`norman`](skills/norman) — Don Norman's interaction-design principles: affordances, signifiers, mapping, feedback, error prevention.
- [`tigerstyle`](skills/tigerstyle) — TigerBeetle's NASA Power-of-Ten safety-critical discipline: assertion-heavy development, zero technical debt.
- [`idiomatic-go`](skills/idiomatic-go) — Go style and idioms (Bodner's *Learning Go*): error handling, slices, interfaces, concurrency.
- [`dx-audit`](skills/dx-audit) — Workflow-based DX/UX scoring with weighted friction analysis and ranked improvements.

### Development tooling (Tooling)

- [`mgrep-code-search`](skills/mgrep-code-search) — Semantic code search for large codebases. Natural-language queries across code, text, PDFs, and images.
- [`apm-builder`](skills/apm-builder) — This repo's build tool itself. Validate, build, watch, scaffold, regenerate docs, run `evolve`.
- [`cloudflare-email`](skills/cloudflare-email) — Send outbound email from Cloudflare-hosted domains via REST API or Workers binding.

### Project & process (Integrations)

- [`linear-method`](skills/linear-method) — The Linear Method: plain-language issues, 4-priority system, cycles, backlog hygiene.
- [`gh-project-charter`](skills/gh-project-charter) — GitHub Projects V2 charter management: goals, scope, success criteria, change log.
- [`gh-project-setup`](skills/gh-project-setup) — Create and configure GitHub Projects V2 with template selection (kanban, bug-tracker, feature-dev, roadmap, etc.).
- [`gh-project-operations`](skills/gh-project-operations) — Daily GitHub Projects V2 operations: issue CRUD, status changes, bulk ops, CSV import/export.
- [`gh-project-shared`](skills/gh-project-shared) — Shared utilities for the `gh-project-*` skills (CLI validation, auth checks, config). Not directly invoked.

### Knowledge base (ContextManagement / MemoryManagement)

Bundled as the [`knowledge-base`](plugins/knowledge-base) plugin (install once for all 11 skills below).

- [`knowledge-base-overview`](skills/knowledge-base-overview) — Philosophy preface: the LLM writes the wiki, the human curates.
- [`vault-overview`](skills/vault-overview) — Vault scaffolding, cross-project referencing, hot cache.
- [`vault-ingest`](skills/vault-ingest) — Ingest sources (files, URLs, batches) into the vault.
- [`vault-query`](skills/vault-query) — Query across accumulated notes.
- [`vault-lint`](skills/vault-lint) — Vault hygiene checks.
- [`vault-save`](skills/vault-save) — Save query/conversation outputs back into the vault.
- [`autoresearch`](skills/autoresearch) — Autonomous research that updates the vault as it goes.
- [`defuddle`](skills/defuddle) — Strip web clutter (ads, nav, boilerplate) before ingest.
- [`obsidian-canvas`](skills/obsidian-canvas) — Visual reference layer authoring.
- [`obsidian-bases`](skills/obsidian-bases) — Obsidian Bases (.base file) authoring.
- [`obsidian-markdown`](skills/obsidian-markdown) — Obsidian Flavored Markdown authoring.

### Evolution

- [`evolution-engine`](skills/evolution-engine) — Read recent session transcripts, detect recurring friction patterns, emit unified-diff fixes against existing skills/configs/memory. CLI: `npm run evolve`.

### Integrations & data

- [`signoz-dashboard-builder`](skills/signoz-dashboard-builder) — Build SigNoz dashboards via MCP API (metrics, logs, traces, telemetry panels).
- [`datastar-tao`](skills/datastar-tao) — *The Tao of Datastar*: hypermedia philosophy, backend-owned state, SSE, DOM morphing.
- [`datastar-patterns`](skills/datastar-patterns) — Datastar UI implementation patterns: search, inline editing, infinite scroll, file upload, validation, polling.
- [`apple-contacts`](skills/apple-contacts) — Apple Contacts CRUD via the `contactbook` CLI (macOS only).
- [`atlassian-cli-jira`](skills/atlassian-cli-jira) — Manage Jira Cloud via Atlassian CLI (`acli`): search, create, edit, transition, bulk ops, sprints.
- [`deterministic-simulation-testing`](skills/deterministic-simulation-testing) — Collapse distributed systems into single-threaded simulations: BUGGIFY fault injection, VOPR patterns.
- [`doppler`](skills/doppler) — Migrate `.env` files to Doppler secrets management; multi-environment configs.
- [`midscene-testing`](skills/midscene-testing) — Screenshot-driven browser smoke testing via Midscene's headless Puppeteer mode.

## Components

The table below is regenerated from canonical `SKILL.md` frontmatter via `npm run docs`. It reflects only the components that already conform to the full canonical schema (`name` + `version` + `type` + `targets`). Plan 7 migrates remaining skills.

<!-- AUTO-GENERATED: COMPONENTS -->
| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
<!-- /AUTO-GENERATED: COMPONENTS -->

## Building

```bash
npm install
npm run validate -- --filter <name>     # validate one component
npm run build -- --target claude-code   # build Claude Code artifacts
npm run watch -- --target claude-code   # rebuild on change
npm run docs                            # regenerate the components table above
npm run init -- my-skill --type skill   # scaffold a new component
npm run evolve -- --since 7d --dry-run  # detect friction patterns in session history
npm test                                # run apm-builder unit tests
```

Available `--target` values: `claude-code`, `apm`, `codex`, `gemini`, `copilot`, `pi`, or `all`.

`npm run docs` only rewrites the region between `<!-- AUTO-GENERATED: COMPONENTS -->` and `<!-- /AUTO-GENERATED: COMPONENTS -->`. Everything outside the markers — including the categorized list above — is hand-written and preserved across regenerations.

## Architecture

For the full build-tool reference, read [`skills/apm-builder/SKILL.md`](skills/apm-builder/SKILL.md). For the design rationale, see [`TAXONOMY.md`](TAXONOMY.md).

The canonical source format is one `SKILL.md` per component with YAML frontmatter:

```yaml
---
name: my-skill
version: 1.0.0
description: Use when [describe triggering conditions in one sentence]
type: skill
targets: [claude-code, apm, codex, gemini, copilot, pi]
category:
  primary: tooling
  secondary: [economy]
---

(skill body)
```

Per-harness emission honors a compatibility matrix (see [`apm-builder/lib/validate.ts`](apm-builder/lib/validate.ts)) — not every component type works on every harness. The validator rejects incompatible combinations and warns on best-effort ones.

Component types: `skill`, `plugin`, `hook`, `agent`, `rules`, `mcp`. See [`apm-builder/lib/types.ts`](apm-builder/lib/types.ts) for the full manifest shape.

## Contributing

- Branch from `main` and open a PR — direct pushes to `main` are not accepted.
- Run `npm test` and `npx tsc --noEmit` before pushing; both must be green.
- Keep commit messages focused and imperative (e.g., `feat(apm-builder): ...`, `docs: ...`).
- Do not include AI-tool attribution in commit messages or PR bodies.
- New skills follow the `kebab-case` directory convention under `skills/`. Plugins live under `plugins/`. See [`AGENTS.md`](AGENTS.md) for repo-level guidelines.

## License

[MIT](LICENSE).
