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
