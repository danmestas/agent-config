# agent-skills

Multi-harness skills monorepo for AI coding agents. Authors write skills, agents, rules, hooks, MCP configs, and plugins once in canonical `SKILL.md` format; `apm-builder` emits per-harness artifacts for **Claude Code**, **APM**, **Codex**, **Gemini CLI**, **Copilot CLI**, and **Pi**.

> **Status (2026-04-27):** All six adapters merged. All skills are on canonical frontmatter (`name` + `version` + `description` + `type` + `targets` + `category`); `npm run validate` runs cleanly across the repo and `npm run build -- --target all` emits artifacts for every harness.

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

Plugin available today: `knowledge-base`. Individual skills can also be installed directly — every skill in this repo is on the canonical schema and emits to `dist/claude-code/skills/<name>/`.

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
- [`pikchr-generator`](skills/pikchr-generator) — Generate, theme, and render technical diagrams across four engines (Pikchr, GraphViz, D2, Mermaid) with a shared 16-theme palette.

### Workflow

- [`tts-announcer`](skills/tts-announcer) — Local, offline voice announcements via Kokoro-82M. Wires `Notification` + `SubagentStop` hooks so the terminal whispers progress instead of going *bing*. Targets Claude Code and Pi.
- [`orchestrator-mode`](skills/orchestrator-mode) — Primes a host Claude Code session as the Darkish Factory pipeline orchestrator (the §7 loop, 13-role roster, escalation classifier, audit-log conventions).
- [`subagent-to-subharness`](skills/subagent-to-subharness) — Translates Agent-tool muscle memory into containerized `darkish spawn` dispatch. Decision tree, role mapping, framing examples.

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

### Frontend frameworks (Tooling)

- [`datastar`](skills/datastar) — Datastar framework intro: hypermedia, backend-driven SSE, no client framework, no build step.
- [`datastar-tao`](skills/datastar-tao) — *The Tao of Datastar*: hypermedia philosophy, backend-owned state, SSE, DOM morphing.
- [`datastar-patterns`](skills/datastar-patterns) — Datastar UI implementation patterns: search, inline editing, infinite scroll, file upload, validation, polling.

### Integrations & data

- [`signoz-dashboard-builder`](skills/signoz-dashboard-builder) — Build SigNoz dashboards via MCP API (metrics, logs, traces, telemetry panels).
- [`apple-contacts`](skills/apple-contacts) — Apple Contacts CRUD via the `contactbook` CLI (macOS only).
- [`atlassian-cli-jira`](skills/atlassian-cli-jira) — Manage Jira Cloud via Atlassian CLI (`acli`): search, create, edit, transition, bulk ops, sprints.
- [`deterministic-simulation-testing`](skills/deterministic-simulation-testing) — Collapse distributed systems into single-threaded simulations: BUGGIFY fault injection, VOPR patterns.
- [`doppler`](skills/doppler) — Migrate `.env` files to Doppler secrets management; multi-environment configs.
- [`midscene-testing`](skills/midscene-testing) — Screenshot-driven browser smoke testing via Midscene's headless Puppeteer mode.

## Components

The table below is regenerated from canonical `SKILL.md` frontmatter via `npm run docs`. Every skill, plugin, and hook in the repo conforms to the canonical schema and appears in this table.

<!-- AUTO-GENERATED: COMPONENTS -->
### backpressure

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| datastar-tao | skill | 0.1.0 | Use when building hypermedia-driven web applications, server-rendered UIs, or any frontend where the backend should own state. Use when choosing between SPA and server-driven architecture. Use when reviewing frontend code for unnecessary client-side state, optimistic updates, or client-side routing. Triggers on requests involving SSE, HTML-over-the-wire, DOM morphing, HTMX, Datastar, signals, or backend-first frontend design. | claude-code |
| dx-audit | skill | 0.1.0 | Use when evaluating developer experience or user experience, assessing usability of a CLI/SDK/API/UI, scoring project ergonomics, identifying friction in workflows, or when asked to audit DX or UX. Triggers on "DX score", "UX audit", "developer experience", "user experience", "workflow friction", "usability audit", "how hard is it to use this". | claude-code |
| hipp | skill | 0.1.0 | Use when designing libraries, modules, or data layers that must be simple, reliable, and self-contained. Use when choosing between embedded vs server-based solutions. Use when reviewing code for unnecessary complexity, dependencies, or configuration. Triggers on requests involving zero-config design, embedded systems, long-term maintainability, or first-principles thinking. | apm, claude-code, codex, copilot, gemini, pi |
| idiomatic-go | skill | 0.1.0 | Use when writing, reviewing, or refactoring Go code. Triggers on .go files, go.mod presence, or any task involving Go programming. Also use when reviewing Go code for idiomaticity, error handling, concurrency patterns, or interface design. | apm, claude-code, codex, copilot, gemini, pi |
| norman | skill | 0.1.0 | Use when designing, reviewing, or auditing user interfaces and frontend interactions. Use when evaluating UI usability, accessibility, or interaction patterns. Triggers on requests involving button placement, form design, navigation, error messages, onboarding flows, modal dialogs, or when asked to review a UI for usability. | apm, claude-code, codex, copilot, gemini, pi |
| ousterhout | skill | 0.1.0 | Use when designing modules, classes, APIs, or system architecture. Use when reviewing or refactoring code for complexity. Use when choosing between implementation approaches. Triggers on requests involving abstraction design, interface simplicity, information hiding, or reducing cognitive load. | apm, claude-code, codex, copilot, gemini, pi |
| tigerstyle | skill | 0.1.0 | Use when writing safety-critical code, systems programming, infrastructure, or when a project needs rigorous coding discipline. Triggers include requests for defensive coding, assertion-heavy development, performance-conscious design, zero-technical-debt policy, or NASA Power of Ten style rules. Also use when reviewing code for correctness, safety, or performance issues. | apm, claude-code, codex, copilot, gemini, pi |

### context-management

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| autoresearch | skill | 0.1.0 | Autonomous iterative research loop. Takes a topic, runs web searches, fetches sources, synthesizes findings, and files everything into the wiki as structured pages. Based on Karpathy's autoresearch pattern: program.md configures objectives and constraints, the loop runs until depth is reached, output goes directly into the knowledge base. Triggers on: "/autoresearch", "autoresearch", "research [topic]", "deep dive into [topic]", "investigate [topic]", "find everything about [topic]", "research and file", "go research", "build a wiki on".
 | claude-code |
| knowledge-base | plugin | 0.1.0 | Persistent, compounding knowledge base for Claude Code. Drop sources into a vault, let an autoresearch agent synthesize a living wiki, query across sessions, and keep the structure healthy. Use when the user wants persistent notes, a knowledge graph, vault management, or mentions Obsidian, "second brain", or "persistent memory".
 | claude-code |
| vault-ingest | skill | 0.1.0 | Ingest sources into the Obsidian wiki vault. Reads a source, extracts entities and concepts, creates or updates wiki pages, cross-references, and logs the operation. Supports files, URLs, and batch mode. Triggers on: ingest, process this source, add this to the wiki, read and file this, batch ingest, ingest all of these, ingest this url. | claude-code |
| vault-lint | skill | 0.1.0 | Health check the Obsidian wiki vault. Finds orphan pages, dead wikilinks, stale claims, missing cross-references, frontmatter gaps, and empty sections. Creates or updates Dataview dashboards. Generates canvas maps. Triggers on: "lint", "health check", "clean up wiki", "check the wiki", "wiki maintenance", "find orphans", "wiki audit".
 | claude-code |
| vault-overview | skill | 0.1.0 | Claude + Obsidian knowledge companion. Sets up a persistent wiki vault, scaffolds structure from a one-sentence description, and routes to specialized sub-skills. Use for setup, scaffolding, cross-project referencing, and hot cache management. Triggers on: "set up wiki", "scaffold vault", "create knowledge base", "/wiki", "wiki setup", "obsidian vault", "knowledge base", "second brain setup", "running notetaker", "persistent memory", "llm wiki".
 | claude-code |
| vault-query | skill | 0.1.0 | Answer questions using the Obsidian wiki vault. Reads hot cache first, then index, then relevant pages. Synthesizes answers with citations. Files good answers back as wiki pages. Supports quick, standard, and deep modes. Triggers on: what do you know about, query:, what is, explain, summarize, find in wiki, search the wiki, based on the wiki, wiki query quick, wiki query deep. | claude-code |
| vault-save | skill | 0.1.0 | Save the current conversation, answer, or insight into the Obsidian wiki vault as a structured note. Analyzes the chat, determines the right note type, creates frontmatter, files it in the correct wiki folder, and updates index, log, and hot cache. Triggers on: "save this", "save that answer", "/save", "file this", "save to wiki", "save this session", "file this conversation", "keep this", "save this analysis", "add this to the wiki".
 | claude-code |

### evolution

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| evolution-engine | skill | 0.1.0 | Use when the user wants to "analyze sessions", "find patterns in my agent history", "evolve config", "/evolve", "what's been frustrating you", or asks for automated suggestions for improving skills/configs based on session transcripts. Triggers on requests to surface recurring friction, propose allowlist additions, find stale memory, or generate diff-shaped recommendations against existing skills, settings, and memory files.
 | claude-code |

### integrations

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| apple-contacts | skill | 0.1.0 | Search, list, create, update, and delete Apple Contacts via the `contactbook` CLI on macOS. Look up contacts by name, phone, email, or organization. Manage contact groups. | claude-code |
| atlassian-cli-jira | skill | 0.1.0 | Use when working with Atlassian CLI (acli) to install, authenticate, and manage Jira Cloud work items/issues from the command line: search (JQL), view, create, edit, assign, transition, comment, link, watch, attach, archive/unarchive, bulk operations, and project/board/sprint discovery. | claude-code |
| cloudflare-email | skill | 0.1.0 | Use when sending outbound transactional or one-off emails from a Cloudflare-managed domain without running a mail server or paying for a mailbox provider. Triggers on needs to send email programmatically from a custom domain, send-from-my-domain requests, or replacing SMTP relays. Cloudflare Email Service is REST API + Workers only — no SMTP, so it is NOT compatible with Gmail "Send mail as", Outlook, or any SMTP client. | claude-code |
| doppler | skill | 0.1.0 | Use when migrating .env files to Doppler secrets management, setting up Doppler for a project, or when asked to secure environment variables. Triggers on .env files containing API keys, tokens, or secrets that should not be in plaintext on disk. | claude-code |
| gh-project-charter | skill | 0.1.0 | Use when creating project charters, documenting project goals/scope, defining success criteria, updating project documentation, or tracking scope changes | claude-code |
| gh-project-operations | skill | 0.1.0 | Use when adding/updating/deleting issues in projects, changing item statuses, bulk operations, archiving items, or managing project boards daily | claude-code |
| gh-project-setup | skill | 0.1.0 | Use when creating new GitHub projects, setting up project boards, configuring kanban/scrum/roadmap boards, or applying project templates. Provides context-aware template suggestions based on repository analysis and conversation. Supports 6 templates: kanban, bug-tracker, feature-development, roadmap, research, release-planning. Handles multi-repo and organization projects. | claude-code |
| gh-project-shared | skill | 0.1.0 | Shared utilities for GitHub project management. Not directly invoked by agents. Provides: gh CLI validation, authentication checking, config file management (.github/project-config.json), context detection for template suggestions, and error handling with logging. | claude-code |
| linear-method | skill | 0.1.0 | Use when creating, organizing, or prioritizing issues in Linear. Use when managing backlogs, setting up cycles, scoping projects, writing issue titles/descriptions, or deciding how to structure work in Linear. Also use when asked about Linear best practices. | claude-code |
| signoz-dashboard-builder | skill | 0.1.0 | Use when creating or updating SigNoz dashboards via the MCP API. Triggers on requests to build dashboards, add panels, visualize metrics/logs/traces in SigNoz, or debug dashboard queries that show "No Data" or "Something went wrong". Also use when working with Claude Code telemetry in SigNoz. | claude-code |

### memory-management

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| knowledge-base-overview | skill | 0.1.0 | Use when building, maintaining, ingesting into, querying, or health-checking a markdown knowledge base or wiki. Use when the user wants to compile sources into structured knowledge, maintain an Obsidian wiki, ingest documents, ask questions against accumulated research, or run health checks on interlinked markdown pages. Triggers on requests involving knowledge bases, wiki maintenance, source ingestion, research compilation, Obsidian wiki workflows, or LLM-maintained documentation. | claude-code |

### tooling

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| apm-builder | skill | 0.1.0 | Use when building, validating, or scaffolding skills in this monorepo. Triggers: "validate skills", "build apm-builder", "scaffold a new skill", "init a hook/agent/rules/plugin", "run apm-builder", or any work on the multi-harness skill emission pipeline (Claude Code, APM, Codex, Gemini, Copilot CLI, Pi targets).
 | claude-code |
| datastar | skill | 0.1.0 | Use when building web applications with Datastar — the hypermedia framework that drives frontend reactivity from the backend using HTML data-* attributes and Server-Sent Events. Triggers on Datastar, data-star, SSE-driven UI, hypermedia framework, backend-driven frontend, data-signals, data-on, PatchElements, or any Go/Python web app using Datastar SDKs. | claude-code |
| datastar-patterns | skill | 0.1.0 | Use when implementing UI patterns with Datastar — search, inline editing, infinite scroll, file upload, validation, bulk operations, polling, lazy loading, progress indicators, or keyboard shortcuts. Triggers on data-* attributes, @get/@post/@put/@patch helpers, SSE response formatting, or any "how do I do X in Datastar" implementation question. | claude-code |
| defuddle | skill | 0.1.0 | Strip clutter from web pages before ingesting into the wiki. Removes ads, navigation, headers, footers, and boilerplate: leaving clean readable markdown that saves 40-60% tokens. Triggers on: defuddle, clean this page, strip this url, fetch and clean, clean web content before ingesting, strip ads, remove clutter, clean URL content, readable markdown from URL. | claude-code |
| deterministic-simulation-testing | skill | 0.1.0 | Use when building or testing distributed systems, consensus protocols, sync engines, replicated databases, or any system with network/disk/time non-determinism. Also use when tests are flaky due to concurrency, when debugging rare heisenbugs, or when asked about simulation testing, BUGGIFY, VOPR, or fault injection strategies. | claude-code |
| mgrep-code-search | skill | 0.1.0 | Semantic code search using mgrep for efficient codebase exploration. This skill should be used when searching or exploring codebases with more than 30 non-gitignored files and/or nested directory structures. It provides natural language semantic search that complements traditional grep/ripgrep for finding features, understanding intent, and exploring unfamiliar code.
 | claude-code |
| midscene-testing | skill | 0.1.0 | Use when performing ad-hoc browser testing, smoke testing workflows, validating UI after frontend changes, or testing Datastar/HTMX/SSE reactive features that unit tests cannot cover. Also use when consolidating Midscene HTML reports into a single navigable document. | claude-code |
| obsidian-bases | skill | 0.1.0 | Create and edit Obsidian Bases (.base files): Obsidian's native database layer for dynamic tables, card views, list views, filters, formulas, and summaries over vault notes. Triggers on: create a base, add a base file, obsidian bases, base view, filter notes, formula, database view, dynamic table, task tracker base, reading list base. | claude-code |
| obsidian-canvas | skill | 0.1.0 | Visual layer of the wiki. Add images, text cards, PDFs, and wiki pages to Obsidian canvas files with auto-positioning inside zones. Integrates with /banana for image capture. Triggers on: /canvas, canvas new, canvas add image, canvas add text, canvas add pdf, canvas add note, canvas zone, canvas list, canvas from banana, add to canvas, put this on the canvas, open canvas, create canvas. | claude-code |
| obsidian-markdown | skill | 0.1.0 | Write correct Obsidian Flavored Markdown: wikilinks, embeds, callouts, properties, tags, highlights, math, and canvas syntax. Reference this when creating or editing any wiki page. Triggers on: write obsidian note, obsidian syntax, wikilink, callout, embed, obsidian markdown, wikilink format, callout syntax, embed syntax, obsidian formatting, how to write obsidian markdown. | claude-code |
| pikchr-generator | skill | 0.2.0 | Generate, theme, and render technical diagrams across four engines (Pikchr,
GraphViz, D2, Mermaid) with a shared 16-theme palette. Use whenever the user
asks for a diagram, flowchart, sequence diagram, system architecture,
state machine, data pipeline, swim lane, network topology, ER diagram,
class diagram, or any boxes-and-arrows technical illustration AND mentions
pikchr, graphviz, dot, d2, or mermaid OR has indicated a preference for
text-defined diagrams (over excalidraw/figma). Also use when the user says
"draw the architecture", "diagram this flow", "make a chart of X", "show
the states", "graph this topology", or asks for any visual these engines
are suited for. Outputs themed SVG (any of 16 themes via --theme NAME).
Do NOT use for freeform sketches that need curves and pen strokes (use
excalidraw), real Gantt/pie charts (use a chart library), or rich data viz.
 | apm, claude-code |

### workflow

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| orchestrator-mode | skill | 0.1.0 | Use at session start in the Darkish Factory repo to prime as the pipeline orchestrator (host mode). Loads the §7 loop, the 13-role roster, the escalation classifier, and the rules for converting subagent muscle memory into subharness dispatch. Invoke whenever the operator types a task and you're in this repo. | claude-code |
| subagent-to-subharness | skill | 0.1.0 | Use when you would normally dispatch a subagent via the Agent tool but you're operating as the Darkish Factory orchestrator. Translates the muscle memory into subharness dispatch. Maps task shapes to the right harness role, frames the task in caveman-standard, reads worker output back, decides next step. | claude-code |
| tts-announcer | hook | 0.1.0 | Local, offline voice announcements for Claude Code and Pi via Kokoro-82M TTS. Wires Notification + SubagentStop hooks so the terminal whispers progress instead of going *bing*. Useful when subagents run for minutes and you've wandered off. Use when the user wants TTS announcements, voice notifications, audible subagent feedback, or mentions "/tts", "speak", "announce", or "Kokoro". Audio never leaves the machine; no API keys.
 | claude-code, pi |
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

## Companion repos

Repos that aren't skill bundles but pair naturally with `agent-skills`:

- [`claude-hud-combo`](https://github.com/danmestas/claude-hud-combo) — Self-contained Deno statusline for Claude Code. Doesn't fit any of the six component types (it's a runtime artifact, not authored content), so it lives separately. Install with its own `install.sh`.
- [`meta-scout`](https://github.com/danmestas/meta-scout) — Library that powers the [`evolution-engine`](skills/evolution-engine) skill's deeper detection (12 behavioral signals, struggle-then-success arcs). The skill currently uses two inline detectors; once `meta-scout` publishes to npm or commits a built `dist/`, a follow-up PR wires its full signal catalog into the orchestrator.

## Contributing

- Branch from `main` and open a PR — direct pushes to `main` are not accepted.
- Run `npm test` and `npx tsc --noEmit` before pushing; both must be green.
- Keep commit messages focused and imperative (e.g., `feat(apm-builder): ...`, `docs: ...`).
- Do not include AI-tool attribution in commit messages or PR bodies.
- New skills follow the `kebab-case` directory convention under `skills/`. Plugins live under `plugins/`. See [`AGENTS.md`](AGENTS.md) for repo-level guidelines.

## License

[MIT](LICENSE).
