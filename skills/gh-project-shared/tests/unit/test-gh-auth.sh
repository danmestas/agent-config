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

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
