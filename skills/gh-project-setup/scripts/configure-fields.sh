#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_DIR="$SCRIPT_DIR/../../gh-project-shared/scripts"

source "$SHARED_DIR/gh-check.sh"
source "$SHARED_DIR/gh-auth.sh"
source "$SHARED_DIR/error-handler.sh"

check_gh_installed || exit 1
check_gh_authenticated || exit 1
check_project_scope || exit 1

# Parse arguments
PROJECT_NUM="$1"
OWNER="$2"
FIELD_NAME="$3"
FIELD_TYPE="$4"
FIELD_OPTIONS="$5"

if [ -z "$PROJECT_NUM" ] || [ -z "$OWNER" ] || [ -z "$FIELD_NAME" ] || [ -z "$FIELD_TYPE" ]; then
  echo "Usage: $0 <project_num> <owner> <field_name> <field_type> [options]" >&2
  exit 1
fi

# Create field
echo "Creating field: $FIELD_NAME ($FIELD_TYPE)" >&2

if [ "$FIELD_TYPE" = "SINGLE_SELECT" ]; then
  if [ -z "$FIELD_OPTIONS" ]; then
    echo "Error: SINGLE_SELECT requires options (comma-separated)" >&2
    exit 1
  fi

  FIELD_JSON=$(gh project field-create "$PROJECT_NUM" \
    --owner "$OWNER" \
    --name "$FIELD_NAME" \
    --data-type "$FIELD_TYPE" \
    --single-select-options "$FIELD_OPTIONS" \
    --format json)
else
  FIELD_JSON=$(gh project field-create "$PROJECT_NUM" \
    --owner "$OWNER" \
    --name "$FIELD_NAME" \
    --data-type "$FIELD_TYPE" \
    --format json)
fi

if [ -z "$FIELD_JSON" ]; then
  echo "Error: Field creation returned empty response" >&2
  exit 1
fi

echo "Field created successfully" >&2
echo "$FIELD_JSON"
