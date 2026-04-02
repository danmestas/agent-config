#!/bin/bash
# skills/gh-project-operations/scripts/coordinator.sh

# Detect if an operation suggests scope change
# Args: operation_type, value
detect_scope_change() {
  local op_type="$1"
  local value="$2"

  case "$op_type" in
    milestone)
      echo "Scope change detected: milestone set to '$value'"
      return 0
      ;;
    label)
      if echo "$value" | grep -qE "^(blocked|dependency|epic|initiative)$"; then
        echo "Scope change detected: label '$value' added"
        return 0
      fi
      ;;
  esac

  return 1
}

# Suggest charter update
# Args: operation_type, value
suggest_charter_update() {
  local op_type="$1"
  local value="$2"

  cat <<EOF
SUGGEST: Charter Update
  Reason: $op_type changed to '$value'
  Action: Consider updating project charter
  Skill: gh-project-charter
EOF
}
