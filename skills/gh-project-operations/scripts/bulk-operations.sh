#!/bin/bash
# skills/gh-project-operations/scripts/bulk-operations.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/issue-crud.sh" 2>/dev/null || true
source "$SCRIPT_DIR/item-management.sh" 2>/dev/null || true

# Bulk create issues
# Args: mode (array|csv|json), data
bulk_create_issues() {
  local mode="$1"
  shift

  local count=0

  case "$mode" in
    array)
      local arr_name="$1"
      local arr_ref="${arr_name}[@]"
      local data=("${!arr_ref}")
      for item in "${data[@]}"; do
        IFS='|' read -r title body labels <<< "$item"
        echo "Creating: $title"
        create_issue "$title" "$body" "$labels" ""
        count=$((count + 1))
      done
      ;;
    csv)
      local csv_file="$1"
      import_from_csv "$csv_file"
      return $?
      ;;
    *)
      echo "ERROR: Unknown mode: $mode" >&2
      return 1
      ;;
  esac

  echo "Created $count issues"
}

# Bulk update status
# Args: project_num, from_status, to_status
bulk_update_status() {
  local project_num="$1"
  local from_status="$2"
  local to_status="$3"

  # Input validation
  if [ -z "$project_num" ]; then
    echo "Error: project_num is required" >&2
    return 1
  fi

  if [ -z "$from_status" ]; then
    echo "Error: from_status is required" >&2
    return 1
  fi

  if [ -z "$to_status" ]; then
    echo "Error: to_status is required" >&2
    return 1
  fi

  echo "Updating items from '$from_status' to '$to_status'"

  local items=$(list_project_items "$project_num" 2>/dev/null | jq -r ".items[] | select(.fieldValues.Status == \"$from_status\") | .id" 2>/dev/null)

  local count=0
  while IFS= read -r item_id; do
    if [ -n "$item_id" ]; then
      echo "Updating item $item_id to '$to_status'"
      update_item_field "$item_id" "Status" "$to_status" "SINGLE_SELECT"
      count=$((count + 1))
    fi
  done <<< "$items"

  echo "Updated $count items from '$from_status' to '$to_status'"
}

# Bulk archive completed items
# Args: project_num
bulk_archive_completed() {
  local project_num="$1"

  # Input validation
  if [ -z "$project_num" ]; then
    echo "Error: project_num is required" >&2
    return 1
  fi

  echo "Archiving completed items from project $project_num"

  local items=$(list_project_items "$project_num" 2>/dev/null | jq -r '.items[] | select(.fieldValues.Status == "Done") | .id' 2>/dev/null)

  local count=0
  while IFS= read -r item_id; do
    if [ -n "$item_id" ]; then
      echo "Archiving item $item_id"
      archive_item "$item_id"
      count=$((count + 1))
    fi
  done <<< "$items"

  echo "Archived $count completed items"
}

# Import from CSV
# Args: csv_file
import_from_csv() {
  local csv_file="$1"

  if [ ! -f "$csv_file" ]; then
    echo "ERROR: File not found: $csv_file" >&2
    return 1
  fi

  local count=0
  local line_num=0

  echo "Importing from $csv_file"

  while IFS=',' read -r title body labels; do
    line_num=$((line_num + 1))

    # Skip header
    if [ $line_num -eq 1 ]; then
      continue
    fi

    echo "Importing: $title"
    create_issue "$title" "$body" "$labels" ""
    count=$((count + 1))
  done < "$csv_file"

  echo "Imported $count issues from CSV"
}

# Export to CSV
# Args: project_num, output_file
export_to_csv() {
  local project_num="$1"
  local output_file="$2"

  # Input validation
  if [ -z "$project_num" ]; then
    echo "Error: project_num is required" >&2
    return 1
  fi

  if [ -z "$output_file" ]; then
    echo "Error: output_file is required" >&2
    return 1
  fi

  echo "Exporting project $project_num..."
  local items=$(list_project_items "$project_num" 2>/dev/null)

  # Write header
  echo "id,title,status,labels" > "$output_file"

  # Write items (note: fixed jq closing paren from plan typo)
  echo "$items" | jq -r '.items[] | [.id, .title, .fieldValues.Status, (.labels | join(";"))] | @csv' >> "$output_file" 2>/dev/null

  local count=$(echo "$items" | jq '.items | length' 2>/dev/null || echo "0")
  echo "Exported $count items to $output_file"
}
