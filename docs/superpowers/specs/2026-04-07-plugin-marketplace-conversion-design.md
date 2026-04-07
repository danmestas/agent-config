# Plugin Marketplace Conversion

Convert the flat `skills/` repo into a Claude Code plugin marketplace with themed plugin bundles.

## Context

The `agent-skills` repo currently hosts 15 standalone skills in a flat `skills/` directory using a custom format. The goal is to restructure into the Claude Code plugin marketplace format so skills are installable as themed plugins. Additionally, pull in the `career-interview` plugin from the `danmestas/agent-plugins` repo.

## Plugin Grouping

Six plugins, each a themed bundle:

| Plugin | Skills | Theme |
|--------|--------|-------|
| **software-philosophy** | tigerstyle, hipp, ousterhout, norman, dx-audit, idiomatic-go | Adversarial proofing for code & plans (GAN modules) |
| **gh-project-management** | gh-project-setup, gh-project-operations, gh-project-charter, gh-project-shared | GitHub project management |
| **project-management** | linear-method, atlassian-cli-jira | Issue tracking (Linear + Jira) |
| **dev-tools** | doppler, midscene-testing, deterministic-simulation-testing | Development/testing utilities |
| **apple-contacts** | apple-contacts | macOS contacts management |
| **career-interview** | career-interview | Career profile building (from agent-plugins repo) |

## Target Structure

```
agent-skills/
├── .claude-plugin/
│   └── marketplace.json
├── plugins/
│   ├── software-philosophy/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── skills/
│   │   │   ├── tigerstyle/SKILL.md
│   │   │   ├── hipp/SKILL.md
│   │   │   ├── ousterhout/SKILL.md
│   │   │   ├── norman/SKILL.md
│   │   │   ├── dx-audit/SKILL.md
│   │   │   └── idiomatic-go/SKILL.md
│   │   └── README.md
│   ├── gh-project-management/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── skills/
│   │   │   ├── gh-project-setup/      (SKILL.md, scripts/, templates/)
│   │   │   ├── gh-project-operations/ (SKILL.md, scripts/, tests/)
│   │   │   ├── gh-project-charter/    (SKILL.md, scripts/, templates/, tests/)
│   │   │   └── gh-project-shared/     (SKILL.md, scripts/, references/, tests/)
│   │   └── README.md
│   ├── project-management/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── skills/
│   │   │   ├── linear-method/SKILL.md
│   │   │   └── atlassian-cli-jira/SKILL.md
│   │   └── README.md
│   ├── dev-tools/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── skills/
│   │   │   ├── doppler/SKILL.md
│   │   │   ├── midscene-testing/     (SKILL.md, merge-reports.mjs)
│   │   │   └── deterministic-simulation-testing/SKILL.md
│   │   └── README.md
│   ├── apple-contacts/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── skills/apple-contacts/SKILL.md
│   │   └── README.md
│   └── career-interview/
│       ├── .claude-plugin/plugin.json
│       ├── .mcp.json
│       ├── commands/setup.md
│       ├── skills/career-interview/  (SKILL.md, references/)
│       └── README.md
├── README.md
├── AGENTS.md
└── .gitignore
```

## Implementation Details

### Marketplace Manifest

Root `.claude-plugin/marketplace.json` registers all six plugins:

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "agent-skills",
  "description": "Claude Code plugins for software philosophy, project management, dev tools, and productivity",
  "owner": {
    "name": "Daniel Mestas",
    "email": "dan5446@gmail.com"
  },
  "plugins": [
    {
      "name": "software-philosophy",
      "description": "Adversarial proofing for code and plans — TigerStyle, Hipp, Ousterhout, Norman, DX Audit, Idiomatic Go",
      "source": "./plugins/software-philosophy",
      "category": "development"
    },
    {
      "name": "gh-project-management",
      "description": "GitHub project management — setup, operations, charters, and shared utilities",
      "source": "./plugins/gh-project-management",
      "category": "project-management"
    },
    {
      "name": "project-management",
      "description": "Issue tracking with Linear Method best practices and Atlassian CLI Jira",
      "source": "./plugins/project-management",
      "category": "project-management"
    },
    {
      "name": "dev-tools",
      "description": "Development utilities — Doppler secrets, Midscene browser testing, deterministic simulation testing",
      "source": "./plugins/dev-tools",
      "category": "development"
    },
    {
      "name": "apple-contacts",
      "description": "Manage Apple Contacts via the contactbook CLI on macOS",
      "source": "./plugins/apple-contacts",
      "category": "productivity"
    },
    {
      "name": "career-interview",
      "description": "Conversational career interview that builds structured profiles for resume generation",
      "source": "./plugins/career-interview",
      "category": "productivity"
    }
  ]
}
```

### Plugin Manifests

Each plugin gets a `.claude-plugin/plugin.json`. Example for software-philosophy:

```json
{
  "name": "software-philosophy",
  "version": "1.0.0",
  "description": "Adversarial proofing for code and plans — TigerStyle, Hipp, Ousterhout, Norman, DX Audit, Idiomatic Go",
  "author": {
    "name": "Daniel Mestas",
    "email": "dan5446@gmail.com"
  },
  "license": "MIT",
  "keywords": ["software-design", "code-review", "adversarial", "philosophy"]
}
```

### Migration Steps

1. Create `plugins/` directory with all six plugin subdirectories
2. Create `.claude-plugin/` directories and `plugin.json` for each plugin
3. Move skills from `skills/` into their respective `plugins/<name>/skills/` directories (preserving all subdirectories — scripts, templates, tests, references)
4. Copy `career-interview` from `/tmp/agent-plugins/plugins/career-interview/` into `plugins/career-interview/`
5. Create root `.claude-plugin/marketplace.json`
6. Create per-plugin `README.md` files
7. Remove the now-empty `skills/` directory
8. Clean up root-level docs: move `GH_PROJECT_SETUP_GUIDE.md` into `plugins/gh-project-management/`
9. Remove `SUPERPOWERS_ARCHITECTURE.md` (not part of the plugins)
10. Update root `README.md` to document the marketplace and installation
11. Update `.gitignore`
12. Update `AGENTS.md` to reflect new structure

### Root README

Updated to serve as a marketplace landing page with:
- Description of the marketplace
- Table of available plugins with descriptions
- Installation instructions for individual plugins and the full marketplace
- Link to each plugin's README for details

### What Gets Removed

- `skills/` directory (contents moved to plugins)
- `GH_PROJECT_SETUP_GUIDE.md` (moved into gh-project-management plugin)
- `SUPERPOWERS_ARCHITECTURE.md` (not relevant to plugin marketplace)
- `.tmp` file

### What Stays

- `AGENTS.md` (updated for new structure)
- `LICENSE`
- `.gitignore` (updated)
