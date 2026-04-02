# skills/gh-project-shared/scripts/gh-check.sh
#!/bin/bash
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
  version=$(gh --version 2>&1 | head -1 | awk '{print $3}')
  echo "Found gh CLI version: $version" >&2
  return 0
}
