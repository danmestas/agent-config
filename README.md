# wardrobe

Dan's content monorepo for AI-coding harnesses. Outfits, cuts, accessories,
skills, agents, hooks, rules, and commands — authored once in canonical
formats and shipped to harnesses via [`suit`](https://github.com/danmestas/suit).

**Harness support tiers:**

- **Bulletproof:** Claude Code — full agent / hook / skill / rule / settings surface.
- **Well-supported:** Codex, Gemini, Pi — working adapters in suit, skills + rules + harness-native files.
- **DIY:** anything else — wardrobe doesn't ship an adapter, but the source format is documented in [`docs/HARNESS_INTEGRATION.md`](docs/HARNESS_INTEGRATION.md). Read it and write your own emitter.

This repo is content-only. The build/launcher tool lives separately in the
suit repo; this repo holds the YAML-fronted markdown that suit reads.

## Quick start

Install [suit](https://github.com/danmestas/suit), point it at this repo,
launch a harness:

```bash
npm install -g @agent-ops/suit
suit init https://github.com/danmestas/wardrobe
suit claude --outfit backend --cut focused
```

Or work against a local clone:

```bash
git clone https://github.com/danmestas/wardrobe
cd wardrobe
SUIT_CONTENT_PATH=$PWD suit list outfits
SUIT_CONTENT_PATH=$PWD suit show outfit backend
```

Layer accessories onto the session at invocation time. Accessories can be a curated bundle (e.g. `philosophy`) or any wardrobe component name (any skill / hook / rule / agent), with suit ≥ 0.6 falling through to find it (see ADR-0013):

```bash
# bundle accessory
suit claude --outfit backend --cut debugging --accessory philosophy

# singleton accessory — any component name resolves
suit claude --outfit backend --cut executing --accessory pr-policy --accessory test-driven-development
```

## What's in here

| Directory | What it contains |
|---|---|
| `outfits/` | Long-lived role bundles (aviation, backend, bones, code, frontend, kb, meta, personal, stasi) — set the baseline component set. Every outfit force-loads the universal core4: `writing-plans`, `brainstorming`, `subagent-driven-development`, `systematic-debugging`. |
| `cuts/` | Work-shape overlays (debugging, design, executing, focused, ops, planning, reviewing, ticketing, wait-watch, writing) — extend/override outfit components and inject a prompt body. |
| `accessories/` | Two layers: (a) curated multi-component bundles (philosophy, skill-author, vault, gh-project) live here as `accessory.md`; (b) any wardrobe component name (skill / hook / rule / agent / command) is also reachable via `--accessory <name>` through accessory-as-role fall-through (suit ≥ 0.6, ADR-0013). |
| `skills/` | Flat shared pool of `SKILL.md` capabilities triggered by description. Carry a `category:` block per the 8-axis TAXONOMY. |
| `agents/` | Subagent definitions (`AGENT.md`). |
| `hooks/` | Event-driven scripts (`HOOK.md` entrypoint, payload alongside). |
| `rules/` | Harness-native rules referenced by outfits/cuts/accessories. Currently: `pr-policy`. |
| `commands/` | Slash commands (`COMMAND.md`). |
| `docs/` | Authoring docs (TAXONOMY, CONVENTIONS, CONTEXT, contributing, GH project setup, plans, ADRs). |

## How content gets to your harness

When you run `suit claude --outfit backend --cut focused`, suit:

1. Starts with an empty component set.
2. Applies the outfit (`outfits/backend/outfit.md`) → fills baseline.
3. Applies the cut (`cuts/focused/cut.md`) → merges/overrides components
   plus injects the cut body as additional context.
4. Applies each `--accessory <name>` flag in order.
5. Emits per-harness via existing adapters into a temp tree the harness
   reads at launch.

The same content feeds Codex, Gemini, and Pi: each component declares
`targets:` in its frontmatter, and per-harness adapters (in the suit repo)
emit native artifacts. For any other harness, see
[`docs/HARNESS_INTEGRATION.md`](docs/HARNESS_INTEGRATION.md) — it documents
the frontmatter contract, composition rules, and emission shapes so you can
write your own adapter. Run `suit list skills`, `suit show skill <name>`, or
`suit claude --help` for the full surface. See the
[suit README](https://github.com/danmestas/suit) for the launcher reference,
and ADR-0010 / ADR-0011 in the suit repo for the vocabulary and layout
decisions.

## Want your own?

This is Dan's personal/team config. To start your own:

- Fork [`suit-template`](https://github.com/danmestas/suit-template) —
  minimal starter with one outfit and one cut.
- Or fork this repo as a richer starting point and trim what you don't want.
- Or `suit init https://github.com/your-username/your-fork` once your fork
  exists.

## Authoring

New components follow the canonical schema with YAML frontmatter:

```yaml
---
name: my-skill
version: 1.0.0
description: Use when [describe triggering conditions in one sentence]
type: skill
targets: [claude-code, codex, gemini, pi]
category:
  primary: tooling
  secondary: [economy]
---

(skill body)
```

- [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) — cross-cutting rules every component follows (fail-safe hooks, flat-line changelogs, `.agent-config/` state directory, cross-harness contract).
- [`docs/TAXONOMY.md`](docs/TAXONOMY.md) — the 8-axis taxonomy (Economy, Workflow, BackPressure, Tooling, Integrations, ContextManagement, MemoryManagement, Evolution) used to classify and bundle components.
- [`docs/CONTEXT.md`](docs/CONTEXT.md) — domain vocabulary (skill, outfit, cut, accessory, harness, adapter, prelaunch, suit session).
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) — how to run validation locally and submit a PR.

## Building

```bash
npm run validate -- --filter <name>     # validate one component
npm run build -- --target claude-code   # build Claude Code artifacts
npm run watch -- --target claude-code   # rebuild on change
npm run docs                            # regenerate the components table below
npm run init -- my-skill --type skill   # scaffold a new component
npm run evolve -- --since 7d --dry-run  # detect friction patterns in session history
```

Each script invokes [`suit-build`](https://github.com/danmestas/suit) via `npx -y -p @agent-ops/suit suit-build <cmd>` — no global install required. Available `--target` values: `claude-code`, `codex`, `gemini`, `pi`, or `all`.

`npm run docs` only rewrites the region between `<!-- AUTO-GENERATED: COMPONENTS -->
### backpressure

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| architect-review | agent | 0.1.0 | Master software architect specializing in modern architecture patterns, clean architecture, microservices, event-driven systems, and DDD. Reviews system designs and code changes for architectural integrity, scalability, and maintainability. Use PROACTIVELY for architectural decisions. | claude-code |
| code-reviewer | agent | 0.1.0 | Elite code review expert specializing in modern AI-powered code analysis, security vulnerabilities, performance optimization, and production reliability. Masters static analysis tools, security scanning, and configuration review with 2024/2025 best practices. Use PROACTIVELY for code quality assurance. | claude-code |
| course-correct | skill | 1.0.0 | Rewind a bad chunk of work by capturing what was tried + learned to a summary file, then telling the user how to rewind their session context per harness. Use when an approach has failed, work has gone down the wrong path, the agent went in circles, the user wants to undo recent decisions, or the user says "course correct", "rewind", "we went down the wrong path", "this isn't working start over", or "roll back what we just did". Captures session learnings without destroying git history or the working tree. | claude-code |
| debugger | agent | 0.1.0 | Debugging specialist for errors, test failures, and unexpected behavior. Use proactively when encountering any issues. | claude-code |
| dx-audit | skill | 0.1.0 | Use when evaluating developer experience or user experience, assessing usability of a CLI/SDK/API/UI, scoring project ergonomics, identifying friction in workflows, or when asked to audit DX or UX. Triggers on "DX score", "UX audit", "developer experience", "user experience", "workflow friction", "usability audit", "how hard is it to use this". | claude-code |
| golang-patterns | skill | 0.1.0 | Use when writing, reviewing, or refactoring Go code. Triggers on .go files, go.mod presence, or any task involving Go programming — concurrency (goroutines, channels, context), interfaces, generics, error handling, table-driven testing, or microservice/CLI architecture. Pairs with the `golang-pro` agent, which delegates pattern detail here. | claude-code, codex, gemini, pi |
| hipp | skill | 0.1.0 | Use when designing libraries, modules, or data layers that must be simple, reliable, and self-contained. Use when choosing between embedded vs server-based solutions. Use when reviewing code for unnecessary complexity, dependencies, or configuration. Triggers on requests involving zero-config design, embedded systems, long-term maintainability, or first-principles thinking. | claude-code, codex, gemini, pi |
| norman | skill | 0.1.0 | Use when designing, reviewing, or auditing user interfaces and frontend interactions. Use when evaluating UI usability, accessibility, or interaction patterns. Triggers on requests involving button placement, form design, navigation, error messages, onboarding flows, modal dialogs, or when asked to review a UI for usability. | claude-code, codex, gemini, pi |
| ousterhout | skill | 0.1.0 | Use when designing modules, classes, APIs, or system architecture. Use when reviewing or refactoring code for complexity. Use when choosing between implementation approaches. Triggers on requests involving abstraction design, interface simplicity, information hiding, or reducing cognitive load. | claude-code, codex, gemini, pi |
| stuck-detector | skill | 0.1.0 | Use when the user says "stuck", "I'm stuck", "this isn't working", "tool keeps failing", "give up on this", "we're going in circles", "/stuck", or when the agent itself notices it has hit N consecutive tool errors in a session window. Generates a handoff summary so progress can resume in a fresh session, escalate to a stronger model, or pause for user input. Stops the doom-loop of blind retries.
 | claude-code |
| tigerstyle | skill | 0.1.0 | Use when writing safety-critical code, systems programming, infrastructure, or when a project needs rigorous coding discipline. Triggers include requests for defensive coding, assertion-heavy development, performance-conscious design, zero-technical-debt policy, or NASA Power of Ten style rules. Also use when reviewing code for correctness, safety, or performance issues. | claude-code, codex, gemini, pi |
| verification-before-completion | skill | 1.0.0 | Use when about to claim work is complete, fixed, or passing in a bones workspace, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always | claude-code |

### context-management

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| dispatching-parallel-agents | skill | 1.0.0 | Run N concurrent slot sessions in a bones workspace for parallel debugging or independent work. Discover ready work via bones swarm tasks --slot=X --json. Roll up cross-slot status via bones tasks aggregate. Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies. | claude-code |
| subagent-driven-development | skill | 1.0.0 | Execute a plan in parallel slot sessions. Each implementer subagent runs in its own bones swarm session (slot + claim + worktree atomic via bones swarm join). Two-stage review (spec compliance + code quality) per task. Use when the plan has independent tasks that can run concurrently; use executing-plans instead for single-session inline runs. | claude-code |

### evolution

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| description-linter | skill | 0.1.0 | Use when the user types "lint my skills", "check skill descriptions", "/lint-skills", "validate skill triggers", "audit skill descriptions", or asks whether two skills conflict on the same prompt. Also fires PostToolUse on edits to any skills/*/SKILL.md. Static-analyzes SKILL.md frontmatter for trigger quality, length, naming, and cross-skill conflicts. Does NOT auto-fix — only reports.
 | claude-code |
| evolution-changelog | skill | 0.1.0 | Use when the user types "/changelog evolution", "log this evolution", "track applied evolutions", "update EVOLUTION.md", or asks to record what evolution-driven changes have been applied to the repo. Also fires PostToolUse on `git apply` operations against files matching the evolution-report path pattern. Maintains the EVOLUTION.md changelog at the repo root, one date-section per day, one bullet per applied change.
 | claude-code |
| evolution-engine | skill | 0.1.0 | Use when the user wants to "analyze sessions", "find patterns in my agent history", "evolve config", "/evolve", "what's been frustrating you", or asks for automated suggestions for improving skills/configs based on session transcripts. Triggers on requests to surface recurring friction, propose allowlist additions, find stale memory, or generate diff-shaped recommendations against existing skills, settings, and memory files.
 | claude-code |
| investigating-agent-sessions | skill | 0.2.0 | Use when debugging or auditing another Claude Code session, investigating what a prior agent did or left behind, reconstructing a failure that hit an earlier session, finding the cause of mystery state in a project (orphan processes, dirty files, broken hooks), or building context before continuing someone else's work | claude-code |
| monitoring-the-operator | skill | 0.1.0 | Live-monitor an active operator session from a worker pane (typically a stasi/wait-watch worker auditing the parent that spawned it). Use when a worker should watch the operator's transcript JSONL in real time, surface audit-worthy events without polling, distinguish active autonomous runs from hangs, and avoid the chat-Stop feedback loop that wakes the operator on every routine eval. Triggers when the user spawns a wait-watch worker and asks it to "watch what I do", "monitor my session", "audit the orchestrator live", "tell me if I do anything wrong", or any equivalent. | claude-code |
| reflect | skill | 0.1.0 | Use when the user types "/reflect", "review what we just did", "critique the last task", "what could go better", "post-task review", "retro this", or after a meaningful task ships and the agent judges a structured critique would help. Produces a markdown reflection report at ~/.claude/evolution-reports/<project>/reflections/. Does NOT auto-apply changes — output is for human review.
 | claude-code |
| skill-eval-runner | skill | 0.1.0 | Use when the user types "/eval skill X", "test skill X", "run evals on", "regression test skill", "eval skill", or asks whether a skill's description still triggers correctly. Also fires PostToolUse on edits to any skills/*/SKILL.md so a freshly-edited skill's triggers are immediately checked. Runs binary pass/fail evals (no scoring) per MindStudio's research.
 | claude-code |
| skill-gap-detector | skill | 0.1.0 | Use when the user wants to "find missing skills", "what skills should I have", "what am I explaining over and over", "/skill-gap", "audit my repeated instructions", or asks which skills they're missing based on session history. Also weekly cron-friendly. Scans recent session transcripts for "I had to explain X 3+ times" patterns and drafts proposed new SKILL.md files for human review. Does NOT auto-install.
 | claude-code |
| spy-on-bones-session | skill | 0.2.0 | Audit how bones behaves on a target project by fingerprinting <project> before and after `bones up`, capturing `bones status` plus any other state bones leaves behind, then watching a live operator's Claude Code session in real time to find patterns where bones is not running properly. Produces a structured findings report (bugs, inconveniences, improvements). Use whenever the user wants to spy on a bones session, audit bones on a project, watch a Claude session running with bones to surface rough edges, run `bones up` on something and report what's broken, or generally "find what bones gets wrong on <X>" — even if they don't say the word "spy" explicitly. | claude-code |
| spy-on-session | skill | 0.1.0 | Audit how a tool integrates with a Claude Code session — fingerprint files before and after the tool's bootstrap, monitor the live transcript JSONL and any event streams the tool publishes, classify findings as bugs / inconveniences / improvements with severity, source pointer, observed, expected, and repro hint. Use whenever the user wants to spy on a Claude Code integration, audit how a hook / skill / MCP / sidecar behaves in a real session, find what a tool is silently breaking, watch a Claude session running with <some tool> to surface rough edges, run a tool's bootstrap on a project and report what's broken, or generally "find what <tool> gets wrong on <project>" — even if they don't use the word "spy". For tools that already have a specialised spy skill (e.g. `spy-on-bones-session`), prefer that and use this only as a reference. | claude-code |
| trace | hook | 0.1.0 | Append-only JSONL trace of every tool call in the session. Records `{ts, tool, args, status, duration_ms}` per `PostToolUse` event so later skills can audit what happened without an LLM. Use when the user types "/trace", "track tool calls", "trace this session", "audit tool history", or asks why the agent did something. The hook fires automatically on every tool call; the trigger phrases are mostly for the agent to surface the file path on demand.
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
| linear-cli | skill | 1.0.0 | Use when manipulating Linear issues from the CLI — creating, updating, listing, transitioning, commenting via `acli linear` or the Linear MCP. Triggers: 'create linear issue', 'update issue status', 'list my issues', 'transition to in-progress', 'add comment to LIN-X', '/linear', 'lin issue'. | claude-code, codex, gemini, pi |
| linear-method | skill | 0.1.0 | Use when creating, organizing, or prioritizing issues in Linear. Use when managing backlogs, setting up cycles, scoping projects, writing issue titles/descriptions, or deciding how to structure work in Linear. Also use when asked about Linear best practices. | claude-code |
| signoz-dashboard-builder | skill | 0.1.0 | Use when creating or updating SigNoz dashboards via the MCP API. Triggers on requests to build dashboards, add panels, visualize metrics/logs/traces in SigNoz, or debug dashboard queries that show "No Data" or "Something went wrong". Also use when working with Claude Code telemetry in SigNoz. | claude-code |

### memory-management

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| career-interview | skill | 0.1.0 | This skill should be used when the user asks to "interview me", "build my career profile", "let's work on my resume background", "career interview", "start a career session", "update my profile", "let's talk about my experience", or invokes /career-interview. Conducts deep conversational interviews to build structured career profiles for technical professionals. | claude-code |
| knowledge-base | skill | 0.1.0 | Persistent, compounding knowledge base for Claude Code. Drop sources into a vault, let an autoresearch agent synthesize a living wiki, query across sessions, and keep the structure healthy. Use when the user wants persistent notes, a knowledge graph, vault management, or mentions Obsidian, "second brain", or "persistent memory".
 | claude-code |
| knowledge-base-overview | skill | 0.1.0 | Use when building, maintaining, ingesting into, querying, or health-checking a markdown knowledge base or wiki. Use when the user wants to compile sources into structured knowledge, maintain an Obsidian wiki, ingest documents, ask questions against accumulated research, or run health checks on interlinked markdown pages. Triggers on requests involving knowledge bases, wiki maintenance, source ingestion, research compilation, Obsidian wiki workflows, or LLM-maintained documentation. | claude-code |
| memorize | skill | 0.1.0 | Use when the user types "/memorize", "save this learning", "make this an ADR", "capture this for future sessions", "remember this", "write this down for next time", or "save that proposal". Also auto-fires after /reflect when the user expresses agreement with a proposal. Converts a recent insight or reflection into either a project ADR or a personal memory entry. Always confirms content with the user before writing.
 | claude-code |
| recall | hook | 0.1.0 | Auto-injects recent feedback memories and ADRs at session start so the agent has context from past learnings. Walks `~/.claude/projects/<project>/memory/` and `<repo>/docs/adr/` for the latest entries (default 5) and emits them as SessionStart additionalContext. Use when the user types "/recall", "what should I remember", "recent decisions", "load my memories", or asks about prior conclusions. Default ON; opt out by creating `.agent-config/recall.disabled` in the repo.
 | claude-code |
| vault-autoresearch | skill | 0.2.0 | Use when iteratively researching a topic and filing the synthesis into an Obsidian vault for later ingestion. Output goes to `<vault>/.raw/` (NOT directly into wiki pages) so that `vault-ingest` can process it on its own schedule. Triggers: '/vault-autoresearch', 'autoresearch [topic]', 'research [topic] into the vault', 'deep dive into [topic]', 'find everything about [topic] for the vault', 'research and stage'. | claude-code |
| vault-ingest | skill | 0.1.0 | Ingest sources into the Obsidian wiki vault. Reads a source, extracts entities and concepts, creates or updates wiki pages, cross-references, and logs the operation. Supports files, URLs, and batch mode. Triggers on: ingest, process this source, add this to the wiki, read and file this, batch ingest, ingest all of these, ingest this url. | claude-code |
| vault-lint | skill | 0.1.0 | Health check the Obsidian wiki vault. Finds orphan pages, dead wikilinks, stale claims, missing cross-references, frontmatter gaps, and empty sections. Creates or updates Dataview dashboards. Generates canvas maps. Triggers on: "lint", "health check", "clean up wiki", "check the wiki", "wiki maintenance", "find orphans", "wiki audit".
 | claude-code |
| vault-overview | skill | 0.1.0 | Claude + Obsidian knowledge companion. Sets up a persistent wiki vault, scaffolds structure from a one-sentence description, and routes to specialized sub-skills. Use for setup, scaffolding, cross-project referencing, and hot cache management. Triggers on: "set up wiki", "scaffold vault", "create knowledge base", "/wiki", "wiki setup", "obsidian vault", "knowledge base", "second brain setup", "running notetaker", "persistent memory", "llm wiki".
 | claude-code |
| vault-query | skill | 0.1.0 | Answer questions using the Obsidian wiki vault. Reads hot cache first, then index, then relevant pages. Synthesizes answers with citations. Files good answers back as wiki pages. Supports quick, standard, and deep modes. Triggers on: what do you know about, query:, what is, explain, summarize, find in wiki, search the wiki, based on the wiki, wiki query quick, wiki query deep. | claude-code |
| vault-save | skill | 0.1.0 | Save the current conversation, answer, or insight into the Obsidian wiki vault as a structured note. Analyzes the chat, determines the right note type, creates frontmatter, files it in the correct wiki folder, and updates index, log, and hot cache. Triggers on: "save this", "save that answer", "/save", "file this", "save to wiki", "save this session", "file this conversation", "keep this", "save this analysis", "add this to the wiki".
 | claude-code |

### tooling

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| clone-config | skill | 0.1.0 | Use when bootstrapping a fresh Mac/server, managing dotfiles, tracking shell configs, refreshing a Brewfile, adding ~/.zshrc to a dotfiles repo, or asking how to replicate a machine's config to a new device. Manages macOS (and Linux-compatible) machine config via chezmoi — install once, apply on every machine, edit source not target. | claude-code |
| datastar | skill | 0.1.0 | Use when building web applications with Datastar — the hypermedia framework that drives frontend reactivity from the backend using HTML data-* attributes and Server-Sent Events. Triggers on Datastar, data-star, SSE-driven UI, hypermedia framework, backend-driven frontend, data-signals, data-on, PatchElements, or any Go/Python web app using Datastar SDKs. | claude-code |
| datastar-patterns | skill | 0.1.0 | Use when implementing UI patterns with Datastar — search, inline editing, infinite scroll, file upload, validation, bulk operations, polling, lazy loading, progress indicators, or keyboard shortcuts. Triggers on data-* attributes, @get/@post/@put/@patch helpers, SSE response formatting, or any "how do I do X in Datastar" implementation question. | claude-code |
| datastar-tao | skill | 0.1.0 | Use when building hypermedia-driven web applications, server-rendered UIs, or any frontend where the backend should own state. Use when choosing between SPA and server-driven architecture. Use when reviewing frontend code for unnecessary client-side state, optimistic updates, or client-side routing. Triggers on requests involving SSE, HTML-over-the-wire, DOM morphing, HTMX, Datastar, signals, or backend-first frontend design. | claude-code |
| defuddle | skill | 0.1.0 | Strip clutter from web pages before ingesting into the wiki. Removes ads, navigation, headers, footers, and boilerplate: leaving clean readable markdown that saves 40-60% tokens. Triggers on: defuddle, clean this page, strip this url, fetch and clean, clean web content before ingesting, strip ads, remove clutter, clean URL content, readable markdown from URL. | claude-code |
| deterministic-simulation-testing | skill | 0.1.0 | Use when building or testing distributed systems, consensus protocols, sync engines, replicated databases, or any system with network/disk/time non-determinism. Also use when tests are flaky due to concurrency, when debugging rare heisenbugs, or when asked about simulation testing, BUGGIFY, VOPR, or fault injection strategies. | claude-code |
| midscene-testing | skill | 0.1.0 | Use when performing ad-hoc browser testing, smoke testing workflows, validating UI after frontend changes, or testing Datastar/HTMX/SSE reactive features that unit tests cannot cover. Also use when consolidating Midscene HTML reports into a single navigable document. | claude-code |
| observability-engineer | agent | 0.1.0 | Build production-ready monitoring, logging, and tracing systems. Implements comprehensive observability strategies, SLI/SLO management, and incident response workflows. Use PROACTIVELY for monitoring infrastructure, performance optimization, or production reliability. | claude-code |
| obsidian-bases | skill | 0.1.0 | Create and edit Obsidian Bases (.base files): Obsidian's native database layer for dynamic tables, card views, list views, filters, formulas, and summaries over vault notes. Triggers on: create a base, add a base file, obsidian bases, base view, filter notes, formula, database view, dynamic table, task tracker base, reading list base. | claude-code |
| obsidian-canvas | skill | 0.1.0 | Visual layer of the wiki. Add images, text cards, PDFs, and wiki pages to Obsidian canvas files with auto-positioning inside zones. Integrates with /banana for image capture. Triggers on: /canvas, canvas new, canvas add image, canvas add text, canvas add pdf, canvas add note, canvas zone, canvas list, canvas from banana, add to canvas, put this on the canvas, open canvas, create canvas. | claude-code |
| obsidian-markdown | skill | 0.1.0 | Write correct Obsidian Flavored Markdown: wikilinks, embeds, callouts, properties, tags, highlights, math, and canvas syntax. Reference this when creating or editing any wiki page. Triggers on: write obsidian note, obsidian syntax, wikilink, callout, embed, obsidian markdown, wikilink format, callout syntax, embed syntax, obsidian formatting, how to write obsidian markdown. | claude-code |
| pikchr-generator | skill | 0.3.0 | Author production-grade technical diagrams in Pikchr — a deterministic,
text-defined diagram DSL that compiles to a single self-contained SVG.
Use whenever the user asks for a flowchart, sequence diagram, system
architecture, state machine, data pipeline, swim lane, or any
boxes-and-arrows technical illustration AND has expressed a preference
for text-defined / source-controlled diagrams (over excalidraw, figma,
or hand-drawn art). Also use when the user says "draw the architecture",
"diagram this flow", "show the states", "graph this topology", or
mentions pikchr by name. Output is themed SVG (16 themes via --theme NAME)
that renders inline in any Markdown surface that accepts SVG (GitHub,
GitLab, Obsidian, mdBook, agent multimodal Read, etc.). Do NOT use for
freeform sketches with curves and pen strokes (excalidraw), real
Gantt/pie charts (a chart library), or rich data viz.
 | claude-code |
| shadcn-forms | skill | 0.1.0 | This skill should be used when generating React form components with shadcn/ui, wiring up react-hook-form with zod validation, choosing the right shadcn/ui input component for each field type, or when the user asks to "build a form with shadcn", "add form validation", "use react-hook-form", "create a zod schema for this form". Provides component selection guidance, validation patterns, and production-ready implementation recipes for shadcn/ui v4 forms.
 | claude-code |
| skill-creator | skill | 1.0.0 | Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy. | claude-code |
| skill-development | skill | 0.1.0 | This skill should be used when the user wants to "create a skill", "add a skill to plugin", "write a new skill", "improve skill description", "organize skill content", or needs guidance on skill structure, progressive disclosure, or skill development best practices for Claude Code plugins. | claude-code, codex, gemini, pi |
| suit-build | skill | 0.1.0 | Use when building, validating, or scaffolding skills in this monorepo. Triggers: "validate skills", "build suit-build", "scaffold a new skill", "init a hook/agent/rules/plugin", "run suit-build", or any work on the multi-harness skill emission pipeline (Claude Code, APM, Codex, Gemini, Copilot CLI, Pi targets).
 | claude-code |
| vitaly | skill | 0.1.0 | This skill should be used when generating web form components, auditing form accessibility, reviewing form UX, or when the user asks to "check form accessibility", "audit this form", "apply form best practices", "make this form accessible", "review form UX". Also triggers on form generation tasks where the output is a React form component. Based on Vitaly Friedman's (Smashing Magazine) accessible web form design patterns.
 | claude-code |

### workflow

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| brainstorming | skill | 1.0.0 | Help turn ideas into fully formed designs and specs through natural collaborative dialogue. Use when the user wants to design something, brainstorm a feature, or plan a project in a bones workspace. | claude-code |
| ci-watch | skill | 1.0.0 | Use when watching CI/CD checks complete — `gh pr checks`, `gh run watch`, polling PR conclusion, waiting for builds to finish before merge. Triggers: 'watch CI', 'wait for build', 'poll PR', 'check CI status', 'is the build done', '/ci-watch'. | claude-code, codex, gemini, pi |
| executing-plans | skill | 1.0.0 | Execute a plan task-by-task in a single session inside a bones workspace. Coordinator enumerates tasks via bones tasks list, claims one at a time, and closes with --reason on completion. Use when running a plan inline (single agent, single session); use subagent-driven-development instead for parallel slot work. | claude-code |
| farley | skill | 0.1.0 | Use when assessing, designing, fixing, or explaining Continuous Delivery in Dave Farley's style. Triggers on continuous delivery, CD, CI/CD maturity, deployment pipelines, release readiness, trunk-based development, release process audits, DORA metrics, "can we deploy now?", "Farley", or requests to make software releasable safely and frequently. Also use for regulated or legacy systems where the user needs a pragmatic CD adoption plan. | claude-code |
| finishing-a-bones-leaf | skill | 1.0.0 | After a bones swarm session closes, decide what to do with the open leaf — fan-in to trunk, keep open, or abandon — and (optionally) materialize trunk into the git worktree, push, and open a PR for the swarmed changes. Use when implementation is complete, all tests pass, and you need to integrate the work back into the bones hub trunk. | claude-code |
| golang-pro | agent | 0.1.0 | Master Go 1.21+ with modern patterns, advanced concurrency, performance optimization, and production-ready microservices. Expert in the latest Go ecosystem including generics, workspaces, and cutting-edge frameworks. Use PROACTIVELY for Go development, architecture design, or performance optimization. | claude-code |
| landing | skill | 1.0.0 | Post-merge cleanup workflow. Discusses uncommitted worktree changes per-worktree before deleting; handles local + remote merged branches, stale refs, dist/ build artifacts, and surfaces today's memory entries for review. Use when the user wants to wrap up after merging a PR, clean up worktrees, tidy branches, do post-merge cleanup, "land the plane", "land", remove stale feature branches, or close out a development session. | claude-code |
| orchestrator-mode | skill | 0.1.0 | Use at session start in the Darkish Factory repo to prime as the pipeline orchestrator (host mode). Loads the §7 loop, the 13-role roster, the escalation classifier, and the rules for converting subagent muscle memory into subharness dispatch. Invoke whenever the operator types a task and you're in this repo. | claude-code |
| orchestrator-suit | skill | 0.1.0 | Use when you are the orchestrator session driving role-shaped subharness children. Loads when the orchestrator outfit is active. Documents the spawn loop — receive intent → classify → spawn role-shaped child via stateless suit + harness-spawn → monitor → cherry-pick worktree → escalate → audit log. Triggers on "orchestrate", "dispatch a worker", "spawn an implementer / reviewer / planner / spy", "run the multi-role pipeline", "drive child harnesses", "spawn a worker session". | claude-code, codex, gemini, pi |
| pr-policy | rules | 1.0.0 | Force PR-policy + local-CI rules — no direct commits to main, run CI locally before declaring PR ready. | claude-code, codex, gemini, pi |
| receiving-code-review | skill | 1.0.0 | Use when receiving code review feedback in a bones workspace, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation | claude-code |
| requesting-code-review | skill | 1.0.0 | Use when completing tasks, implementing major features, or before fan-in to verify work meets requirements in a bones workspace | claude-code |
| ship-issue | skill | 1.0.0 | Drive an issue from triage to merged PR with minimal operator intervention. Runs the full loop — read & label, post agent brief, write a failing test, implement minimally, self-review via subagent, replicate local CI, push, watch CI, squash-merge, clean up, and report with next-step suggestions. Use when the operator says "ship #X", "do issue #X end-to-end", "take #X to merge", "fix and ship #X", "do #X autonomously", or any phrasing that authorizes carrying a single issue all the way through. Also use when the operator follows a /triage call with "do as you'd like", "update the issue then start implementation", or otherwise hands off the rest of the workflow. Do NOT use for purely advisory questions ("what should we do about #X?", "look at #X with me") — those stay in regular triage / discussion mode. | claude-code, codex, gemini, pi |
| subagent-to-subharness | skill | 0.1.0 | Use when you would normally dispatch a subagent via the Agent tool but you're operating as the Darkish Factory orchestrator. Translates the muscle memory into subharness dispatch. Maps task shapes to the right harness role, frames the task in caveman-standard, reads worker output back, decides next step. | claude-code |
| systematic-debugging | skill | 1.0.0 | Use when encountering any bug, test failure, or unexpected behavior in a bones workspace, before proposing fixes | claude-code |
| takeoff | skill | 1.0.0 | Beginning-of-session inventory and orientation. Surfaces stale worktrees, behind-origin state, recent specs/plans, open PRs, and recent memory entries to help the agent re-orient. Use when starting a new session, asking "where were we", running a takeoff check, beginning work, or wanting a situational report before diving in. Read-only — pure inventory + recommendations, no automatic actions. | claude-code |
| test-driven-development | skill | 1.0.0 | Use when implementing any feature or bugfix in a bones workspace, before writing implementation code | claude-code |
| tts-announcer | hook | 0.1.0 | Local, offline voice announcements for Claude Code and Pi via Kokoro-82M TTS. Wires Notification + SubagentStop hooks so the terminal whispers progress instead of going *bing*. Useful when subagents run for minutes and you've wandered off. Use when the user wants TTS announcements, voice notifications, audible subagent feedback, or mentions "/tts", "speak", "announce", or "Kokoro". Audio never leaves the machine; no API keys.
 | claude-code, pi |
| using-bones-powers | skill | 1.0.0 | Use when starting any conversation in a bones workspace - establishes how to find and use bones-powers skills, requiring Skill tool invocation before ANY response including clarifying questions | claude-code |
| using-bones-swarm | skill | 1.0.0 | Open, work in, and close a bones swarm session — the slot-shaped lane that bundles a worktree, a claimed task, and an open hub branch. Use when starting feature work that needs isolation from current workspace, before executing implementation plans, or when you need a worktree for parallel work in a bones workspace. | claude-code |
| writing-plans | skill | 1.0.0 | Use when you have a spec or requirements for a multi-step task in a bones workspace, before touching code — produces a bones task graph plan with slot assignments and leaf-level steps | claude-code |

### Uncategorized

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| aviation | outfit | 2.1.2 | Flight planning, NOTAMs, charts, ops references. | claude-code, codex, gemini, pi |
| backend | outfit | 2.1.1 | Backend dev work — Go, server, observability, deterministic systems. | claude-code, codex, gemini, pi |
| bones | outfit | 1.1.1 | The bones Go orchestrator — leaves, swarm, parallel work. | claude-code, codex, gemini, pi |
| bones-powers | hook | 0.1.0 | SessionStart hook for bones workspaces. Injects the using-bones-powers skill as additionalContext when cwd contains a `.bones/repo.fossil` marker. Outside a bones workspace the hook exits silently and other hooks are unaffected.
 | claude-code |
| bones-tooling | cut | 0.1.0 | Bones tooling stack cut — for working ON the bones binary itself (Go + fossil + nats). Different from working IN a bones-instrumented project (use accessory bones for that). | claude-code, codex, gemini, pi |
| code | outfit | 2.0.0 | Generic coding work — language-agnostic baseline for any code project. | claude-code, codex, gemini, pi |
| debugging | cut | 1.1.2 | Hunting a bug — reproduce, minimize, hypothesise, instrument, fix, regression-test. | claude-code, codex, gemini, pi |
| design | cut | 1.0.1 | UI / UX work — visual hierarchy, accessibility, interaction polish. | claude-code, codex, gemini, pi |
| engineer | outfit | 1.0.0 | General software engineering — language-agnostic discipline pack with philosophy, review, testing, and self-correction. | claude-code, codex, gemini, pi |
| executing | cut | 1.1.2 | Working a plan — spawn subagents, dispatch parallel work, finish the branch. | claude-code, codex, gemini, pi |
| focused | cut | 2.0.1 | Single-task deep focus, no scope creep. | claude-code, codex, gemini, pi |
| frontend | outfit | 2.1.1 | Datastar / shadcn / UI work. | claude-code, codex, gemini, pi |
| gh-project | accessory | 1.0.0 | GitHub project board toolkit. | claude-code, codex, gemini, pi |
| gh-project-expert | agent | 1.0.0 | Use this agent when the user needs to create, configure, or manage GitHub Projects — including setting up boards, managing issues, writing charters, or performing bulk operations. Examples:

<example>
Context: User wants to start a new project for a feature
user: "Set up a GitHub project for the auth rewrite"
assistant: "I'll use the gh-project-expert agent to create and configure the project."
<commentary>
New project creation requires setup (template selection, fields) and likely a charter. The agent orchestrates both.
</commentary>
</example>

<example>
Context: User wants to bulk-update project board items
user: "Move all the Todo items in project 3 to In Progress"
assistant: "I'll use the gh-project-expert agent to handle the bulk status change."
<commentary>
Bulk operations on project items — the agent uses operations skills with shared utilities for auth and config.
</commentary>
</example>

<example>
Context: User wants to document project scope
user: "Create a charter for the API project with goals and success criteria"
assistant: "I'll use the gh-project-expert agent to generate the project charter."
<commentary>
Charter creation and scope documentation is a core capability.
</commentary>
</example>

<example>
Context: User asks about their GitHub project setup
user: "What templates are available for GitHub projects?"
assistant: "I'll use the gh-project-expert agent to explain the available templates and help you choose."
<commentary>
Project configuration questions benefit from the agent's knowledge of all 6 templates and when to use each.
</commentary>
</example>
 | claude-code |
| go-backend | cut | 0.1.0 | Go backend stack cut — Go services, CLIs, libraries. Loads golang-patterns and idiomatic Go discipline. | claude-code, codex, gemini, pi |
| implementer | outfit | 0.1.0 | Implementer role — TDD, executing-plans, finishing-a-bones-leaf. For coding workers in orchestrated multi-role flows; pair with a stack cut and a project accessory. | claude-code, codex, gemini, pi |
| infra-cloudflare | cut | 0.1.0 | Cloudflare infrastructure stack cut — Workers, Pages, R2, D1, KV, Queues, Durable Objects, Workflows. Body-references the cloudflare plugin namespace skills (loaded via plugin enable, not skill_include). | claude-code, codex, gemini, pi |
| kb | outfit | 1.1.2 | Obsidian vault / knowledge curation. | claude-code, codex, gemini, pi |
| linear | accessory | 1.0.0 | Linear toolkit — issue management via CLI + method etiquette. | claude-code, codex, gemini, pi |
| meta | outfit | 1.1.1 | Wardrobe / suit / agent-skills authoring. | claude-code, codex, gemini, pi |
| monorepo-profiles | hook | 0.1.0 | SessionStart hook that activates a per-monorepo-cwd profile. Reads `.claude/profiles/<name>.json` and applies MCP servers, permissions, plugin enables, and CLAUDE.md preambles for the active profile. Use when working in monorepos where different subdirectories need different Claude config.
 | claude-code |
| ops | cut | 2.1.2 | Incident / infra change — observe before changing. | claude-code, codex, gemini, pi |
| orchestrator | outfit | 0.1.0 | Orchestrator role — drives subharness children via stateless suit launches piped through harness-spawn. Does not write code. For parent sessions managing multi-role pipelines (implementer + reviewer + planner + spy). | claude-code, codex, gemini, pi |
| personal | outfit | 2.1.1 | Journaling, resume, life admin (formerly personal + taxes). | claude-code, codex, gemini, pi |
| philosophy | accessory | 1.0.0 | Philosophy pack — Ousterhout, TigerStyle, Farley, HIPP, Norman, Vitaly. | claude-code, codex, gemini, pi |
| planner | outfit | 0.1.0 | Planner role — produces a written plan with bite-sized tasks, defers implementation. Loads writing-plans, brainstorming, dispatching-parallel-agents. For planning workers in orchestrated multi-role flows. | claude-code, codex, gemini, pi |
| planning | cut | 1.1.2 | Designing before code — produce a plan, don't write the implementation yet. | claude-code, codex, gemini, pi |
| project-bones | accessory | 0.1.0 | Project context accessory for the bones repo — loads bones-specific skills (using-bones-powers, using-bones-swarm, spy-on-bones-session, finishing-a-bones-leaf). Apply when working in or against a project that uses bones. Named project-bones (not bones) to avoid collision with the existing bones outfit. | claude-code, codex, gemini, pi |
| project-dagnats | accessory | 0.1.0 | Project context accessory for the dagnats repo — NATS-based DAG coordination. Apply when working in /Users/dmestas/projects/dagnats. | claude-code, codex, gemini, pi |
| project-serverdom | accessory | 0.1.0 | Project context accessory for the serverdom repo — Go service with JSX-style codegen DSL for ServerDOM components. Apply when working in /Users/dmestas/projects/serverdom. | claude-code, codex, gemini, pi |
| python-data | cut | 0.1.0 | Python data stack cut — pandas/polars, ETL, ML, notebook-style analysis. Type hints, no surprise mutation. | claude-code, codex, gemini, pi |
| quick | outfit | 0.1.0 | Quick generalist outfit composed from implementer + planner + reviewer for solo flow. Use when working alone on a small task and the role keeps shifting. For orchestrated multi-pane work, use the individual role outfits instead — quick is the v2 generalist replacement for v1 domain outfits. | claude-code, codex, gemini, pi |
| reviewer | outfit | 0.1.0 | Reviewer role — block-or-ship verdicts on diffs. Loads requesting/receiving-code-review and the philosophy lenses (hipp, ousterhout, norman). For review workers in orchestrated multi-role flows. | claude-code, codex, gemini, pi |
| reviewing | cut | 1.1.2 | Code review — separate must-fix from suggestion. | claude-code, codex, gemini, pi |
| skill-author | accessory | 1.0.0 | Skill authoring + evaluation toolkit. | claude-code, codex, gemini, pi |
| spy | outfit | 0.1.0 | Spy role — read-only audits of how a tool integrates with a Claude Code session. Loads spy-on-session and investigating-agent-sessions. For audit workers in orchestrated multi-role flows; the project accessory activates tool-specific spy paths (e.g. spy-on-bones-session via accessory bones). | claude-code, codex, gemini, pi |
| stasi | outfit | 1.1.1 | Spying on sessions to audit and improve agent behavior. | claude-code, codex, gemini, pi |
| ticketing | cut | 1.0.1 | Issue / PR writing — produce tracer-bullet vertical slices. | claude-code, codex, gemini, pi |
| ts-frontend | cut | 0.1.0 | TypeScript frontend stack cut — React, Vue, Svelte, vanilla TS UI. Body-references the frontend-design plugin and tailwindcss-master skills (loaded via plugin enable, not skill_include). | claude-code, codex, gemini, pi |
| vault | accessory | 1.0.0 | Obsidian vault toolkit — ingest, query, save, lint, plus markdown/bases/canvas authoring. | claude-code, codex, gemini, pi |
| wait-watch | cut | 1.0.1 | Waiting on external events — polling CI, watching builds, monitoring long jobs. | claude-code, codex, gemini, pi |
| writing | cut | 1.1.2 | Prose / KB notes / docs. | claude-code, codex, gemini, pi |
<!-- /AUTO-GENERATED: COMPONENTS -->`. Everything outside the markers is hand-written and preserved across regenerations.

## Globals registry

`globals.yaml` is a per-machine snapshot of every Claude Code plugin and MCP
server installed at *user scope* (read from
`~/.claude/plugins/installed_plugins.json` for user-scope plugins, and
`~/.claude.json`'s `mcpServers` block for MCPs). Suit (≥ v0.7) reads it so
outfits, cuts, and accessories can reference globals by name — enabling or
disabling specific plugins/MCPs per session without uninstalling them.

```bash
npm run sync-globals                # write globals.yaml from this machine
npm run sync-globals -- --dry-run   # print the snapshot, don't write
npm run sync-globals -- --pr        # write, commit, push, open a PR via gh
```

Run `npm run sync-globals` after installing or removing a plugin or MCP at
user scope to refresh the registry, then open a PR (the `--pr` flag does
this for you when `gh` is on PATH and the working tree is otherwise clean).
Outfits, cuts, and accessories opt into globals via `enable:` / `disable:`
blocks naming registered entries — see ADR-0014 in the suit repo (Phase D
of v0.7 wires the resolver). MCP entries record only non-secret metadata —
stdio MCPs capture `command`, `args`, and a `has_env` flag; HTTP MCPs
capture `url` and a `has_headers` flag. Env values and header values stay
in `~/.claude.json`.

See [`globals.yaml.example`](globals.yaml.example) for the schema. Real
`globals.yaml` files are expected to drift between collaborators.

## Categories

Each link points at the component's own directory — open the `SKILL.md` (or agent / hook file) inside for the full writeup. The auto-generated [Components table](#components) below has descriptions for every entry.

### Software design philosophy (BackPressure)

[ousterhout](skills/ousterhout) · [hipp](skills/hipp) · [norman](skills/norman) · [tigerstyle](skills/tigerstyle) · [idiomatic-go](skills/idiomatic-go) · [dx-audit](skills/dx-audit)

### Frontend & forms (Tooling)

[shadcn-forms](skills/shadcn-forms) · [vitaly](skills/vitaly) · [datastar](skills/datastar) · [datastar-tao](skills/datastar-tao) · [datastar-patterns](skills/datastar-patterns)

### Development tooling (Tooling)

[suit-build](skills/suit-build) · [cloudflare-email](skills/cloudflare-email) · [pikchr-generator](skills/pikchr-generator) · [career-interview](skills/career-interview)

### Workflow

[orchestrator-mode](skills/orchestrator-mode) · [subagent-to-subharness](skills/subagent-to-subharness) · [tts-announcer](hooks/tts-announcer)

### Project & process (Integrations)

[linear-method](skills/linear-method) · [atlassian-cli-jira](skills/atlassian-cli-jira) · [gh-project-charter](skills/gh-project-charter) · [gh-project-setup](skills/gh-project-setup) · [gh-project-operations](skills/gh-project-operations) · [gh-project-shared](skills/gh-project-shared)

### Integrations & data

[signoz-dashboard-builder](skills/signoz-dashboard-builder) · [apple-contacts](skills/apple-contacts) · [deterministic-simulation-testing](skills/deterministic-simulation-testing) · [doppler](skills/doppler) · [midscene-testing](skills/midscene-testing)

### Knowledge base (ContextManagement / MemoryManagement)

Bundled as the [knowledge-base](plugins/knowledge-base) plugin — install once for all 11 skills.

[knowledge-base-overview](skills/knowledge-base-overview) · [vault-overview](skills/vault-overview) · [vault-ingest](skills/vault-ingest) · [vault-query](skills/vault-query) · [vault-lint](skills/vault-lint) · [vault-save](skills/vault-save) · [autoresearch](skills/autoresearch) · [defuddle](skills/defuddle) · [obsidian-canvas](skills/obsidian-canvas) · [obsidian-bases](skills/obsidian-bases) · [obsidian-markdown](skills/obsidian-markdown)

### Evolution

[evolution-engine](skills/evolution-engine) · [skill-gap-detector](skills/skill-gap-detector) · [reflect](skills/reflect) · [memorize](skills/memorize) · [skill-eval-runner](skills/skill-eval-runner) · [description-linter](skills/description-linter) · [stuck-detector](skills/stuck-detector) · [evolution-changelog](skills/evolution-changelog) · [trace](hooks/trace) · [recall](hooks/recall)

### Plugins

Harness-specific plugin shells (no `SKILL.md`, not transpiled). Each has its own README.

[knowledge-base](plugins/knowledge-base) · [monorepo-profiles](plugins/monorepo-profiles) · [career-interview](plugins/career-interview) · [gh-project-management](plugins/gh-project-management) · [bones-powers](plugins/bones-powers) · [flight-deck](plugins/flight-deck)

### Agents

`agents/` is wshobson-sourced (vendored from [wshobson/agents](https://github.com/wshobson/agents), MIT — see [`LICENSES/wshobson-agents.LICENSE`](LICENSES/wshobson-agents.LICENSE)); upstream `model:` fields are dropped so the adapter layer picks per harness. `gh-project-expert` is locally-authored and lives inside the `gh-project-management` plugin.

[code-reviewer](agents/code-reviewer) · [debugger](agents/debugger) · [golang-pro](agents/golang-pro) · [architect-review](agents/architect-review) · [observability-engineer](agents/observability-engineer) · [gh-project-expert](plugins/gh-project-management/agents/gh-project-expert.md)

## Components

The table below is regenerated from canonical `SKILL.md` frontmatter via `npm run docs`. Every skill, plugin, and hook in the repo conforms to the canonical schema and appears in this table.

<!-- AUTO-GENERATED: COMPONENTS -->
### backpressure

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| architect-review | agent | 0.1.0 | Master software architect specializing in modern architecture patterns, clean architecture, microservices, event-driven systems, and DDD. Reviews system designs and code changes for architectural integrity, scalability, and maintainability. Use PROACTIVELY for architectural decisions. | claude-code |
| code-reviewer | agent | 0.1.0 | Elite code review expert specializing in modern AI-powered code analysis, security vulnerabilities, performance optimization, and production reliability. Masters static analysis tools, security scanning, and configuration review with 2024/2025 best practices. Use PROACTIVELY for code quality assurance. | claude-code |
| datastar-tao | skill | 0.1.0 | Use when building hypermedia-driven web applications, server-rendered UIs, or any frontend where the backend should own state. Use when choosing between SPA and server-driven architecture. Use when reviewing frontend code for unnecessary client-side state, optimistic updates, or client-side routing. Triggers on requests involving SSE, HTML-over-the-wire, DOM morphing, HTMX, Datastar, signals, or backend-first frontend design. | claude-code |
| debugger | agent | 0.1.0 | Debugging specialist for errors, test failures, and unexpected behavior. Use proactively when encountering any issues. | claude-code |
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
| description-linter | skill | 0.1.0 | Use when the user types "lint my skills", "check skill descriptions", "/lint-skills", "validate skill triggers", "audit skill descriptions", or asks whether two skills conflict on the same prompt. Also fires PostToolUse on edits to any skills/*/SKILL.md. Static-analyzes SKILL.md frontmatter for trigger quality, length, naming, and cross-skill conflicts. Does NOT auto-fix — only reports.
 | claude-code |
| evolution-changelog | skill | 0.1.0 | Use when the user types "/changelog evolution", "log this evolution", "track applied evolutions", "update EVOLUTION.md", or asks to record what evolution-driven changes have been applied to the repo. Also fires PostToolUse on `git apply` operations against files matching the evolution-report path pattern. Maintains the EVOLUTION.md changelog at the repo root, one date-section per day, one bullet per applied change.
 | claude-code |
| evolution-engine | skill | 0.1.0 | Use when the user wants to "analyze sessions", "find patterns in my agent history", "evolve config", "/evolve", "what's been frustrating you", or asks for automated suggestions for improving skills/configs based on session transcripts. Triggers on requests to surface recurring friction, propose allowlist additions, find stale memory, or generate diff-shaped recommendations against existing skills, settings, and memory files.
 | claude-code |
| memorize | skill | 0.1.0 | Use when the user types "/memorize", "save this learning", "make this an ADR", "capture this for future sessions", "remember this", "write this down for next time", or "save that proposal". Also auto-fires after /reflect when the user expresses agreement with a proposal. Converts a recent insight or reflection into either a project ADR or a personal memory entry. Always confirms content with the user before writing.
 | claude-code |
| reflect | skill | 0.1.0 | Use when the user types "/reflect", "review what we just did", "critique the last task", "what could go better", "post-task review", "retro this", or after a meaningful task ships and the agent judges a structured critique would help. Produces a markdown reflection report at ~/.claude/evolution-reports/<project>/reflections/. Does NOT auto-apply changes — output is for human review.
 | claude-code |
| skill-eval-runner | skill | 0.1.0 | Use when the user types "/eval skill X", "test skill X", "run evals on", "regression test skill", "eval skill", or asks whether a skill's description still triggers correctly. Also fires PostToolUse on edits to any skills/*/SKILL.md so a freshly-edited skill's triggers are immediately checked. Runs binary pass/fail evals (no scoring) per MindStudio's research.
 | claude-code |
| skill-gap-detector | skill | 0.1.0 | Use when the user wants to "find missing skills", "what skills should I have", "what am I explaining over and over", "/skill-gap", "audit my repeated instructions", or asks which skills they're missing based on session history. Also weekly cron-friendly. Scans recent session transcripts for "I had to explain X 3+ times" patterns and drafts proposed new SKILL.md files for human review. Does NOT auto-install.
 | claude-code |
| stuck-detector | skill | 0.1.0 | Use when the user says "stuck", "I'm stuck", "this isn't working", "tool keeps failing", "give up on this", "we're going in circles", "/stuck", or when the agent itself notices it has hit N consecutive tool errors in a session window. Generates a handoff summary so progress can resume in a fresh session, escalate to a stronger model, or pause for user input. Stops the doom-loop of blind retries.
 | claude-code |
| trace | hook | 0.1.0 | Append-only JSONL trace of every tool call in the session. Records `{ts, tool, args, status, duration_ms}` per `PostToolUse` event so later skills can audit what happened without an LLM. Use when the user types "/trace", "track tool calls", "trace this session", "audit tool history", or asks why the agent did something. The hook fires automatically on every tool call; the trigger phrases are mostly for the agent to surface the file path on demand.
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
| recall | hook | 0.1.0 | Auto-injects recent feedback memories and ADRs at session start so the agent has context from past learnings. Walks `~/.claude/projects/<project>/memory/` and `<repo>/docs/adr/` for the latest entries (default 5) and emits them as SessionStart additionalContext. Use when the user types "/recall", "what should I remember", "recent decisions", "load my memories", or asks about prior conclusions. Default ON; opt out by creating `.agent-config/recall.disabled` in the repo.
 | claude-code |

### tooling

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| career-interview | skill | 0.1.0 | This skill should be used when the user asks to "interview me", "build my career profile", "let's work on my resume background", "career interview", "start a career session", "update my profile", "let's talk about my experience", or invokes /career-interview. Conducts deep conversational interviews to build structured career profiles for technical professionals. | claude-code |
| clone-config | skill | 0.1.0 | Use when bootstrapping a fresh Mac/server, managing dotfiles, tracking shell configs, refreshing a Brewfile, adding ~/.zshrc to a dotfiles repo, or asking how to replicate a machine's config to a new device. Manages macOS (and Linux-compatible) machine config via chezmoi — install once, apply on every machine, edit source not target. | claude-code |
| datastar | skill | 0.1.0 | Use when building web applications with Datastar — the hypermedia framework that drives frontend reactivity from the backend using HTML data-* attributes and Server-Sent Events. Triggers on Datastar, data-star, SSE-driven UI, hypermedia framework, backend-driven frontend, data-signals, data-on, PatchElements, or any Go/Python web app using Datastar SDKs. | claude-code |
| datastar-patterns | skill | 0.1.0 | Use when implementing UI patterns with Datastar — search, inline editing, infinite scroll, file upload, validation, bulk operations, polling, lazy loading, progress indicators, or keyboard shortcuts. Triggers on data-* attributes, @get/@post/@put/@patch helpers, SSE response formatting, or any "how do I do X in Datastar" implementation question. | claude-code |
| defuddle | skill | 0.1.0 | Strip clutter from web pages before ingesting into the wiki. Removes ads, navigation, headers, footers, and boilerplate: leaving clean readable markdown that saves 40-60% tokens. Triggers on: defuddle, clean this page, strip this url, fetch and clean, clean web content before ingesting, strip ads, remove clutter, clean URL content, readable markdown from URL. | claude-code |
| deterministic-simulation-testing | skill | 0.1.0 | Use when building or testing distributed systems, consensus protocols, sync engines, replicated databases, or any system with network/disk/time non-determinism. Also use when tests are flaky due to concurrency, when debugging rare heisenbugs, or when asked about simulation testing, BUGGIFY, VOPR, or fault injection strategies. | claude-code |
| midscene-testing | skill | 0.1.0 | Use when performing ad-hoc browser testing, smoke testing workflows, validating UI after frontend changes, or testing Datastar/HTMX/SSE reactive features that unit tests cannot cover. Also use when consolidating Midscene HTML reports into a single navigable document. | claude-code |
| observability-engineer | agent | 0.1.0 | Build production-ready monitoring, logging, and tracing systems. Implements comprehensive observability strategies, SLI/SLO management, and incident response workflows. Use PROACTIVELY for monitoring infrastructure, performance optimization, or production reliability. | claude-code |
| obsidian-bases | skill | 0.1.0 | Create and edit Obsidian Bases (.base files): Obsidian's native database layer for dynamic tables, card views, list views, filters, formulas, and summaries over vault notes. Triggers on: create a base, add a base file, obsidian bases, base view, filter notes, formula, database view, dynamic table, task tracker base, reading list base. | claude-code |
| obsidian-canvas | skill | 0.1.0 | Visual layer of the wiki. Add images, text cards, PDFs, and wiki pages to Obsidian canvas files with auto-positioning inside zones. Integrates with /banana for image capture. Triggers on: /canvas, canvas new, canvas add image, canvas add text, canvas add pdf, canvas add note, canvas zone, canvas list, canvas from banana, add to canvas, put this on the canvas, open canvas, create canvas. | claude-code |
| obsidian-markdown | skill | 0.1.0 | Write correct Obsidian Flavored Markdown: wikilinks, embeds, callouts, properties, tags, highlights, math, and canvas syntax. Reference this when creating or editing any wiki page. Triggers on: write obsidian note, obsidian syntax, wikilink, callout, embed, obsidian markdown, wikilink format, callout syntax, embed syntax, obsidian formatting, how to write obsidian markdown. | claude-code |
| pikchr-generator | skill | 0.3.0 | Author production-grade technical diagrams in Pikchr — a deterministic,
text-defined diagram DSL that compiles to a single self-contained SVG.
Use whenever the user asks for a flowchart, sequence diagram, system
architecture, state machine, data pipeline, swim lane, or any
boxes-and-arrows technical illustration AND has expressed a preference
for text-defined / source-controlled diagrams (over excalidraw, figma,
or hand-drawn art). Also use when the user says "draw the architecture",
"diagram this flow", "show the states", "graph this topology", or
mentions pikchr by name. Output is themed SVG (16 themes via --theme NAME)
that renders inline in any Markdown surface that accepts SVG (GitHub,
GitLab, Obsidian, mdBook, agent multimodal Read, etc.). Do NOT use for
freeform sketches with curves and pen strokes (excalidraw), real
Gantt/pie charts (a chart library), or rich data viz.
 | apm, claude-code |
| shadcn-forms | skill | 0.1.0 | This skill should be used when generating React form components with shadcn/ui, wiring up react-hook-form with zod validation, choosing the right shadcn/ui input component for each field type, or when the user asks to "build a form with shadcn", "add form validation", "use react-hook-form", "create a zod schema for this form". Provides component selection guidance, validation patterns, and production-ready implementation recipes for shadcn/ui v4 forms.
 | claude-code |
| suit-build | skill | 0.1.0 | Use when building, validating, or scaffolding skills in this monorepo. Triggers: "validate skills", "build suit-build", "scaffold a new skill", "init a hook/agent/rules/plugin", "run suit-build", or any work on the multi-harness skill emission pipeline (Claude Code, APM, Codex, Gemini, Copilot CLI, Pi targets).
 | claude-code |
| vitaly | skill | 0.1.0 | This skill should be used when generating web form components, auditing form accessibility, reviewing form UX, or when the user asks to "check form accessibility", "audit this form", "apply form best practices", "make this form accessible", "review form UX". Also triggers on form generation tasks where the output is a React form component. Based on Vitaly Friedman's (Smashing Magazine) accessible web form design patterns.
 | claude-code |

### workflow

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| golang-pro | agent | 0.1.0 | Master Go 1.21+ with modern patterns, advanced concurrency, performance optimization, and production-ready microservices. Expert in the latest Go ecosystem including generics, workspaces, and cutting-edge frameworks. Use PROACTIVELY for Go development, architecture design, or performance optimization. | claude-code |
| orchestrator-mode | skill | 0.1.0 | Use at session start in the Darkish Factory repo to prime as the pipeline orchestrator (host mode). Loads the §7 loop, the 13-role roster, the escalation classifier, and the rules for converting subagent muscle memory into subharness dispatch. Invoke whenever the operator types a task and you're in this repo. | claude-code |
| subagent-to-subharness | skill | 0.1.0 | Use when you would normally dispatch a subagent via the Agent tool but you're operating as the Darkish Factory orchestrator. Translates the muscle memory into subharness dispatch. Maps task shapes to the right harness role, frames the task in caveman-standard, reads worker output back, decides next step. | claude-code |
| tts-announcer | hook | 0.1.0 | Local, offline voice announcements for Claude Code and Pi via Kokoro-82M TTS. Wires Notification + SubagentStop hooks so the terminal whispers progress instead of going *bing*. Useful when subagents run for minutes and you've wandered off. Use when the user wants TTS announcements, voice notifications, audible subagent feedback, or mentions "/tts", "speak", "announce", or "Kokoro". Audio never leaves the machine; no API keys.
 | claude-code, pi |

### Uncategorized

| Name | Type | Version | Description | Targets |
|------|------|---------|-------------|---------|
| aviation | persona | 1.0.0 | Aviation / flight planning work | claude-code, codex, copilot, gemini |
| backend | persona | 1.0.0 | Backend dev work — Go, observability, infra, philosophy | apm, claude-code, codex, copilot, gemini, pi |
| code | mode | 1.0.0 | Software development tasks: writing, reviewing, refactoring, debugging code. | apm, claude-code, codex, copilot, gemini, pi |
| design | mode | 1.0.0 | UI, UX, interaction, and visual design tasks. | apm, claude-code, codex, copilot, gemini, pi |
| focused | mode | 1.0.0 | Single-task deep focus, no scope creep | apm, claude-code, codex, copilot, gemini, pi |
| frontend | persona | 1.0.0 | Frontend / Datastar work | apm, claude-code, codex, copilot, gemini, pi |
| machines | persona | 1.0.0 | Machine + server management — chezmoi dotfiles, Doppler secrets, observability, infra changes | apm, claude-code, codex, copilot, gemini, pi |
| ops | mode | 1.0.0 | Operations, infrastructure, deployment, observability, and on-call work. | apm, claude-code, codex, copilot, gemini, pi |
| personal | persona | 1.0.0 | Personal projects, journaling, knowledge-base maintenance | apm, claude-code, codex, copilot, gemini, pi |
| taxes | persona | 1.0.0 | Tax preparation / non-code document work | claude-code, codex, copilot, gemini |
<!-- /AUTO-GENERATED: COMPONENTS -->

## Architecture

For the full build-tool reference, read [`skills/suit-build/SKILL.md`](skills/suit-build/SKILL.md). For the design rationale, see [`TAXONOMY.md`](TAXONOMY.md).

Per-harness emission honors a compatibility matrix enforced by `suit-build validate` — not every component type works on every harness. The validator rejects incompatible combinations and warns on best-effort ones. See the [suit repo](https://github.com/danmestas/suit) for source.

Component types: `skill`, `plugin`, `hook`, `agent`, `rules`, `mcp`. See the [suit repo](https://github.com/danmestas/suit) for the full manifest shape.

## Companion repos

Repos that aren't component bundles but pair naturally with `agent-config`:

- [`claude-hud-combo`](https://github.com/danmestas/claude-hud-combo) — Self-contained Deno statusline for Claude Code. Doesn't fit any of the six component types (it's a runtime artifact, not authored content), so it lives separately. Install with its own `install.sh`.
- [`meta-scout`](https://github.com/danmestas/meta-scout) — Library that powers the [`evolution-engine`](skills/evolution-engine) skill's deeper detection (12 behavioral signals, struggle-then-success arcs). The skill currently uses two inline detectors; once `meta-scout` publishes to npm or commits a built `dist/`, a follow-up PR wires its full signal catalog into the orchestrator.

## License

[MIT](LICENSE).
