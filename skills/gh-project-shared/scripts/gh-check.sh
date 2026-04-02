#!/bin/bash
# skills/gh-project-shared/scripts/gh-check.sh
set -e

# Check if gh CLI is installed
check_gh_installed() {
  if ! command -v gh &>/dev/null; then
    cat >&2 <<EOF
ERROR: Prerequisite Missing
Message: GitHub CLI (gh) is not installed
Suggested Action: Install with: brew install gh (macOS) or see https://github.com/cli/cli#installation
EOF
    return 1
  fi

  # Check version
  local version
  version=$(gh --version 2>&1 | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
  if [ -z "$version" ]; then
    echo "Warning: Could not parse gh CLI version" >&2
    return 0
  fi
  echo "Found gh CLI version: $version" >&2
  return 0
}
