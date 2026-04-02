# skills/gh-project-shared/tests/unit/test-gh-check.sh
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../scripts/gh-check.sh" 2>/dev/null || true

PASS=0
FAIL=0

# Test check_gh_installed when gh exists
if command -v gh &>/dev/null; then
  if check_gh_installed >/dev/null 2>&1; then
    echo "✓ check_gh_installed returns 0 when gh installed"
    PASS=$((PASS + 1))
  else
    echo "✗ check_gh_installed should return 0 when gh installed"
    FAIL=$((FAIL + 1))
  fi
else
  echo "⊘ Skipping gh installed test (gh not in PATH)"
fi

# Test check_gh_installed when gh is not found
OLD_PATH="$PATH"
export PATH="/usr/bin:/bin"
error_output=$(check_gh_installed 2>&1 || echo "EXIT_CODE_1")
export PATH="$OLD_PATH"

if echo "$error_output" | grep -q "EXIT_CODE_1"; then
  echo "✓ check_gh_installed returns 1 when gh not found"
  PASS=$((PASS + 1))
else
  echo "✗ check_gh_installed should return 1 when gh not found"
  FAIL=$((FAIL + 1))
fi

if echo "$error_output" | grep -q "ERROR: Prerequisite Missing"; then
  echo "✓ Error message contains 'ERROR: Prerequisite Missing'"
  PASS=$((PASS + 1))
else
  echo "✗ Error message should contain 'ERROR: Prerequisite Missing'"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
