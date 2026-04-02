#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_DIR="$SCRIPT_DIR/../../gh-project-shared/scripts"
TEMPLATES_DIR="$SCRIPT_DIR/../templates"

source "$SHARED_DIR/gh-check.sh"
source "$SHARED_DIR/gh-auth.sh"
source "$SHARED_DIR/config-manager.sh"
source "$SHARED_DIR/error-handler.sh"

check_gh_installed || exit 1
check_gh_authenticated || exit 1
check_project_scope || exit 1

# Parse arguments
PROJECT_NUM="$1"
OWNER="$2"
TEMPLATE_NAME="$3"

if [ -z "$PROJECT_NUM" ] || [ -z "$OWNER" ] || [ -z "$TEMPLATE_NAME" ]; then
  echo "Usage: $0 <project_num> <owner> <template_name>" >&2
  exit 1
fi

# Validate PROJECT_NUM is numeric (Issue 5)
if ! [[ "$PROJECT_NUM" =~ ^[0-9]+$ ]]; then
  echo "Error: PROJECT_NUM must be numeric" >&2
  exit 1
fi

# Load template
TEMPLATE_FILE="$TEMPLATES_DIR/${TEMPLATE_NAME}.json"
if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "Error: Template not found: $TEMPLATE_FILE" >&2
  exit 1
fi

TEMPLATE=$(cat "$TEMPLATE_FILE")
echo "Applying template: $(echo "$TEMPLATE" | jq -r '.display_name')"

# Get project ID
PROJECT_ID=$(gh project view "$PROJECT_NUM" --owner "$OWNER" --format json | jq -r '.id')

# Parse fields from template
FIELDS=$(echo "$TEMPLATE" | jq -r '.fields[]')
OVERRIDES=$(echo "$TEMPLATE" | jq -r '.field_overrides // {}')

# Track created field IDs for config
declare -A FIELD_IDS
declare -A FIELD_OPTIONS
declare -A SKIP_FIELDS

# First pass: identify fields to skip due to 'replaces' (Issue 1)
while IFS= read -r field; do
  [ -z "$field" ] && continue
  OVERRIDE=$(echo "$OVERRIDES" | jq -r ".$field // null")
  if [ "$OVERRIDE" != "null" ]; then
    REPLACES=$(echo "$OVERRIDE" | jq -r '.replaces // ""')
    if [ -n "$REPLACES" ]; then
      SKIP_FIELDS[$REPLACES]=1
      echo "Note: $field will replace $REPLACES" >&2
    fi
  fi
done < <(echo "$TEMPLATE" | jq -r '.fields[]?')

# Second pass: create fields (Issue 4: use while read instead of for loop)
while IFS= read -r field; do
  [ -z "$field" ] && continue

  # Check if this field should be skipped due to 'replaces' (Issue 1)
  if [ "${SKIP_FIELDS[$field]:-}" = "1" ]; then
    echo "Skipping $field (replaced by override)" >&2
    continue
  fi
  # Check if this field has an override
  OVERRIDE=$(echo "$OVERRIDES" | jq -r ".$field // null")

  if [ "$OVERRIDE" != "null" ]; then
    # Custom field with override (supports both 'replaces' and 'adds_to' semantics)
    # - replaces: Skip base field (handled above), create only override
    # - adds_to: Create both base field and override (implicit - Issue 7)
    FIELD_TYPE=$(echo "$OVERRIDE" | jq -r '.type')
    OPTIONS=$(echo "$OVERRIDE" | jq -r '.options | join(",")')

    echo "Creating custom field: $field ($FIELD_TYPE)"
    FIELD_JSON=$(bash "$SCRIPT_DIR/configure-fields.sh" "$PROJECT_NUM" "$OWNER" "$field" "$FIELD_TYPE" "$OPTIONS")

    FIELD_ID=$(echo "$FIELD_JSON" | jq -r '.id')
    FIELD_IDS[$field]=$FIELD_ID

    # Store option IDs with :: separator (Issue 2, Issue 3)
    while IFS='|' read -r opt_name opt_id; do
      FIELD_OPTIONS["${field,,}::${opt_name,,}"]=$opt_id
    done < <(echo "$FIELD_JSON" | jq -r '.options[]? | "\(.name)|\(.id)"')

  elif [ "$field" = "Status" ]; then
    # Built-in Status field - get existing field ID
    echo "Using built-in Status field"
    STATUS_FIELD_ID=$(gh project field-list "$PROJECT_NUM" --owner "$OWNER" --format json | jq -r '.fields[] | select(.name == "Status") | .id')
    FIELD_IDS[Status]=$STATUS_FIELD_ID

    # Get Status field options with :: separator (Issue 3)
    while IFS='|' read -r opt_name opt_id; do
      FIELD_OPTIONS["status::${opt_name,,}"]=$opt_id
    done < <(gh project field-list "$PROJECT_NUM" --owner "$OWNER" --format json | \
      jq -r '.fields[] | select(.name == "Status") | .options[]? | "\(.name)|\(.id)"')

  else
    # Standard field to create
    FIELD_TYPE="SINGLE_SELECT"

    case "$field" in
      Priority)
        OPTIONS="High,Medium,Low"
        ;;
      Size)
        OPTIONS="XS,S,M,L,XL"
        ;;
      Type)
        OPTIONS="Bug,Feature,Improvement,Spike"
        ;;
      *)
        echo "Warning: Unknown field $field, skipping" >&2
        continue
        ;;
    esac

    echo "Creating field: $field ($FIELD_TYPE)"
    FIELD_JSON=$(bash "$SCRIPT_DIR/configure-fields.sh" "$PROJECT_NUM" "$OWNER" "$field" "$FIELD_TYPE" "$OPTIONS")

    FIELD_ID=$(echo "$FIELD_JSON" | jq -r '.id')
    FIELD_IDS[$field]=$FIELD_ID

    # Store option IDs with :: separator (Issue 2, Issue 3)
    while IFS='|' read -r opt_name opt_id; do
      FIELD_OPTIONS["${field,,}::${opt_name,,}"]=$opt_id
    done < <(echo "$FIELD_JSON" | jq -r '.options[]? | "\(.name)|\(.id)"')
  fi
done < <(echo "$TEMPLATE" | jq -r '.fields[]?')

# Save configuration
CONFIG_DATA=$(jq -n \
  --arg id "$PROJECT_ID" \
  --argjson num "$PROJECT_NUM" \
  --arg title "$(gh project view "$PROJECT_NUM" --owner "$OWNER" --format json | jq -r '.title')" \
  --arg owner "$OWNER" \
  --arg template "$TEMPLATE_NAME" \
  --arg repos "${REPOS:-$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || echo '')}" \
  --arg created "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  '{
    id: $id,
    number: $num,
    title: $title,
    owner: $owner,
    template: $template,
    linked_repos: ($repos | split(",") | map(select(. != ""))),
    created_at: $created,
    fields: {},
    field_options: {},
    coordination: {
      charter_suggested: false,
      last_scope_check: $created,
      skip_charter_prompts: false
    }
  }')

# Add field IDs to config
for field_name in "${!FIELD_IDS[@]}"; do
  field_id="${FIELD_IDS[$field_name]}"
  CONFIG_DATA=$(echo "$CONFIG_DATA" | jq --arg fn "${field_name,,}" --arg fid "$field_id" '.fields["\($fn)_field_id"] = $fid')
done

# Add field option IDs to config
for key in "${!FIELD_OPTIONS[@]}"; do
  opt_id="${FIELD_OPTIONS[$key]}"
  # Parse field name and option name from key (format: fieldname::optionname) (Issue 3)
  IFS='::' read -r field_part opt_part <<< "$key"
  CONFIG_DATA=$(echo "$CONFIG_DATA" | jq --arg fp "$field_part" --arg op "$opt_part" --arg oid "$opt_id" '.field_options[$fp] += {($op): $oid}')
done

# Save to config file
source "$SHARED_DIR/config-manager.sh"
save_project_config "$CONFIG_DATA"

echo "Template applied successfully"
echo "Configuration saved to .github/project-config.json"
