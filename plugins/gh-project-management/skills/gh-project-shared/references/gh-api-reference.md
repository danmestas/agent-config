# GitHub Projects API Reference

Quick reference for gh CLI commands used in the gh-project-* skills.

## Prerequisites

```bash
# Check gh CLI version
gh --version  # Need v2.89.0+

# Check authentication
gh auth status

# Refresh with project scope if needed
gh auth refresh -s project
```

## Projects

### List Projects
```bash
# User projects
gh project list --owner @me

# Organization projects
gh project list --owner orgname

# Include closed
gh project list --owner @me --closed

# JSON output
gh project list --owner @me --format json
```

### Create Project
```bash
# Basic creation
gh project create --owner @me --title "Project Title"

# Get project number from output
gh project create --owner @me --title "My Board" --format json | jq -r '.number'
```

### View Project
```bash
# View in terminal
gh project view 1 --owner @me

# View as JSON
gh project view 1 --owner @me --format json

# Open in browser
gh project view 1 --owner @me --web
```

### Edit Project
```bash
# Update title
gh project edit 1 --owner @me --title "New Title"

# Update description
gh project edit 1 --owner @me --description "Project description"

# Set visibility
gh project edit 1 --owner @me --visibility PUBLIC  # or PRIVATE
```

### Link Project to Repository
```bash
# Link to current repo
gh project link 1 --owner @me

# Link to specific repo
gh project link 1 --owner @me --repo owner/repo-name
```

## Fields

### List Fields
```bash
# Get all fields
gh project field-list 1 --owner @me

# JSON output with field IDs
gh project field-list 1 --owner @me --format json
```

### Create Field
```bash
# Text field
gh project field-create 1 --owner @me \
  --name "Notes" \
  --data-type TEXT

# Date field
gh project field-create 1 --owner @me \
  --name "Due Date" \
  --data-type DATE

# Number field
gh project field-create 1 --owner @me \
  --name "Story Points" \
  --data-type NUMBER

# Single-select field (dropdown)
gh project field-create 1 --owner @me \
  --name "Priority" \
  --data-type SINGLE_SELECT \
  --single-select-options "High,Medium,Low"
```

### Delete Field
```bash
gh project field-delete --id "PVTF_..."
```

## Items

### List Items
```bash
# List all items in project
gh project item-list 1 --owner @me

# JSON output
gh project item-list 1 --owner @me --format json
```

### Add Item to Project
```bash
# Add existing issue
gh project item-add 1 --owner @me \
  --url https://github.com/owner/repo/issues/123

# Add existing PR
gh project item-add 1 --owner @me \
  --url https://github.com/owner/repo/pull/456
```

### Create Draft Issue in Project
```bash
gh project item-create 1 --owner @me \
  --title "Draft issue title" \
  --body "Draft issue body"
```

### Update Item Fields
```bash
# Update text field
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$FIELD_ID" \
  --text "value"

# Update date field
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$FIELD_ID" \
  --date "2026-04-15"

# Update number field
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$FIELD_ID" \
  --number 5

# Update single-select field
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$FIELD_ID" \
  --single-select-option-id "$OPTION_ID"

# Clear field
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$FIELD_ID" \
  --clear
```

### Archive Item
```bash
gh project item-archive \
  --id "$ITEM_ID" \
  --owner @me
```

### Delete Item
```bash
gh project item-delete --id "$ITEM_ID"
```

## Issues

### Create Issue
```bash
# Basic
gh issue create --title "Issue title" --body "Issue body"

# With labels and assignee
gh issue create \
  --title "Bug found" \
  --body "Description" \
  --label bug \
  --label urgent \
  --assignee @me

# Add to project on creation
gh issue create \
  --title "New feature" \
  --body "Description" \
  --project "Project Title"
```

### List Issues
```bash
# List all open issues
gh issue list

# Filter by label
gh issue list --label bug

# JSON output
gh issue list --json number,title,url
```

### View Issue
```bash
gh issue view 123
```

### Edit Issue
```bash
# Update title
gh issue edit 123 --title "New title"

# Add labels
gh issue edit 123 --add-label enhancement

# Change assignee
gh issue edit 123 --add-assignee @me
```

## Useful Patterns

### Get Project ID
```bash
PROJECT_ID=$(gh project view 1 --owner @me --format json | jq -r '.id')
```

### Get Field ID by Name
```bash
FIELD_ID=$(gh project field-list 1 --owner @me --format json | \
  jq -r '.fields[] | select(.name == "Priority") | .id')
```

### Get Option ID by Name
```bash
OPTION_ID=$(gh project field-list 1 --owner @me --format json | \
  jq -r '.fields[] | select(.name == "Priority") | .options[] | select(.name == "High") | .id')
```

### Get Item ID by Title
```bash
ITEM_ID=$(gh project item-list 1 --owner @me --format json | \
  jq -r '.items[] | select(.title == "Issue title") | .id')
```

## Rate Limiting

- GitHub API: 5000 requests/hour for authenticated users
- Check remaining: `gh api rate_limit`
- On 429 error: wait for reset time in response headers

## Error Codes

- 0: Success
- 1: General error
- 404: Resource not found
- 429: Rate limit exceeded
- 403: Forbidden (check scopes)

## Resources

- gh CLI Manual: https://cli.github.com/manual/
- GitHub Projects API: https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects
