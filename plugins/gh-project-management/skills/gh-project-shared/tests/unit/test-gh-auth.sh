# skills/gh-project-shared/tests/unit/test-gh-auth.sh
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../scripts/gh-auth.sh" 2>/dev/null || true

PASS=0
FAIL=0

# Test check_gh_authenticated when gh auth status succeeds
if command -v gh &>/dev/null && gh auth status &>/dev/null; then
  if check_gh_authenticated >/dev/null 2>&1; then
    echo "✓ check_gh_authenticated returns 0 when authenticated"
    PASS=$((PASS + 1))
  else
    echo "✗ check_gh_authenticated should return 0 when authenticated"
    FAIL=$((FAIL + 1))
  fi
else
  echo "⊘ Skipping authenticated test (gh not authenticated)"
fi

# Test check_project_scope when scope exists
if command -v gh &>/dev/null && gh auth status 2>&1 | grep -q "project"; then
  if check_project_scope >/dev/null 2>&1; then
    echo "✓ check_project_scope returns 0 when scope present"
    PASS=$((PASS + 1))
  else
    echo "✗ check_project_scope should return 0 when scope present"
    FAIL=$((FAIL + 1))
  fi
else
  echo "⊘ Skipping project scope test (scope not present)"
fi

# Test check_gh_authenticated when not authenticated (negative test)
# Mock gh command to simulate unauthenticated state
if command -v gh &>/dev/null; then
  (
    PATH="/tmp/mock-gh:$PATH"
    mkdir -p /tmp/mock-gh
    cat > /tmp/mock-gh/gh <<'MOCK_EOF'
#!/bin/bash
if [ "$1" = "auth" ] && [ "$2" = "status" ]; then
  echo "You are not authenticated" >&2
  return 1
fi
MOCK_EOF
    chmod +x /tmp/mock-gh/gh

    if ! check_gh_authenticated >/dev/null 2>&1; then
      OUTPUT=$(check_gh_authenticated 2>&1 || true)
      if echo "$OUTPUT" | grep -q "ERROR: Authentication Required"; then
        echo "✓ check_gh_authenticated returns error with proper format when not authenticated"
        PASS=$((PASS + 1))
      else
        echo "✗ check_gh_authenticated error output missing expected format"
        FAIL=$((FAIL + 1))
      fi
    else
      echo "✗ check_gh_authenticated should fail when not authenticated"
      FAIL=$((FAIL + 1))
    fi
    rm -rf /tmp/mock-gh
  )
fi

# Test check_project_scope when scope is missing (negative test)
if command -v gh &>/dev/null; then
  (
    # Create mock gh that returns output without 'project' scope
    PATH="/tmp/mock-gh2:$PATH"
    mkdir -p /tmp/mock-gh2
    cat > /tmp/mock-gh2/gh <<'MOCK_EOF'
#!/bin/bash
if [ "$1" = "auth" ] && [ "$2" = "status" ]; then
  echo "Logged in to github.com as testuser (/Users/test/.config/gh/hosts.yml)"
  echo "Token scopes: repo, gist, read:org"
  return 0
fi
MOCK_EOF
    chmod +x /tmp/mock-gh2/gh

    if ! check_project_scope >/dev/null 2>&1; then
      OUTPUT=$(check_project_scope 2>&1 || true)
      if echo "$OUTPUT" | grep -q "ERROR: Missing Scope"; then
        echo "✓ check_project_scope returns error with proper format when project scope missing"
        PASS=$((PASS + 1))
      else
        echo "✗ check_project_scope error output missing expected format"
        FAIL=$((FAIL + 1))
      fi
    else
      echo "✗ check_project_scope should fail when project scope is missing"
      FAIL=$((FAIL + 1))
    fi
    rm -rf /tmp/mock-gh2
  )
fi

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
