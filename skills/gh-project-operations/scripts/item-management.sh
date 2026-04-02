#!/bin/bash
# skills/gh-project-operations/scripts/item-management.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../gh-project-shared/scripts/config-manager.sh" 2>/dev/null || true

# Add issue to project
# Args: project_num, issue_url
add_issue_to_project() {
  local project_num="$1"
  local issue_url="$2"

  echo "gh project item-add $project_num --owner @me --url \"$issue_url\""
}

# Update item field value
# Args: item_id, field_name, value, field_type
update_item_field() {
  local item_id="$1"
  local field_name="$2"
  local value="$3"
  local field_type="$4"

  local project_id=$(get_project_id)
  local field_id=$(get_field_id "$field_name")

  local cmd="gh project item-edit --id \"$item_id\" --project-id \"$project_id\" --field-id \"$field_id\""

  case "$field_type" in
    SINGLE_SELECT)
      local option_id=$(get_field_option_id "$field_name" "$value")
      cmd="$cmd --single-select-option-id \"$option_id\""
      ;;
    TEXT)
      cmd="$cmd --text \"$value\""
      ;;
    DATE)
      cmd="$cmd --date \"$value\""
      ;;
    NUMBER)
      cmd="$cmd --number $value"
      ;;
  esac

  echo "$cmd"
}

# Archive an item
# Args: item_id
archive_item() {
  local item_id="$1"
  local project_id=$(get_project_id)

  echo "gh project item-archive --id \"$item_id\" --owner @me --project-id \"$project_id\""
}

# List all items in project
# Args: project_num
list_project_items() {
  local project_num="$1"
  echo "gh project item-list $project_num --owner @me --format json"
}
