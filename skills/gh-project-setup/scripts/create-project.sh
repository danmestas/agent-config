#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_DIR="$SCRIPT_DIR/../../gh-project-shared/scripts"

# Source shared utilities
source "$SHARED_DIR/gh-check.sh"
source "$SHARED_DIR/gh-auth.sh"
source "$SHARED_DIR/config-manager.sh"
source "$SHARED_DIR/error-handler.sh"

# Check prerequisites
check_gh_installed || exit 1
check_gh_authenticated || exit 1
check_project_scope || exit 1

# Parse arguments
TITLE="$1"
OWNER="${2:-@me}"
shift 2 2>/dev/null || true
REPOS=("$@")

if [ -z "$TITLE" ]; then
  echo "Usage: $0 <title> [owner] [repos...]" >&2
  exit 1
fi

# Issue 1 fix: Validate OWNER format to prevent ambiguity
if [ "$OWNER" != "@me" ] && ! [[ "$OWNER" =~ ^(@|[a-zA-Z0-9][a-zA-Z0-9-]*)$ ]]; then
  echo "Error: Invalid owner format '$OWNER'. Owner must be '@me', '@org', or alphanumeric with hyphens." >&2
  exit 1
fi

# Detect owner type
OWNER_TYPE="user"
if [ "$OWNER" != "@me" ]; then
  # Issue 5 fix: Check if API call succeeded before proceeding
  API_RESPONSE=$(gh api "/users/$OWNER" 2>/dev/null)
  if [ $? -eq 0 ] && echo "$API_RESPONSE" | jq -e '.type == "Organization"' >/dev/null 2>&1; then
    OWNER_TYPE="org"
    echo "Creating organization project for $OWNER" >&2
  elif [ $? -ne 0 ]; then
    echo "Warning: Unable to verify owner '$OWNER', assuming user type" >&2
  fi
fi

# Create project
echo "Creating project: $TITLE" >&2
# Issue 2 fix: Check exit code and validate PROJECT_JSON is not empty
if ! PROJECT_JSON=$(gh project create --owner "$OWNER" --title "$TITLE" --format json); then
  echo "Error: Failed to create project" >&2
  exit 1
fi

if [ -z "$PROJECT_JSON" ]; then
  echo "Error: Project creation returned empty response" >&2
  exit 1
fi

PROJECT_NUM=$(echo "$PROJECT_JSON" | jq -r '.number')
PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.id')

# Issue 6 fix: Validate PROJECT_NUM and PROJECT_ID
if [ "$PROJECT_NUM" = "null" ] || [ -z "$PROJECT_NUM" ]; then
  echo "Error: Failed to extract project number from response" >&2
  exit 1
fi

if [ "$PROJECT_ID" = "null" ] || [ -z "$PROJECT_ID" ]; then
  echo "Error: Failed to extract project ID from response" >&2
  exit 1
fi

echo "Project created: #$PROJECT_NUM (ID: $PROJECT_ID)" >&2

# Link repositories
if [ "$OWNER_TYPE" = "user" ] && [ ${#REPOS[@]} -eq 0 ]; then
  # User project, no explicit repos: link current repo
  echo "Linking current repository..." >&2
  # Issue 3 & 4 fix: Get full repo slug in OWNER/REPO format
  CURRENT_REPO_OWNER=$(gh repo view --json owner -q .owner.login 2>/dev/null)
  CURRENT_REPO_NAME=$(gh repo view --json name -q .name 2>/dev/null)

  if [ -n "$CURRENT_REPO_OWNER" ] && [ -n "$CURRENT_REPO_NAME" ]; then
    CURRENT_REPO_SLUG="$CURRENT_REPO_OWNER/$CURRENT_REPO_NAME"
    gh project link "$PROJECT_NUM" --owner "$OWNER" --repo "$CURRENT_REPO_SLUG" 2>/dev/null || true
    REPOS=("$CURRENT_REPO_SLUG")
  else
    echo "Warning: Unable to determine current repository" >&2
  fi
elif [ ${#REPOS[@]} -gt 0 ]; then
  # Multiple repos specified: link each one
  echo "Linking repositories: ${REPOS[*]}" >&2
  for repo in "${REPOS[@]}"; do
    gh project link "$PROJECT_NUM" --owner "$OWNER" --repo "$repo" || echo "Warning: Failed to link $repo" >&2
  done
fi

# Output project info for next steps
echo "$PROJECT_JSON"
