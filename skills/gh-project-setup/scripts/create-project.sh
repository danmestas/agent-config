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

# Detect owner type
OWNER_TYPE="user"
if [ "$OWNER" != "@me" ]; then
  if gh api "/users/$OWNER" 2>/dev/null | jq -e '.type == "Organization"' >/dev/null; then
    OWNER_TYPE="org"
    echo "Creating organization project for $OWNER"
  fi
fi

# Create project
echo "Creating project: $TITLE"
PROJECT_JSON=$(gh project create --owner "$OWNER" --title "$TITLE" --format json)
PROJECT_NUM=$(echo "$PROJECT_JSON" | jq -r '.number')
PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.id')

echo "Project created: #$PROJECT_NUM (ID: $PROJECT_ID)"

# Link repositories
if [ "$OWNER_TYPE" = "user" ] && [ ${#REPOS[@]} -eq 0 ]; then
  # User project, no explicit repos: link current repo
  echo "Linking current repository..."
  gh project link "$PROJECT_NUM" --owner "$OWNER" 2>/dev/null || true
  REPOS=($(basename "$(git rev-parse --show-toplevel)"))
elif [ ${#REPOS[@]} -gt 0 ]; then
  # Multiple repos specified: link each one
  echo "Linking repositories: ${REPOS[*]}"
  for repo in "${REPOS[@]}"; do
    gh project link "$PROJECT_NUM" --owner "$OWNER" --repo "$repo" || echo "Warning: Failed to link $repo"
  done
fi

# Output project info for next steps
echo "$PROJECT_JSON"
