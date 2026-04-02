#!/bin/bash
# skills/gh-project-operations/scripts/item-management.sh
# Set DRY_RUN=1 to echo commands instead of executing them.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../gh-project-shared/scripts/config-manager.sh" 2>/dev/null || true

_run_item_cmd() {
  if [ "${DRY_RUN:-}" = "1" ]; then
    echo "$1"
  else
    eval "$1" 2>&1
  fi
}

add_issue_to_project() {
  local project_num="$1"
  local issue_url="$2"

  local cmd="gh project item-add $project_num --owner @me --url \"$issue_url\""
  if [ "${DRY_RUN:-}" != "1" ]; then
    cmd="$cmd --format json"
  fi
  _run_item_cmd "$cmd"
}

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

  _run_item_cmd "$cmd"
}

archive_item() {
  local item_id="$1"
  local project_id=$(get_project_id)

  _run_item_cmd "gh project item-archive --id \"$item_id\" --owner @me --project-id \"$project_id\""
}

list_project_items() {
  local project_num="$1"
  local cmd="gh project item-list $project_num --owner @me --format json"

  if [ "${DRY_RUN:-}" = "1" ]; then
    echo "$cmd"
  else
    eval "$cmd" | jq '.'
  fi
}
