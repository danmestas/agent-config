---
name: gh-project-charter
version: 0.1.0
description: >-
  Use when creating project charters, documenting project goals/scope, defining
  success criteria, updating project documentation, or tracking scope changes
type: skill
targets:
  - claude-code
category:
  primary: integrations
---

# gh-project-charter

Project charter management skill for GitHub Projects V2. Creates, updates, and maintains project charter documents that define goals, scope, success criteria, and change history.

## Prerequisites

- `gh-project-shared` utilities (for gh CLI checks and config)
- Project created via `gh-project-setup` (recommended)

## Commands

### create

Create a new project charter from the minimal template.

```bash
gh-project-charter.sh create --project "My Project" --number 1 --goals "Build a CLI tool for project management"
```

Options:
- `--project NAME` - Project name (required)
- `--number NUM` - GitHub project number (required)
- `--goals "text"` - Initial goals description

Output: `docs/project-charter.md`

### update-section

Update an existing section in the charter.

```bash
# Replace section content entirely
gh-project-charter.sh update-section "Goals" --replace "New goals text here"

# Append to a subsection
gh-project-charter.sh update-section "In Scope" --append "- New deliverable item"
```

Options:
- `--replace "text"` - Replace the section content entirely
- `--append "text"` - Append content to a subsection

### add-section

Add a new optional section to the charter (inserted before Change Log).

```bash
gh-project-charter.sh add-section "Timeline" --content "Q1: Design phase\nQ2: Implementation"
```

Options:
- `--content "text"` - Content for the new section

### log-change

Add an entry to the Change Log section.

```bash
gh-project-charter.sh log-change "Expanded scope to include API integration"
```

### view

Display the current project charter.

```bash
gh-project-charter.sh view
```

## Progressive Enhancement Workflow

The charter skill supports progressive enhancement -- start minimal and add detail as the project evolves:

1. **Create** a charter with basic goals
2. **Update sections** as scope becomes clearer
3. **Add sections** (Timeline, Risks, Dependencies) when needed
4. **Log changes** to maintain an audit trail

```bash
# Day 1: Create minimal charter
gh-project-charter.sh create --project "Auth Rewrite" --number 5 --goals "Replace legacy auth with OAuth2"

# Week 1: Define scope
gh-project-charter.sh update-section "In Scope" --append "- OAuth2 provider integration"
gh-project-charter.sh update-section "In Scope" --append "- Token refresh mechanism"
gh-project-charter.sh update-section "Out of Scope" --append "- SAML support (future phase)"

# Week 2: Add timeline
gh-project-charter.sh add-section "Timeline" --content "- Week 1-2: Design\n- Week 3-4: Implementation\n- Week 5: Testing"
gh-project-charter.sh log-change "Added timeline after sprint planning"

# Ongoing: Track scope changes
gh-project-charter.sh update-section "In Scope" --append "- Session management migration"
gh-project-charter.sh log-change "Added session management to scope per stakeholder request"
```

## Coordination with Operations

The `gh-project-operations` skill's coordinator detects scope-changing operations (milestone additions, epic labels) and suggests updating the charter. When notified:

1. Review the suggested change
2. Update the relevant charter section
3. Log the change for audit trail

## Template Structure

The minimal charter template includes:

| Section | Purpose |
|---------|---------|
| Goals | Why the project exists |
| Scope (In/Out) | What will and won't be delivered |
| Success Criteria | How success is measured |
| Change Log | Audit trail of charter modifications |

Optional sections added via `add-section`:
- Timeline (milestones, deadlines)
- Deliverables (specific outputs)
- Risks & Assumptions
- Dependencies (blockers, prerequisites)
- Resources (team, budget)
- Communication Plan

## Library Functions

When sourcing scripts directly:

### charter-create.sh
- `generate_charter(name, num, purpose)` - Generate a charter from the template
- `populate_template(template, name, num)` - Replace template placeholders
- `add_changelog_entry(file, entry)` - Add a timestamped change log entry

### charter-sections.sh
- `update_section(file, section, content)` - Replace section content
- `add_to_section(file, section, content)` - Append to a subsection
- `add_new_section(file, section, content)` - Insert a new section before Change Log
- `get_section(file, section)` - Extract section content

## Integration Points

- **gh-project-shared**: Uses gh-check.sh and gh-auth.sh for prerequisite validation
- **gh-project-setup**: Charters are created after project setup
- **gh-project-operations**: Operations coordinator suggests charter updates on scope changes
