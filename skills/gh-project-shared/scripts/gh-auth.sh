# skills/gh-project-shared/scripts/gh-auth.sh
#!/bin/bash
set -e

# Check if gh is authenticated
check_gh_authenticated() {
  if ! gh auth status &>/dev/null; then
    cat >&2 <<EOF
ERROR: Authentication Required
Message: Not authenticated with GitHub
Suggested Action: Run: gh auth login --web
EOF
    return 1
  fi

  echo "GitHub authentication: OK" >&2
  return 0
}

# Check if 'project' scope is available
check_project_scope() {
  local scopes
  scopes=$(gh auth status 2>&1 | grep "Token scopes:" | cut -d: -f2-)

  # Validate that scope extraction succeeded
  if [ -z "$scopes" ]; then
    cat >&2 <<EOF
ERROR: Scope Detection Failed
Message: Unable to extract token scopes from gh auth status
Suggested Action: Ensure gh is properly authenticated and try again
EOF
    return 1
  fi

  # Use exact matching with quotes to avoid false positives (e.g., admin:project_v2, projects)
  if ! echo "$scopes" | grep -q "'project'"; then
    cat >&2 <<EOF
ERROR: Missing Scope
Message: GitHub token missing 'project' scope
Suggested Action: Run: gh auth refresh -s project
EOF
    return 1
  fi

  echo "Project scope: OK" >&2
  return 0
}
