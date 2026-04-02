---
name: gh-project-operations
description: "Use when adding/updating/deleting issues in projects, changing item statuses, bulk operations, archiving items, or managing project boards daily"
---

# gh-project-operations

Daily operations skill for GitHub Projects V2. Provides CRUD operations on issues, project item management, bulk operations, CSV import/export, and charter coordination.

## Prerequisites

- GitHub CLI (`gh`) v2.89.0+ installed and authenticated
- `jq` for JSON processing
- Project configured via `gh-project-setup` (for item management operations)
- `.github/project-config.json` present (for field/option ID lookups)

## Operations

### Issue CRUD

```bash
# Create an issue
gh-project-operations.sh create --title "Bug fix" --body "Description" --label bug --assignee @me

# List issues
gh-project-operations.sh list --filter "is:open label:bug"

# Update an issue
gh-project-operations.sh update --issue 123 --title "New title" --label enhancement

# Delete an issue
gh-project-operations.sh delete --issue 123
```

### Project Item Management

```bash
# Add issue to project
gh-project-operations.sh add --project 1 --url https://github.com/user/repo/issues/5

# Archive completed items
gh-project-operations.sh archive --project 1
```

### Bulk Operations

```bash
# Bulk update status
gh-project-operations.sh bulk --project 1 --from "Todo" --to "In Progress"

# Bulk archive (mode flag)
gh-project-operations.sh bulk --project 1 --mode archive
```

### Export

```bash
# Export project to CSV
gh-project-operations.sh export --project 1 --output project-items.csv
```

## Bulk Operation Modes

| Mode | Description |
|------|-------------|
| `array` | Create issues from pipe-delimited array (`title\|body\|labels`) |
| `csv` | Import issues from CSV file with header row |
| `status` | Update all items matching a status to a new status |
| `archive` | Archive all items with "Done" status |

## Library Functions

These functions are available when sourcing the scripts directly:

### issue-crud.sh
- `create_issue(title, body, labels, assignee)` - Create a GitHub issue
- `list_issues(filter)` - List issues with optional search filter
- `update_issue(issue_number, title, body, labels)` - Edit an existing issue
- `delete_issue(issue_number)` - Delete an issue (with --yes confirmation)

### item-management.sh
- `add_issue_to_project(project_num, issue_url)` - Add an issue to a project board
- `update_item_field(item_id, field_name, value, field_type)` - Update a project item field (supports SINGLE_SELECT, TEXT, DATE, NUMBER)
- `archive_item(item_id)` - Archive a project item
- `list_project_items(project_num)` - List all items in a project (JSON format)

### bulk-operations.sh
- `bulk_create_issues(mode, data)` - Create multiple issues (array or CSV mode)
- `bulk_update_status(project_num, from_status, to_status)` - Move items between statuses
- `bulk_archive_completed(project_num)` - Archive all "Done" items
- `import_from_csv(csv_file)` - Import issues from a CSV file
- `export_to_csv(project_num, output_file)` - Export project items to CSV

### coordinator.sh
- `detect_scope_change(op_type, value)` - Check if an operation implies a scope change
- `suggest_charter_update(op_type, value)` - Suggest updating the project charter

## Coordination with gh-project-charter

The coordinator automatically detects scope-changing operations:
- Adding a **milestone** triggers a scope change notification
- Adding labels like **blocked**, **dependency**, **epic**, or **initiative** triggers a scope change notification

When a scope change is detected, the skill suggests updating the project charter via `gh-project-charter`.

## Examples

### Create and track a bug
```bash
# Create the issue
gh-project-operations.sh create --title "Fix login timeout" --body "Users report 30s timeout" --label bug

# Add to project board
gh-project-operations.sh add --project 1 --url https://github.com/user/repo/issues/42

# Move to In Progress
gh-project-operations.sh bulk --project 1 --from "Todo" --to "In Progress"
```

### Bulk import from CSV
```csv
title,body,labels
Setup CI pipeline,Configure GitHub Actions,infrastructure
Add unit tests,Cover auth module,testing
Update docs,API reference refresh,documentation
```

```bash
gh-project-operations.sh bulk --mode csv --file issues.csv
```

### End-of-sprint cleanup
```bash
# Archive completed items
gh-project-operations.sh archive --project 1

# Export current state
gh-project-operations.sh export --project 1 --output sprint-report.csv
```

## Integration Points

- **gh-project-shared**: Uses config-manager.sh for project/field ID lookups, gh-check.sh and gh-auth.sh for prerequisite validation
- **gh-project-setup**: Expects projects to be created and configured before item operations
- **gh-project-charter**: Coordinator suggests charter updates when scope changes are detected
