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

  if ! echo "$scopes" | grep -q "project"; then
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
