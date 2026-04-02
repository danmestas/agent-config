# Agent Skills

A collection of skills for AI coding agents. Skills are packaged instructions and optional scripts that extend agent capabilities.

Skills follow the Agent Skills format.

## Available Skills

### atlassian-cli-jira

Use when working with Atlassian CLI (acli) to install, authenticate, and manage Jira Cloud work items/issues from the command line.

### hipp

Software design principles from Dr. D. Richard Hipp (SQLite). Small, fast, reliable, self-contained, zero-config, and built to last decades.

### linear-method

Use when creating, organizing, or prioritizing issues in Linear. Covers the Linear Method best practices: issue writing, priority levels, enablers vs blockers, hierarchy, cycles, workflows, labels, relations, backlog hygiene, and project scoping.

### ousterhout

Software design principles from John Ousterhout's *A Philosophy of Software Design*. Minimizes complexity through deep modules, information hiding, and strategic programming.

### gh-project-setup

Create and configure GitHub Projects V2 with context-aware template selection. Supports 6 templates (kanban, bug-tracker, feature-development, roadmap, research, release-planning) with field override semantics. Handles multi-repo and organization projects.

### gh-project-operations

Daily GitHub project operations: create/list/update/delete issues, manage project items, bulk operations (batch/CSV/query-based), CSV export. Coordinates with charter skill for scope change detection.

### gh-project-charter

Progressive project charter documentation. Create charters from templates, update sections (goals/scope/success criteria), add new sections, track changes via changelog. Supports the full lifecycle from minimal charter to comprehensive documentation.

### gh-project-shared

Shared utilities for the gh-project-* skills (not directly invoked). Provides: gh CLI validation, authentication checking, config file management, context detection for template suggestions, and error handling with logging.

## Installation

Install all skills from this repo:

```bash
npx skills add danmestas/agent-skills
```

Install a single skill:

```bash
npx skills add danmestas/agent-skills --skill atlassian-cli-jira
```

Template form:

```bash
npx skills add <your-org>/<your-repo> --skill <skill-name>
```

## Usage

Skills are automatically available once installed. The agent will use them when relevant tasks are detected.

Examples:

```
Set up the Atlassian CLI and authenticate

Search Jira for ABC-123 and show details

Create a Jira work item and transition it to In Progress
```

## Skill Structure

Each skill contains:

- `SKILL.md` - Instructions for the agent (required)
- `scripts/` - Helper scripts for automation (optional)
- `references/` - Supporting documentation (optional)

## License

Add a license once you decide how this repo should be shared.
