# skills/gh-project-shared/scripts/config-manager.sh
#!/bin/bash
set -e

CONFIG_FILE=".github/project-config.json"

get_project_id() {
  local project_num=$1
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file not found: $CONFIG_FILE" >&2
    return 1
  fi
  local project_id
  project_id=$(jq -r --argjson num "$project_num" '.projects[] | select(.number == $num) | .id' "$CONFIG_FILE")
  if [ -z "$project_id" ] || [ "$project_id" = "null" ]; then
    echo "Error: Project $project_num not found in config" >&2
    return 1
  fi
  echo "$project_id"
  return 0
}

get_project_config() {
  local project_num=$1
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file not found: $CONFIG_FILE" >&2
    return 1
  fi
  local config
  config=$(jq --argjson num "$project_num" '.projects[] | select(.number == $num)' "$CONFIG_FILE")
  if [ -z "$config" ] || [ "$config" = "null" ]; then
    echo "Error: Project $project_num not found in config" >&2
    return 1
  fi
  echo "$config"
  return 0
}

save_project_config() {
  local project_data=$1

  # Validate input
  if [ -z "$project_data" ]; then
    echo "Error: project_data cannot be empty" >&2
    return 1
  fi

  # Validate JSON format
  if ! echo "$project_data" | jq empty 2>/dev/null; then
    echo "Error: project_data is not valid JSON" >&2
    return 1
  fi

  mkdir -p .github
  if [ ! -f "$CONFIG_FILE" ]; then
    echo '{"version": "1.0", "projects": []}' > "$CONFIG_FILE"
  fi
  local project_num
  project_num=$(echo "$project_data" | jq -r '.number')
  if jq -e ".projects[] | select(.number == $project_num)" "$CONFIG_FILE" >/dev/null 2>&1; then
    local temp_file
    temp_file=$(mktemp)
    jq ".projects |= map(if .number == $project_num then $project_data else . end)" "$CONFIG_FILE" > "$temp_file"
    mv "$temp_file" "$CONFIG_FILE"
  else
    local temp_file
    temp_file=$(mktemp)
    jq ".projects += [$project_data]" "$CONFIG_FILE" > "$temp_file"
    mv "$temp_file" "$CONFIG_FILE"
  fi
  echo "Config saved successfully" >&2
  return 0
}

validate_config_file() {
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file not found: $CONFIG_FILE" >&2
    return 1
  fi
  if ! jq empty "$CONFIG_FILE" 2>/dev/null; then
    echo "Error: Invalid JSON in $CONFIG_FILE" >&2
    return 1
  fi
  if ! jq -e '.version' "$CONFIG_FILE" >/dev/null 2>&1; then
    echo "Error: Config missing 'version' field" >&2
    return 1
  fi
  if ! jq -e '.projects' "$CONFIG_FILE" >/dev/null 2>&1; then
    echo "Error: Config missing 'projects' array" >&2
    return 1
  fi
  echo "Config validation: OK" >&2
  return 0
}

get_field_id() {
  local project_num=$1
  local field_name=$2
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file not found: $CONFIG_FILE" >&2
    return 1
  fi
  local field_key="${field_name}_field_id"
  local field_id
  field_id=$(jq -r --argjson num "$project_num" --arg key "$field_key" \
    '.projects[] | select(.number == $num) | .fields[$key]' "$CONFIG_FILE")
  if [ -z "$field_id" ] || [ "$field_id" = "null" ]; then
    echo "Error: Field '$field_name' not found for project $project_num" >&2
    return 1
  fi
  echo "$field_id"
  return 0
}

get_field_option_id() {
  local project_num=$1
  local field_name=$2
  local option_name=$3
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file not found: $CONFIG_FILE" >&2
    return 1
  fi
  local option_id
  option_id=$(jq -r --argjson num "$project_num" --arg fn "$field_name" --arg on "$option_name" \
    '.projects[] | select(.number == $num) | .field_options[$fn][$on]' "$CONFIG_FILE")
  if [ -z "$option_id" ] || [ "$option_id" = "null" ]; then
    echo "Error: Option '$option_name' not found for field '$field_name'" >&2
    return 1
  fi
  echo "$option_id"
  return 0
}
