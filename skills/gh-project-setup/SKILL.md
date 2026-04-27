---
name: gh-project-setup
version: 0.1.0
description: >-
  Use when creating new GitHub projects, setting up project boards, configuring
  kanban/scrum/roadmap boards, or applying project templates. Provides
  context-aware template suggestions based on repository analysis and
  conversation. Supports 6 templates: kanban, bug-tracker, feature-development,
  roadmap, research, release-planning. Handles multi-repo and organization
  projects.
type: skill
targets:
  - claude-code
category:
  primary: integrations
---

# GitHub Project Setup

Create and configure GitHub Projects V2 with context-aware template selection.

## When to Use

- Creating new GitHub project boards
- Setting up kanban/scrum/roadmap workflows
- Applying project templates
- Configuring custom fields
- Linking projects to repositories

## Prerequisites

- GitHub CLI (gh) v2.89.0+
- Authenticated with `project` scope
- Repository context (for auto-detection)

## Workflow

1. **Analyze Context** - Detect repository type and conversation intent
2. **Suggest Template** - Recommend appropriate template with reasoning
3. **Create Project** - Create project and link repositories
4. **Apply Template** - Configure fields based on template
5. **Save Config** - Write `.github/project-config.json`
6. **Suggest Charter** - Offer to create project charter

## Templates

### 1. Kanban (Simple Task Tracking)
**Fields:** Status, Priority
**Use Case:** General task tracking, simple projects
**Best For:** Small teams, straightforward workflows

### 2. Bug Tracker (Issue Triage)
**Fields:** Status, Severity (Critical/High/Medium/Low), Type
**Use Case:** Bug triage and resolution
**Best For:** Repos with high bug volume

### 3. Feature Development (Product Work)
**Fields:** Status, Priority, Size (XS/S/M/L/XL), Type
**Use Case:** Building new features
**Best For:** Product development workflows

### 4. Roadmap (Strategic Planning)
**Fields:** Status, Priority, Quarter (Q1/Q2/Q3/Q4)
**Use Case:** Strategic planning, quarterly goals
**Best For:** Long-term planning, executive visibility

### 5. Research & Spikes (Investigation)
**Fields:** Status, Outcome (Success/Learning/Blocked)
**Use Case:** Technical investigation, proof-of-concepts
**Best For:** R&D work, technical explorations

### 6. Release Planning (Version Management)
**Fields:** Status, Priority, Release (v1.0/v1.1/v2.0/Next)
**Use Case:** Release coordination, version management
**Best For:** Projects with formal release cycles

## Context Detection

The skill analyzes:
- **Repository structure**: package.json, CHANGELOG.md, docs/, etc.
- **Conversation**: Keywords like "bug", "release", "roadmap"
- **Git history**: Release tags, branch patterns

Scores all 6 templates (0-100) and recommends highest scoring with confidence level.

## Usage Example

```
User: "Set up a project board for our release planning"

Agent (using gh-project-setup):
1. Analyzes repo (finds CHANGELOG.md, releases/ folder)
2. Scores templates (release-planning: 85, feature-development: 60)
3. Suggests: "Release Planning template (high confidence)"
4. User approves
5. Creates project "Release Planning Q2 2026"
6. Applies template (Status, Priority, Release fields)
7. Saves config to .github/project-config.json
8. Asks: "Would you like to create a charter for this project?"
```

## Configuration Output

Creates `.github/project-config.json`:
```json
{
  "version": "1.0",
  "projects": [{
    "id": "PVT_...",
    "number": 1,
    "title": "Release Planning Q2 2026",
    "owner": "@me",
    "template": "release-planning",
    "fields": {
      "status_field_id": "PVTSSF_...",
      "priority_field_id": "PVTSSF_...",
      "release_field_id": "PVTSSF_..."
    },
    "field_options": {
      "priority": {"high": "...", "medium": "...", "low": "..."},
      "release": {"v1.0": "...", "v1.1": "...", ...}
    }
  }]
}
```

## Multi-Repository Support

### User Projects
```bash
# Links current repository automatically
"Create project" -> links repo where command runs
```

### Organization Projects
```bash
# User specifies multiple repos
"Create project for repos: api, web, mobile"
-> Creates org project, links all three
```

## Coordination

After successful setup, skill suggests:
```
"Project created successfully! Since this is a new [template-type] project,
 would you like me to create a project charter to document goals and scope?"

If yes -> Invokes @gh-project-charter
```

## Scripts

- `scripts/create-project.sh` - Create project, link repos
- `scripts/configure-fields.sh` - Create custom fields
- `scripts/apply-template.sh` - Apply template, save config

Uses shared utilities from @gh-project-shared

## Error Handling

- Missing gh CLI -> Guide installation
- Not authenticated -> Guide `gh auth login --web`
- Missing project scope -> Guide `gh auth refresh -s project`
- Template not found -> List available templates

All errors logged to `.github/project-errors.log`
