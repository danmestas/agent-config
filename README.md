# Agent Skills

A collection of skills for AI coding agents. Skills are packaged instructions and optional scripts that extend agent capabilities beyond their default behavior.

Skills follow the [Agent Skills format](https://github.com/anthropics/agent-skills).

## Available Skills

### Design & Architecture

| Skill | Description |
|-------|-------------|
| [hipp](skills/hipp) | Dr. D. Richard Hipp's software design philosophy (SQLite, Fossil SCM). Small, fast, reliable, self-contained, zero-config, built to last decades. |
| [ousterhout](skills/ousterhout) | John Ousterhout's *A Philosophy of Software Design*. Deep modules, information hiding, strategic programming, minimizing cognitive load. |
| [tigerstyle](skills/tigerstyle) | TigerBeetle's coding style for safety-critical systems. Safety > Performance > DX, zero technical debt, NASA Power of Ten rules, assertion-heavy development. |

### Language-Specific

| Skill | Description |
|-------|-------------|
| [idiomatic-go](skills/idiomatic-go) | Jon Bodner's *Learning Go* idiomatic patterns. Anti-patterns table for error handling, slices, interfaces, concurrency, and design. Clarity over cleverness. |

### UI & Interaction Design

| Skill | Description |
|-------|-------------|
| [norman](skills/norman) | Don Norman's principles of interaction design. Affordances, signifiers, mapping, feedback, conceptual models, constraints, and error prevention. |
| [dx-audit](skills/dx-audit) | Systematic DX/UX scoring by enumerating real workflows, identifying friction, and calculating weighted scores with ranked improvements. |

### Project Management

| Skill | Description |
|-------|-------------|
| [linear-method](skills/linear-method) | The Linear Method for issue management. Plain-language issues, 4-priority system, hierarchy, cycles, and backlog hygiene. |
| [atlassian-cli-jira](skills/atlassian-cli-jira) | Manage Jira Cloud via Atlassian CLI (acli). Search, create, edit, transition, comment, link, bulk operations, and sprint discovery. |
| [gh-project-setup](skills/gh-project-setup) | Create and configure GitHub Projects V2 with context-aware template selection (kanban, bug-tracker, feature-dev, roadmap, research, release-planning). |
| [gh-project-operations](skills/gh-project-operations) | Daily GitHub Projects V2 operations. CRUD on issues, status changes, bulk operations, CSV import/export, and charter coordination. |
| [gh-project-charter](skills/gh-project-charter) | Project charter management for GitHub Projects V2. Goals, scope, success criteria, and change logging with progressive enhancement. |
| [gh-project-shared](skills/gh-project-shared) | Shared utilities for the gh-project-* skills. CLI validation, auth checking, config management, and error handling. Not directly invoked. |

### Testing

| Skill | Description |
|-------|-------------|
| [deterministic-simulation-testing](skills/deterministic-simulation-testing) | Collapse distributed systems into single-threaded simulations with controlled non-determinism. BUGGIFY fault injection, VOPR patterns, invariant checking. |
| [midscene-testing](skills/midscene-testing) | Screenshot-driven browser smoke testing via Midscene's headless Puppeteer mode. Ad-hoc UI validation, Datastar/HTMX/SSE testing, report consolidation. |

### Web Frameworks

| Skill | Description |
|-------|-------------|
| [datastar-tao](skills/datastar-tao) | The Tao of Datastar — philosophy for hypermedia-driven web apps. Backend owns state, SSE, HTML-over-the-wire, DOM morphing. |
| [datastar-patterns](skills/datastar-patterns) | Datastar UI implementation patterns — search, inline editing, infinite scroll, file upload, validation, bulk operations, polling. |

### Observability

| Skill | Description |
|-------|-------------|
| [signoz-dashboard-builder](skills/signoz-dashboard-builder) | Create and update SigNoz dashboards via MCP API. Panels for metrics, logs, traces, and Claude Code telemetry. |

### Knowledge Management

| Skill | Description |
|-------|-------------|
| [knowledge-base](skills/knowledge-base) | LLM-maintained knowledge bases as Obsidian-compatible wikis. Ingest sources, query accumulated research, lint for consistency. |

### Code Search

| Skill | Description |
|-------|-------------|
| [mgrep-code-search](skills/mgrep-code-search) | Semantic code search using mgrep. Natural language queries across code, text, PDFs, and images. Complements grep/ripgrep for finding features, understanding intent, and exploring unfamiliar codebases. |

### Agent Tooling

| Skill | Description |
|-------|-------------|
| [apm-builder](skills/apm-builder) | Build and distribute APM (Agent Package Manager) bundles. Scaffold packages, author primitives (skills, agents, instructions, hooks), target Claude Code/Copilot/Cursor, and export plugins. Full CLI reference included. |

### DevOps & Utilities

| Skill | Description |
|-------|-------------|
| [doppler](skills/doppler) | Migrate `.env` files to Doppler secrets management. Detect secrets, create projects, push to Doppler, and set up multi-environment configs. |
| [apple-contacts](skills/apple-contacts) | Manage Apple Contacts from the terminal via `contactbook` CLI. Full CRUD, group management, search by name/phone/email/org. macOS only. |
| [cloudflare-email](skills/cloudflare-email) | Send outbound email from a Cloudflare-hosted domain via REST API or Workers binding. No SMTP — complements Email Routing for full send/receive without a mailbox provider. |

## Installation

Install all skills from this repo:

```bash
npx skills add danmestas/agent-skills
```

Install a single skill:

```bash
npx skills add danmestas/agent-skills --skill <skill-name>
```

Example:

```bash
npx skills add danmestas/agent-skills --skill tigerstyle
```

## Usage

Skills are automatically available once installed. The agent uses them when relevant tasks are detected.

Examples:

```
Write a Go HTTP handler with proper error handling     # triggers idiomatic-go
Review this module for unnecessary complexity          # triggers ousterhout
Audit the DX of this CLI tool                          # triggers dx-audit
Set up a GitHub project board for this repo            # triggers gh-project-setup
Create a Jira issue for ABC-123                        # triggers atlassian-cli-jira
Migrate my .env files to Doppler                       # triggers doppler
Build a Datastar search component                      # triggers datastar-patterns
Ingest this article into my research wiki              # triggers knowledge-base
Where is authentication handled in this codebase?      # triggers mgrep-code-search
```

## Skill Structure

Each skill contains:

- `SKILL.md` - Instructions for the agent (required)
- `scripts/` - Helper scripts for automation (optional)
- `references/` - Supporting documentation (optional)

## License

MIT
