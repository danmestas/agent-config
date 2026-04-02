# skills/gh-project-shared/scripts/error-handler.sh
#!/bin/bash
set -e

ERROR_LOG=".github/project-errors.log"

log_error() {
  local message=$1
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  mkdir -p .github
  echo "[$timestamp] $message" >> "$ERROR_LOG"
}

handle_error() {
  local exit_code=$1
  local message=$2
  local context=$3
  log_error "Exit code: $exit_code | Message: $message | Context: $context"
  echo "Error: $message" >&2
  if [ -n "$context" ]; then
    echo "Context: $context" >&2
  fi
  exit "$exit_code"
}

output_error() {
  local category=$1
  local message=$2
  local suggested_action=$3
  cat >&2 <<EOF
ERROR: $category
Message: $message
Suggested Action: $suggested_action
EOF
}

require_prerequisite() {
  local check_command=$1
  local error_message=$2
  local installation_guide=$3
  # SAFETY: check_command should only contain hardcoded strings, never user input.
  # This eval is safe when called from our scripts (e.g., "command -v gh").
  if ! eval "$check_command" &>/dev/null; then
    output_error "Prerequisite Missing" "$error_message" "$installation_guide"
    log_error "Prerequisite check failed: $error_message"
    exit 1
  fi
}
