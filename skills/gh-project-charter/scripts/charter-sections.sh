#!/bin/bash
# skills/gh-project-charter/scripts/charter-sections.sh
set -e

# Update (replace) content under a section heading
# Args: file, section_name (e.g. "Goals"), new_content
update_section() {
  local file="$1"
  local section="$2"
  local content="$3"

  awk -v section="## $section" -v content="$content" '
    $0 == section { print; in_section=1; next }
    in_section && /^---$/ { in_section=0; print content; print ""; print; next }
    in_section && /^## / { in_section=0; print content; print ""; print; next }
    in_section { next }
    { print }
  ' "$file" > "${file}.tmp"
  mv "${file}.tmp" "$file"
}

# Append content to a subsection (e.g. "In Scope" under "## Scope")
# Args: file, subsection_name, content
add_to_section() {
  local file="$1"
  local section="$2"
  local content="$3"

  awk -v section="### $section" -v content="$content" '
    $0 == section { print; in_section=1; next }
    in_section && /^###? / { print content; in_section=0; print; next }
    in_section && /^---$/ { print content; in_section=0; print; next }
    { print }
    END { if (in_section) print content }
  ' "$file" > "${file}.tmp"
  mv "${file}.tmp" "$file"
}

# Add a brand new section before Change Log
# Args: file, section_name, content
add_new_section() {
  local file="$1"
  local section="$2"
  local content="$3"

  awk -v section="## $section" -v content="$content" '
    /^## Change Log/ {
      print section
      print ""
      print content
      print ""
      print "---"
      print ""
    }
    { print }
  ' "$file" > "${file}.tmp"
  mv "${file}.tmp" "$file"
}

# Extract content from a section
# Args: file, section_name
# Outputs: section content (between ## heading and next ## or ---)
get_section() {
  local file="$1"
  local section="$2"

  awk -v section="## $section" '
    $0 == section { in_section=1; next }
    in_section && /^---$/ { exit }
    in_section && /^## / { exit }
    in_section { print }
  ' "$file"
}
