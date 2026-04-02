#!/bin/bash
# skills/gh-project-charter/scripts/charter-create.sh
set -e

CHARTER_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHARTER_TEMPLATE_DIR="$CHARTER_SCRIPT_DIR/../templates"

# Generate a project charter from the template
# Args: name, project_num, purpose
generate_charter() {
  local name="$1"
  local num="$2"
  local purpose="$3"
  local template="$CHARTER_TEMPLATE_DIR/charter-minimal.md"
  local output_dir="docs"
  local output_file="$output_dir/project-charter.md"

  if [ ! -f "$template" ]; then
    echo "ERROR: Template not found: $template" >&2
    return 1
  fi

  mkdir -p "$output_dir"

  # Read template and substitute placeholders
  local content
  content=$(populate_template "$template" "$name" "$num")

  # Replace goals placeholder with purpose if provided
  if [ -n "$purpose" ]; then
    content=$(echo "$content" | sed "s|{{GOALS_PLACEHOLDER}}|$purpose|g")
  fi

  # Clear remaining placeholders
  content=$(echo "$content" | sed 's|{{IN_SCOPE_PLACEHOLDER}}|*To be defined*|g')
  content=$(echo "$content" | sed 's|{{OUT_OF_SCOPE_PLACEHOLDER}}|*To be defined*|g')
  content=$(echo "$content" | sed 's|{{SUCCESS_CRITERIA_PLACEHOLDER}}|*To be defined*|g')

  echo "$content" > "$output_file"
  echo "Generated charter: $output_file"
}

# Replace template placeholders with actual values
# Args: template_file, name, project_num
populate_template() {
  local template="$1"
  local name="$2"
  local num="$3"
  local date
  date=$(date +%Y-%m-%d)

  sed -e "s|{{PROJECT_NAME}}|$name|g" \
      -e "s|{{PROJECT_NUM}}|$num|g" \
      -e "s|{{DATE}}|$date|g" \
      "$template"
}

# Add an entry to the Change Log section
# Args: charter_file, entry_text
add_changelog_entry() {
  local charter_file="$1"
  local entry="$2"
  local date
  date=$(date +%Y-%m-%d)

  awk -v entry="### $date - $entry" '
    /^## Change Log/ { print; getline; print; print entry; next }
    { print }
  ' "$charter_file" > "${charter_file}.tmp"
  mv "${charter_file}.tmp" "$charter_file"
}
