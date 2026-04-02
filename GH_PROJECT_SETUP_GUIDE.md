# GitHub Projects Setup & Configuration Guide via CLI

Complete guide to creating and configuring GitHub Projects using `gh` CLI.

## 📋 Table of Contents
1. [What You Can Do](#what-you-can-do)
2. [Default Project Setup](#default-project-setup)
3. [Creating a New Project](#creating-a-new-project)
4. [Custom Fields & Status Columns](#custom-fields--status-columns)
5. [Adding & Managing Items](#adding--managing-items)
6. [Complete Example Workflow](#complete-example-workflow)
7. [Advanced Configuration](#advanced-configuration)

---

## What You Can Do

✅ **Full Project Management:**
- Create projects (user or organization)
- Edit title, description, readme, visibility
- Link projects to repositories or teams
- Delete, close, copy projects
- Mark projects as templates

✅ **Custom Fields (Columns):**
- Create custom fields with different data types:
  - `TEXT` - Text input
  - `SINGLE_SELECT` - Dropdown with options (like Status columns)
  - `DATE` - Date picker
  - `NUMBER` - Numeric values
- Delete custom fields
- List all fields with IDs

✅ **Status/Column Management:**
- Default "Status" field comes with: Todo, In Progress, Done
- Create additional SINGLE_SELECT fields for custom workflows
- Update item statuses programmatically

✅ **Item Management:**
- Add existing issues/PRs to projects
- Create draft issues directly in projects
- Edit item field values (status, priority, dates, etc.)
- Archive items
- List all items in a project

---

## Default Project Setup

When you create a new project, it comes with **10 default fields:**

```json
{
  "Title": "Built-in text field",
  "Assignees": "Built-in assignee field",
  "Status": {
    "type": "SINGLE_SELECT",
    "options": ["Todo", "In Progress", "Done"]
  },
  "Labels": "Built-in labels field",
  "Linked pull requests": "Built-in PR links",
  "Reviewers": "Built-in reviewers field",
  "Repository": "Built-in repo field",
  "Milestone": "Built-in milestone field",
  "Parent issue": "Built-in parent issue tracking",
  "Sub-issues progress": "Built-in sub-issue progress"
}
```

**The "Status" field is what replaced the old "columns" concept!**

---

## Creating a New Project

### Basic Project Creation

```bash
# Create project for current user
gh project create --owner @me --title "Product Roadmap"

# Create project for an organization
gh project create --owner myorg --title "Team Sprint Board"
```

### Project Configuration

```bash
# Edit project details
gh project edit 1 --owner @me \
  --title "Q2 2026 Roadmap" \
  --description "Product roadmap for Q2" \
  --visibility PUBLIC

# Add a README (markdown supported)
gh project edit 1 --owner @me --readme "# Welcome\nThis is our project board."

# Link to a repository (enables automatic issue/PR detection)
gh project link 1 --owner @me --repo agent-skills

# Link to an organization team
gh project link 1 --owner myorg --team engineering
```

### List & View Projects

```bash
# List all your projects
gh project list --owner @me

# Include closed projects
gh project list --owner @me --closed

# View project details
gh project view 1 --owner @me

# View as JSON
gh project view 1 --owner @me --format json | jq '.'

# Open in browser
gh project view 1 --owner @me --web
```

---

## Custom Fields & Status Columns

### Understanding Field Types

GitHub Projects V2 uses **custom fields** instead of the old column system. The key field type for status/columns is **SINGLE_SELECT**.

### Creating Status/Column Fields

```bash
# Create a Priority field (like a column with options)
gh project field-create 1 --owner @me \
  --name "Priority" \
  --data-type SINGLE_SELECT \
  --single-select-options "Critical,High,Medium,Low"

# Create a Sprint/Stage field
gh project field-create 1 --owner @me \
  --name "Sprint" \
  --data-type SINGLE_SELECT \
  --single-select-options "Backlog,Sprint 1,Sprint 2,Sprint 3,Done"

# Create a Team field
gh project field-create 1 --owner @me \
  --name "Team" \
  --data-type SINGLE_SELECT \
  --single-select-options "Frontend,Backend,DevOps,Design"

# Create a Size/Effort field
gh project field-create 1 --owner @me \
  --name "Size" \
  --data-type SINGLE_SELECT \
  --single-select-options "XS,S,M,L,XL"
```

### Creating Other Field Types

```bash
# Date fields
gh project field-create 1 --owner @me \
  --name "Due Date" \
  --data-type DATE

gh project field-create 1 --owner @me \
  --name "Start Date" \
  --data-type DATE

# Number fields
gh project field-create 1 --owner @me \
  --name "Story Points" \
  --data-type NUMBER

gh project field-create 1 --owner @me \
  --name "Estimated Hours" \
  --data-type NUMBER

# Text fields
gh project field-create 1 --owner @me \
  --name "Notes" \
  --data-type TEXT

gh project field-create 1 --owner @me \
  --name "Dependencies" \
  --data-type TEXT
```

### Managing Fields

```bash
# List all fields (get IDs for editing)
gh project field-list 1 --owner @me --format json | jq '.fields[] | {name, id, type}'

# Delete a field
gh project field-delete --id "PVTF_..."
```

**Note:** You cannot modify existing SINGLE_SELECT options via CLI (must use web UI). You can only create new fields or delete them.

---

## Adding & Managing Items

### Adding Items to Projects

```bash
# Add an existing issue to project
gh project item-add 1 --owner @me \
  --url https://github.com/danmestas/agent-skills/issues/5

# Add an existing PR to project
gh project item-add 1 --owner @me \
  --url https://github.com/danmestas/agent-skills/pull/1

# Create a draft issue directly in the project
gh project item-create 1 --owner @me \
  --title "Research new authentication system" \
  --body "Investigate OAuth2 options and compare providers"
```

### Creating Issues and Adding to Project

```bash
# Create issue and add to project in one command
gh issue create \
  --title "Fix login bug" \
  --body "Users can't login with special characters in password" \
  --label bug \
  --assignee @me \
  --project "Product Roadmap"
```

### Updating Item Field Values

**Important:** You need the item ID and field ID to update values.

```bash
# 1. Get item ID
ITEM_ID=$(gh project item-list 1 --owner @me --format json | \
  jq -r '.items[] | select(.title == "Fix login bug") | .id')

# 2. Get field ID
FIELD_ID=$(gh project field-list 1 --owner @me --format json | \
  jq -r '.fields[] | select(.name == "Priority") | .id')

# 3. Get project ID
PROJECT_ID=$(gh project view 1 --owner @me --format json | jq -r '.id')

# 4. Get single-select option ID
OPTION_ID=$(gh project field-list 1 --owner @me --format json | \
  jq -r '.fields[] | select(.name == "Priority") | .options[] | select(.name == "High") | .id')

# 5. Update the item
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$FIELD_ID" \
  --single-select-option-id "$OPTION_ID"
```

### Other Update Types

```bash
# Update text field
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$TEXT_FIELD_ID" \
  --text "Some notes here"

# Update date field
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$DATE_FIELD_ID" \
  --date "2026-04-15"

# Update number field
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$NUMBER_FIELD_ID" \
  --number 5

# Clear a field value
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$FIELD_ID" \
  --clear
```

### Managing Items

```bash
# List all items in project
gh project item-list 1 --owner @me

# Get detailed item info as JSON
gh project item-list 1 --owner @me --format json | jq '.'

# Archive an item
gh project item-archive --id "$ITEM_ID" --owner @me --project-id "$PROJECT_ID"

# Delete an item completely
gh project item-delete --id "$ITEM_ID"
```

---

## Complete Example Workflow

Here's a complete workflow to set up a Kanban-style project:

```bash
#!/bin/bash

# 1. Create the project
PROJECT_NUM=$(gh project create --owner @me --title "Product Roadmap Q2 2026" --format json | jq -r '.number')
echo "Created project #$PROJECT_NUM"

# 2. Link to repository
gh project link $PROJECT_NUM --owner @me --repo agent-skills
echo "Linked to repository"

# 3. Create custom fields
echo "Creating custom fields..."

# Priority field
gh project field-create $PROJECT_NUM --owner @me \
  --name "Priority" \
  --data-type SINGLE_SELECT \
  --single-select-options "Critical,High,Medium,Low"

# Sprint field
gh project field-create $PROJECT_NUM --owner @me \
  --name "Sprint" \
  --data-type SINGLE_SELECT \
  --single-select-options "Backlog,Sprint 1,Sprint 2,Sprint 3,Done"

# Size field
gh project field-create $PROJECT_NUM --owner @me \
  --name "Size" \
  --data-type SINGLE_SELECT \
  --single-select-options "XS,S,M,L,XL"

# Story Points field
gh project field-create $PROJECT_NUM --owner @me \
  --name "Story Points" \
  --data-type NUMBER

# Due Date field
gh project field-create $PROJECT_NUM --owner @me \
  --name "Due Date" \
  --data-type DATE

echo "Custom fields created!"

# 4. Add some items
echo "Creating draft issues..."

gh project item-create $PROJECT_NUM --owner @me \
  --title "Setup CI/CD pipeline" \
  --body "Configure GitHub Actions for automated testing and deployment"

gh project item-create $PROJECT_NUM --owner @me \
  --title "Implement user authentication" \
  --body "Add OAuth2 authentication with Google and GitHub providers"

gh project item-create $PROJECT_NUM --owner @me \
  --title "Design API documentation system" \
  --body "Choose and implement API documentation tool (OpenAPI/Swagger)"

echo "Project setup complete!"
echo "View at: https://github.com/users/danmestas/projects/$PROJECT_NUM"
```

---

## Advanced Configuration

### Using GraphQL API Directly

For operations not supported by CLI, use the GraphQL API:

```bash
# Query project data
gh api graphql -f query='
  query {
    user(login: "danmestas") {
      projectV2(number: 1) {
        title
        fields(first: 20) {
          nodes {
            ... on ProjectV2Field {
              id
              name
            }
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
              }
            }
          }
        }
      }
    }
  }
'
```

### Automation Examples

#### Auto-add Issues to Project

```bash
# Add all open bugs to project
gh issue list --label bug --json number,url | \
  jq -r '.[] | .url' | \
  while read url; do
    gh project item-add 1 --owner @me --url "$url"
  done
```

#### Bulk Update Items

```bash
# Move all "Done" status items to archived
gh project item-list 1 --owner @me --format json | \
  jq -r '.items[] | select(.status.name == "Done") | .id' | \
  while read item_id; do
    gh project item-archive --id "$item_id" --owner @me
  done
```

#### Create Issues from Template

```bash
# Create multiple issues from a list and add to project
cat <<EOF | while read title; do
  gh issue create --title "$title" --project "Roadmap" --label "enhancement"
done
Add dark mode support
Implement search functionality
Add export to PDF feature
Improve mobile responsiveness
EOF
```

### Integration with Scripts

```bash
#!/bin/bash
# Helper function to get field option ID by name
get_option_id() {
  local project_num=$1
  local field_name=$2
  local option_name=$3

  gh project field-list "$project_num" --owner @me --format json | \
    jq -r ".fields[] | select(.name == \"$field_name\") | .options[] | select(.name == \"$option_name\") | .id"
}

# Usage
PRIORITY_HIGH_ID=$(get_option_id 1 "Priority" "High")
echo "Priority High ID: $PRIORITY_HIGH_ID"
```

---

## Key Limitations & Workarounds

### Limitations

1. **Cannot modify existing SINGLE_SELECT options** - Must delete field and recreate
2. **Cannot reorder fields** - Order is determined by creation time
3. **Cannot create field templates** - Must create fields per project
4. **Item updates require multiple IDs** - Must query IDs before updating
5. **No bulk operations** - Must loop through items individually

### Workarounds

```bash
# Workaround: Copy project structure to new project
# 1. Export field definitions from existing project
gh project field-list 1 --owner @me --format json > fields.json

# 2. Create new project
NEW_PROJECT=$(gh project create --owner @me --title "New Project" --format json | jq -r '.number')

# 3. Recreate fields
jq -r '.fields[] | select(.type == "ProjectV2SingleSelectField") |
  "--name \"" + .name + "\" --data-type SINGLE_SELECT --single-select-options \"" +
  (.options | map(.name) | join(",")) + "\""' fields.json | \
  while read args; do
    gh project field-create $NEW_PROJECT --owner @me $args
  done
```

---

## Summary

**Yes, you can fully configure projects via CLI!** Including:

✅ Create projects with custom titles, descriptions, visibility
✅ Add custom fields (TEXT, SINGLE_SELECT, DATE, NUMBER)
✅ Create "Status" columns using SINGLE_SELECT fields
✅ Add/remove items (issues, PRs, draft issues)
✅ Update item field values programmatically
✅ Link projects to repositories and teams
✅ Automate project management workflows

**The modern GitHub Projects (V2) replaced "columns" with flexible custom fields**, where SINGLE_SELECT fields act as dropdown columns (like Status, Priority, Sprint, etc.).

All fields can be managed programmatically, making it perfect for automation and CI/CD integration!
